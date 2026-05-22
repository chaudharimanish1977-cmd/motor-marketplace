/**
 * Audit pipeline — the shared engine that turns a PDF buffer into a
 * saved ParsedPolicy + PolicyReport.
 *
 * Called by:
 *   · /api/parse            (web upload — drag-drop dropzone)
 *   · /api/inbound/email    (email forward via Postmark)
 *
 * Each caller handles its own input shaping (form data vs webhook
 * payload), session handling (cookies vs sender email), and response
 * formatting. This helper is the part both share: extract text,
 * classify, parse, save, generate report, return outcome.
 *
 * Keeping the audit logic in one place means a fix to the classifier
 * threshold, a tweak to the DPDP stamp, or a change to how PDFs are
 * archived in Blob lands in both channels automatically. Drift between
 * web-upload audits and email-forward audits would be a real risk
 * otherwise.
 */

import { randomUUID } from "crypto";
import { extractPdfText } from "@/lib/pdf-parser";
import {
  classifyPolicy,
  rejectionMessage,
  type PolicyCategory,
} from "@/lib/policy-classifier";
import { extractPolicyFromText } from "@/lib/policy-extractor";
import { generateReport } from "@/lib/report-generator";
import { storePolicyPdf } from "@/lib/blob-store";
import { appendRow, findOne, updateById, Tables } from "@/lib/db";
import type { ParsedPolicy, PolicyReport, User } from "@/lib/types";

export type AuditPipelineSource = "web-upload" | "email-forward";

export interface AuditPipelineArgs {
  /** Raw PDF bytes. Caller is responsible for size + type validation
   *  before calling — the pipeline assumes a valid PDF buffer. */
  pdfBuffer: Buffer;
  /** Owner email — stamped onto ParsedPolicy.owner.email and used to
   *  upsert a User row with DPDP consent. May be empty (web-upload
   *  before sign-in); the pipeline runs without it but no User row
   *  upsert happens. */
  ownerEmail?: string;
  /** Original filename if known. Saved to ParsedPolicy.uploadedPdfFileName. */
  fileName?: string;
  /** Which channel did this PDF arrive through. Used for log prefixes
   *  today; could drive per-channel analytics later. */
  source: AuditPipelineSource;
}

export type AuditPipelineResult =
  | {
      kind: "audited";
      parsedPolicyId: string;
      policyReportId: string | null;
      documentType: "policy" | "quote";
      vehicleLabel: string;
    }
  | {
      kind: "rejected";
      /** classifier's category (eg "two-wheeler", "commercial-vehicle") */
      category: PolicyCategory;
      /** human-readable rejection copy ready to show or email */
      headline: string;
      body: string;
      vehicleClass?: string;
    }
  | {
      kind: "unreadable";
      /** sub-reason: "scanned-image" today; room to grow */
      category: "scanned-image";
      headline: string;
      body: string;
    };

/**
 * Run the audit pipeline on a single PDF.
 *
 * Result-shape mirrors what /api/parse historically returned in its
 * error body so callers can build either a JSON response (web upload)
 * or an editorial email reply (email forward) from the same outcome.
 *
 * Failures inside the pipeline that are NOT meaningful customer-
 * facing rejections (eg Blob upload errored, report generation
 * timed out) are logged but don't fail the whole call — the
 * ParsedPolicy row still saves, and downstream surfaces re-derive
 * the missing pieces lazily.
 */
export async function runAuditPipeline(
  args: AuditPipelineArgs
): Promise<AuditPipelineResult> {
  const tag = `[audit-pipeline:${args.source}]`;

  // ---- 1. Extract PDF text ----
  const { text, numPages } = await extractPdfText(args.pdfBuffer);
  if (!text || text.length < 200) {
    console.log(
      `${tag} text too short (${text?.length ?? 0} chars, ${numPages} pages) — likely scanned`
    );
    return {
      kind: "unreadable",
      category: "scanned-image",
      headline: "This looks scanned 📸",
      body: "Our AI can't read scanned images yet — we need a digitally-issued PDF. Pull the original from your insurer's app or email.",
    };
  }

  // ---- 2. Classify ----
  console.log(`${tag} classifying ${numPages}p document...`);
  const classification = await classifyPolicy(text);
  console.log(
    `${tag} classified as ${classification.category} / ${classification.documentType} (${classification.confidence}): ${classification.reasoning}`
  );
  const reject = rejectionMessage(classification.category);
  if (reject) {
    return {
      kind: "rejected",
      category: classification.category,
      headline: reject.headline,
      body: reject.body,
      vehicleClass: classification.vehicleClass,
    };
  }

  // ---- 3. Extract full policy via LLM ----
  console.log(`${tag} extracting policy fields via LLM...`);
  const extractStart = Date.now();
  const parsed = await extractPolicyFromText(text);
  console.log(
    `${tag} extraction completed in ${Date.now() - extractStart}ms. Confidence: ${parsed.parseConfidence}`
  );

  // ---- 4. Stamp owner email on the ParsedPolicy row ----
  // NB: the User-row upsert + DPDP consent stamp lives in
  // recordDpdpConsent() now, called ONCE by the caller before any
  // parallel pipeline fan-out. Doing it per-pipeline-run was a race
  // hazard when a single sender forwards N docs concurrently — N
  // findOne() calls all see no row, then N appendRow() calls each
  // create a duplicate User row with its own UUID. See the
  // /api/inbound/email path for the hoisted upsert.
  if (args.ownerEmail) {
    parsed.owner = {
      ...parsed.owner,
      email: args.ownerEmail.toLowerCase(),
    };
  }

  // ---- 5. Stamp documentType from the classifier ----
  parsed.documentType = classification.documentType;

  // ---- 6. Persist ParsedPolicy row ----
  const savedPolicy = await appendRow<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    parsed
  );
  console.log(
    `${tag} saved ParsedPolicy ${savedPolicy.id} for ${args.ownerEmail ?? "<no owner>"}`
  );

  // ---- 7. Persist original PDF to Blob (non-fatal) ----
  try {
    const blob = await storePolicyPdf(savedPolicy.id, args.pdfBuffer);
    await updateById<ParsedPolicy>(Tables.PARSED_POLICIES, savedPolicy.id, {
      uploadedPdfUrl: blob.url,
      uploadedPdfFileName: args.fileName,
    });
    savedPolicy.uploadedPdfUrl = blob.url;
    savedPolicy.uploadedPdfFileName = args.fileName;
  } catch (err) {
    console.error(
      `${tag} Blob upload failed for policy ${savedPolicy.id} (parse still saved):`,
      err
    );
  }

  // ---- 8. Generate report synchronously ----
  // Pre-generating here means /report/[id] is always a cache hit.
  // Failure here doesn't fail the parse — the page lazily regenerates
  // on visit if the row is missing.
  let policyReportId: string | null = null;
  try {
    const existing = await findOne<PolicyReport>(
      Tables.REPORTS,
      (r) => r.parsedPolicyId === savedPolicy.id
    );
    if (existing) {
      policyReportId = existing.id;
    } else {
      const reportStart = Date.now();
      const report = await generateReport(savedPolicy);
      const savedReport = await appendRow<PolicyReport>(Tables.REPORTS, report);
      policyReportId = savedReport.id;
      console.log(
        `${tag} generated PolicyReport ${savedReport.id} in ${Date.now() - reportStart}ms`
      );
    }
  } catch (err) {
    console.error(
      `${tag} report generation failed for policy ${savedPolicy.id} — parse still succeeded:`,
      err
    );
  }

  const vehicleLabel =
    `${parsed.vehicle.make} ${parsed.vehicle.model}`.trim() || "your car";

  return {
    kind: "audited",
    parsedPolicyId: savedPolicy.id,
    policyReportId,
    documentType: classification.documentType,
    vehicleLabel,
  };
}

/**
 * Upsert the User row for this sender and stamp DPDP consent.
 *
 * Hoisted out of runAuditPipeline so callers that process MULTIPLE
 * PDFs in parallel (e.g. /api/inbound/email forwarding 3 docs at once)
 * can do this ONCE — instead of N concurrent findOne() calls each
 * racing to appendRow() a fresh User with a new UUID.
 *
 * Non-fatal: failures are logged but don't throw. The audit pipeline
 * still runs without a User row; renewal cadence wiring catches up
 * lazily on the next interaction.
 */
export async function recordDpdpConsent(ownerEmail: string): Promise<void> {
  if (!ownerEmail) return;
  const ownerLower = ownerEmail.toLowerCase();
  try {
    const nowIso = new Date().toISOString();
    const existing = await findOne<User>(
      Tables.USERS,
      (u) => (u.email ?? "").toLowerCase() === ownerLower
    );
    if (existing) {
      await updateById<User>(Tables.USERS, existing.id, {
        dpdpConsentGivenAt: nowIso,
        email: ownerLower,
      });
    } else {
      await appendRow<User>(Tables.USERS, {
        id: randomUUID(),
        email: ownerLower,
        mobile: "",
        createdAt: nowIso,
        dpdpConsentGivenAt: nowIso,
      });
    }
  } catch (err) {
    console.error(
      `[audit-pipeline] DPDP consent stamp failed for ${ownerLower} (non-fatal):`,
      err
    );
  }
}
