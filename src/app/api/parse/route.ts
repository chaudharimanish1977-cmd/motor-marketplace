import { NextRequest, NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf-parser";
import { extractPolicyFromText } from "@/lib/policy-extractor";
import { classifyPolicy, rejectionMessage } from "@/lib/policy-classifier";
import { appendRow, findOne, updateById, Tables } from "@/lib/db";
import { storePolicyPdf } from "@/lib/blob-store";
import { getSession } from "@/lib/session";
import {
  appendDocToUploadSession,
  getUploadSession,
} from "@/lib/upload-session";
import { appendDocToAnonymousSession } from "@/lib/anonymous-session";
import { generateReport } from "@/lib/report-generator";
import type { ParsedPolicy, PolicyReport, User } from "@/lib/types";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
// 120s window covers PDF extract (~5s) + classify (~3s) + LLM extraction
// (~25s) + LLM report generation (~30s) = ~63s typical, with headroom for
// outlier LLM latency. Without this, a slow generate-report leg gets
// killed mid-stream and the customer hits "Connection closed" on /reports.
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          error: "No file uploaded",
          category: "missing",
          headline: "Forgot the file?",
          body: "We need a PDF to read. Try uploading again.",
        },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          error: "File must be a PDF",
          category: "wrong-format",
          headline: "Uhh — that's not a PDF 📄",
          body: "We need the policy PDF your insurer mailed you, not a screenshot, Word doc, or image. Try the original file.",
        },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "File too large (max 10 MB)",
          category: "too-big",
          headline: "PDF's too chunky 🐘",
          body: "Max 10 MB. If yours is bigger, ask your insurer for a slimmer copy or try the version from their app.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, numPages } = await extractPdfText(buffer);

    if (!text || text.length < 200) {
      return NextResponse.json(
        {
          error: "Could not extract text from this PDF",
          category: "scanned-image",
          headline: "This looks scanned 📸",
          body: "Our AI can't read scanned images yet — we need a digitally-issued PDF. Pull the original from your insurer's app or email.",
        },
        { status: 400 }
      );
    }

    // Pre-flight: cheap classifier to make sure this is actually a private-car
    // policy before we spend on full extraction. Saves ~₹5 per wrong upload.
    console.log(`[parse] Classifying ${numPages}p document...`);
    const classification = await classifyPolicy(text);
    console.log(
      `[parse] Classified as ${classification.category} (${classification.confidence}): ${classification.reasoning}`
    );

    const reject = rejectionMessage(classification.category);
    if (reject) {
      return NextResponse.json(
        {
          error: "Document is not a private-car policy",
          category: classification.category,
          headline: reject.headline,
          body: reject.body,
          vehicleClass: classification.vehicleClass,
        },
        { status: 400 }
      );
    }

    // Looks like a private-car policy — proceed with full extraction.
    console.log(
      `[parse] PDF parsed: ${numPages} pages, ${text.length} chars. Calling Claude for extraction...`
    );
    const extractStart = Date.now();
    const parsed = await extractPolicyFromText(text);
    console.log(
      `[parse] Extraction completed in ${Date.now() - extractStart}ms. Confidence: ${parsed.parseConfidence}`
    );

    // If the customer is signed in (or has an upload-session from a
    // prior submit in this browser), stamp the parsed policy with
    // their email. The signed-in identity is the authoritative truth
    // (e.g. a customer renewing for a spouse still wants the policy
    // under their own portal). Full session wins over upload session
    // when both are present.
    const sessionEmail = await getSession();
    const uploadSession = sessionEmail ? null : await getUploadSession();
    const effectiveEmail = sessionEmail ?? uploadSession?.email ?? null;
    if (effectiveEmail) {
      parsed.owner = {
        ...parsed.owner,
        email: effectiveEmail,
      };

      // DPDP §6: dropping a policy on the upload surface is an
      // affirmative act of consent — the dropzone surfaces the privacy
      // notice inline at the point of action. Stamp (or refresh) the
      // User row's `dpdpConsentGivenAt` so the customer's portal can
      // show them when their last consent was given. Non-fatal — the
      // parse still completes if this write fails.
      try {
        const lowered = effectiveEmail.toLowerCase();
        const nowIso = new Date().toISOString();
        const existing = await findOne<User>(
          Tables.USERS,
          (u) => (u.email ?? "").toLowerCase() === lowered
        );
        if (existing) {
          await updateById<User>(Tables.USERS, existing.id, {
            dpdpConsentGivenAt: nowIso,
            email: lowered,
          });
        } else {
          await appendRow<User>(Tables.USERS, {
            id: randomUUID(),
            email: lowered,
            mobile: "",
            createdAt: nowIso,
            dpdpConsentGivenAt: nowIso,
          });
        }
      } catch (consentErr) {
        console.error(
          "[parse] Failed to stamp DPDP consent on User row:",
          consentErr
        );
      }
    }

    // Stamp documentType from the upstream classifier. The portal
    // bifurcates Active / Quotes / Expired off this field, and the
    // renewal-reminder cron skips quote-typed records entirely.
    parsed.documentType = classification.documentType;

    const savedPolicy = await appendRow<ParsedPolicy>(
      Tables.PARSED_POLICIES,
      parsed
    );

    // Always append to anonymous-session cookie — this is the
    // "browser holds these docs" record that lets the customer
    // resume on return within 7 days and that the gate uses to
    // associate docs with the verified email at OTP time.
    try {
      await appendDocToAnonymousSession(savedPolicy.id);
    } catch (err) {
      console.error(
        "[parse] Failed to append doc to anonymous session:",
        err
      );
      // Non-fatal — doc is still saved; customer just loses
      // browser-resume continuity if they leave and come back.
    }

    // If we stamped from an upload-session, append the new doc ID to
    // that cookie too so subsequent comparator runs in this browser
    // know about it. Full-session customers find their docs via
    // owner.email match in /me.
    if (!sessionEmail && uploadSession) {
      try {
        await appendDocToUploadSession(savedPolicy.id);
      } catch (err) {
        console.error(
          "[parse] Failed to append doc to upload session:",
          err
        );
      }
    }

    // Persist the original uploaded PDF to Blob, then back-fill the URL on
    // the parsed policy record. Failures here don't fail the parse — the
    // customer still gets a working report, we just lose the source archive.
    try {
      const blob = await storePolicyPdf(savedPolicy.id, buffer);
      await updateById<ParsedPolicy>(
        Tables.PARSED_POLICIES,
        savedPolicy.id,
        {
          uploadedPdfUrl: blob.url,
          uploadedPdfFileName: file.name,
        }
      );
      savedPolicy.uploadedPdfUrl = blob.url;
      savedPolicy.uploadedPdfFileName = file.name;
      console.log(`[parse] Uploaded policy PDF to ${blob.url}`);
    } catch (uploadErr) {
      console.error(
        `[parse] Policy PDF upload failed (parse still saved):`,
        uploadErr
      );
    }

    // Pre-generate the PolicyReport SYNCHRONOUSLY before returning to
    // the client. We previously used waitUntil for this, but Vercel
    // was killing the function before the background work could
    // complete — leaving /reports to retry the LLM call inline,
    // which then got cut mid-stream ("Connection closed").
    //
    // The cost: customer waits longer at /upload (parse ~25s + report
    // ~30s = ~55s total). The existing journey loader UX handles this
    // gracefully (typewriter messages + the 4 mid-load questions).
    //
    // The win: /reports is always a cache hit. No streaming-timeout
    // failures, no inline retry, no orphaned LLM work.
    //
    // Wrapped in try/catch so a failed report generation doesn't fail
    // the parse — customer still gets the Done card; /reports will
    // lazily retry on visit (and its own error boundary will surface
    // any persistent failure).
    try {
      const existing = await findOne<PolicyReport>(
        Tables.REPORTS,
        (r) => r.parsedPolicyId === savedPolicy.id
      );
      if (!existing) {
        const start = Date.now();
        const report = await generateReport(savedPolicy);
        await appendRow<PolicyReport>(Tables.REPORTS, report);
        console.log(
          `[parse] Report for ${savedPolicy.id} generated in ${
            Date.now() - start
          }ms`
        );
      }
    } catch (err) {
      console.error(
        `[parse] Report generation failed for ${savedPolicy.id} — parse still succeeded:`,
        err
      );
    }

    return NextResponse.json({ id: savedPolicy.id, parsed: savedPolicy });
  } catch (err) {
    console.error("[parse] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unknown error during parsing",
        category: "server-error",
        headline: "Something broke on our side 🛠️",
        body: "Not your fault. Try once more in a few seconds.",
      },
      { status: 500 }
    );
  }
}
