/**
 * Audit runner — the orchestration that turns a forward's PDFs into
 * the customer's reply email.
 *
 * Extracted out of /api/inbound/email/route.ts so both the synchronous
 * webhook path AND the QStash worker can call it. Next.js route files
 * may only export HTTP method handlers, so any shared logic lives in
 * lib modules like this one.
 *
 * Single entry point:
 *   runAuditsForInboundForward({ pdfBuffers, fromEmail, subject })
 *
 * Internally:
 *   1. Snapshot first-touch state for DPDP consent line decision.
 *   2. Record DPDP consent ONCE (so concurrent pipeline runs don't
 *      race to create duplicate User rows).
 *   3. Fan out per-PDF audits in parallel. Each outcome is one of:
 *        audited | rejected | unreadable | errored
 *      No PDF can disappear silently — every input becomes a visible
 *      outcome.
 *   4. Dispatch the right reply: single-doc, multi-doc, or no-match.
 *   5. Surface excluded / errored docs in the "Couldn't process" block
 *      so the customer always sees N inputs ↔ N outcomes.
 */

import {
  runAuditPipeline,
  recordDpdpConsent,
  type AuditPipelineResult,
} from "@/lib/audit-pipeline";
import {
  buildMasterPdfFilename,
  sendInboundAuditReply,
  sendInboundMultiAuditReply,
  sendInboundMultiVehicleReply,
  sendInboundNoMatchReply,
  type InboundComparatorSummary,
  type InboundMultiAuditAttachment,
  type InboundMultiVehicleSection,
  type InboundNoMatchReason,
} from "@/lib/email-sender";
import { buildAuditMagicLinkUrl, buildRemindMeUrl } from "@/lib/email-token";
import { renderReportPdf, renderReportsPdf } from "@/lib/pdf-renderer";
import { storeReportPdf } from "@/lib/blob-store";
import { findById, findMany, findOne, Tables } from "@/lib/db";
import { friendlyFirstName, formatINR } from "@/lib/format";
import {
  computeRCP,
  scoreAgainstRcp,
} from "@/lib/recommended-coverage-profile";
import { vehicleKey, vehicleLabel } from "@/lib/policy-group";
import type { ParsedPolicy, PolicyReport, User } from "@/lib/types";

/** Augments an audited outcome with its fetched ParsedPolicy + filename
 *  so the multi-vehicle grouping has everything it needs in one shape. */
interface AuditedWithPolicy {
  filename: string;
  result: Extract<AuditPipelineResult, { kind: "audited" }>;
  parsed: ParsedPolicy;
}

/**
 * Public origin for customer-facing URLs we generate during the
 * inbound-reply flow — magic links, PDF render targets, the URLs
 * the customer clicks from their inbox.
 *
 * Override via `INBOUND_DEMO_HOST` (hostname only, no scheme): when
 * set, every customer-facing URL routes through that hostname
 * instead of the production canonical. Used for live investor demos
 * where we want forward → reply → magic-link → marketplace flow to
 * land on `demo.rightoffer.in` (marketplace gate open) instead of
 * `rightoffer.in` (marketplace hidden).
 *
 * IMPORTANT: this override is for CUSTOMER-FACING URLs only.
 * Infrastructure URLs (the QStash worker callback at
 * /api/jobs/audit-forward, the failure callback, etc.) continue to
 * use the production canonical regardless — the queue side never
 * routes through demo. Only what reaches the customer's inbox.
 *
 * Remove the env var after the demo to restore the production
 * canonical. No code change needed.
 */
const SITE_URL = process.env.INBOUND_DEMO_HOST
  ? `https://${process.env.INBOUND_DEMO_HOST}`
  : "https://rightoffer.in";

console.log(
  `[audit-runner] customer-facing SITE_URL=${SITE_URL}${process.env.INBOUND_DEMO_HOST ? " (INBOUND_DEMO_HOST override active)" : ""}`
);

/** Customer-visible exclusion entry for the email body. */
export interface ExcludedDoc {
  filename: string;
  /** Short, plain-English reason — e.g. "looks like a two-wheeler policy". */
  reason: string;
}

/**
 * Local outcome type for the multi-doc fan-out. Extends the pipeline's
 * own AuditPipelineResult with an "errored" kind we synthesise when
 * the pipeline crashes (after all retries) so the doc never silently
 * disappears from the customer's reply. Kept local to this module —
 * the pipeline contract itself only produces audited/rejected/unreadable.
 */
export type LocalOutcome =
  | AuditPipelineResult
  | { kind: "errored"; reason: string };

/**
 * Entry point. Runs the per-doc audit pipeline in parallel for each
 * forwarded PDF, then dispatches the appropriate reply email.
 *
 * Never throws — failures inside individual stages are logged and
 * either surfaced to the customer (as excluded docs / no-match reply)
 * or swallowed (when surfacing them would just add noise).
 */
export async function runAuditsForInboundForward(args: {
  pdfBuffers: Array<{ buffer: Buffer; name: string; inboundId: string }>;
  fromEmail: string;
  subject: string;
}): Promise<void> {
  // Capture first-touch state BEFORE the audit pipeline runs.
  // The audit pipeline upserts the User row + stamps DPDP consent, so
  // by the time the replies fire, every sender looks like an existing
  // user. We need the "before" snapshot to decide whether to include
  // the first-touch consent line in the reply.
  const wasFirstTouch = await senderHasNoPriorAudits(args.fromEmail);

  // Record DPDP consent ONCE for this sender before fanning out the
  // per-doc pipeline. Doing this here (instead of inside each pipeline
  // run) eliminates the race where N concurrent pipelines all see an
  // absent User row and each call appendRow() — leaving N duplicate
  // User rows behind. See recordDpdpConsent() in audit-pipeline.ts.
  await recordDpdpConsent(args.fromEmail);

  // Track filename per outcome so we can surface excluded docs by
  // name in the email body ("Couldn't process Tata-AIG-bill.pdf —
  // looks like a two-wheeler policy").
  //
  // Per-doc pipelines run IN PARALLEL — each doc is independent (own
  // text extract, classify, parse, report-gen). For a 3-doc forward,
  // total wall-clock drops from sum-of-three (~3-4 min) to max-of-three
  // (~70-90 s), bringing the multi-doc reply inside the same ~2-min
  // promise we make for single-doc forwards.
  //
  // Each task wraps its own try/catch so one bad PDF doesn't reject the
  // Promise.all AND so a transient failure doesn't silently disappear:
  // every input PDF MUST surface as an outcome (audited, rejected,
  // unreadable, or errored). The customer should always see N entries
  // for N forwarded files — never N inputs ↔ N-1 outputs.
  console.log(
    `[audit-runner] fanning out ${args.pdfBuffers.length} doc(s) in parallel for ${args.fromEmail}`
  );
  const t0 = Date.now();
  const outcomesWithFile: Array<{
    filename: string;
    result: LocalOutcome;
  }> = await Promise.all(
    args.pdfBuffers.map(async ({ buffer, name, inboundId }) => {
      console.log(
        `[audit-runner] starting audit for ${name} (inbound=${inboundId}, sender=${args.fromEmail})`
      );
      try {
        const result = await runAuditPipeline({
          pdfBuffer: buffer,
          ownerEmail: args.fromEmail,
          fileName: name,
          source: "email-forward",
        });
        if (result.kind === "audited") {
          console.log(
            `[audit-runner] ${name}: audited as ${result.documentType}, parsed=${result.parsedPolicyId}, report=${result.policyReportId ?? "(missing)"}`
          );
        } else {
          console.log(
            `[audit-runner] ${name}: ${result.kind} (${result.category})`
          );
        }
        return { filename: name, result };
      } catch (err) {
        // Synthesise an "errored" outcome instead of dropping. Even
        // after callClaude's retry/backoff, a hard failure here used to
        // silently disappear — the customer received an audit for 2 of
        // 3 PDFs with no trace of the third. Now the third surfaces in
        // the "Couldn't process" block with a useful reason.
        const reason = describePipelineError(err);
        console.error(
          `[audit-runner] audit pipeline crashed for ${name} (surfacing as errored: "${reason}"):`,
          err
        );
        return {
          filename: name,
          result: { kind: "errored" as const, reason },
        };
      }
    })
  );
  console.log(
    `[audit-runner] parallel fan-out done in ${Date.now() - t0}ms for ${args.fromEmail} (${outcomesWithFile.length} outcomes for ${args.pdfBuffers.length} inputs)`
  );

  // K6/K11 — send editorial reply with the audit PDF(s) attached.
  //
  // Dispatch: ONE reply per forward, regardless of doc count.
  //   · 1 audited PDF  → single-doc reply via sendInboundAuditReply
  //   · 2+ audited PDFs → consolidated multi-doc reply
  //   · 0 audited      → polite no-match reply
  //
  // Excluded docs (rejected / unreadable / errored) get surfaced in
  // the multi-doc reply body so the customer knows what we couldn't
  // process.
  const audited = outcomesWithFile.filter(
    (o): o is { filename: string; result: Extract<AuditPipelineResult, { kind: "audited" }> } =>
      o.result.kind === "audited"
  );
  // Non-audited outcomes (rejected / unreadable / errored) all flow
  // into the "Couldn't process" block in the email + master PDF. The
  // customer sees a complete N-in / N-out record either way.
  const excluded = outcomesWithFile.filter(
    (o) => o.result.kind !== "audited"
  );
  const excludedDocs: ExcludedDoc[] = excluded.map((o) => ({
    filename: o.filename,
    reason: humaniseExclusionReason(o.result),
  }));

  // Use the wasFirstTouch state captured BEFORE the audit pipeline.
  if (audited.length === 1) {
    try {
      await sendAuditReplyForForward({
        fromEmail: args.fromEmail,
        parsedPolicyId: audited[0].result.parsedPolicyId,
        vehicleLabel: audited[0].result.vehicleLabel,
        includeDpdpConsentLine: wasFirstTouch,
      });
    } catch (err) {
      console.error(
        `[audit-runner] single-reply send failed for ${audited[0].result.parsedPolicyId}:`,
        err
      );
    }
  } else if (audited.length >= 2) {
    // Multi-doc forward — but is it multi-VEHICLE or multi-doc-same-vehicle?
    // We can only know after fetching each ParsedPolicy and grouping by
    // vehicleKey (registration number, fallback to make+model+year+rto).
    //
    // Same-vehicle case (anchor + quotes for that anchor) → existing
    // consolidated-reply path with the cross-doc comparator.
    //
    // Different-vehicle case (e.g. household forwards their Audi
    // policy + spouse's Honda policy in one email) → new multi-vehicle
    // reply path with per-vehicle sections, no cross-vehicle comparison.
    try {
      const enrichedAudits = await fetchAuditedParsedPolicies(audited);
      const vehicleGroups = groupByVehicle(enrichedAudits);

      if (vehicleGroups.size <= 1) {
        // All docs for one vehicle (or all unidentifiable, which we
        // optimistically treat as one). Use the existing consolidated
        // reply — cross-doc comparator works.
        await sendConsolidatedReplyForForward({
          fromEmail: args.fromEmail,
          audits: audited.map((a) => a.result),
          excludedDocs,
          includeDpdpConsentLine: wasFirstTouch,
        });
      } else {
        // Multi-vehicle forward. Send the per-vehicle-section reply
        // instead so we don't compare an Audi to a Maruti.
        await sendMultiVehicleReplyForForward({
          fromEmail: args.fromEmail,
          vehicleGroups,
          excludedDocs,
          includeDpdpConsentLine: wasFirstTouch,
        });
      }
    } catch (err) {
      console.error(
        `[audit-runner] multi-reply send failed for ${args.fromEmail}:`,
        err
      );
    }
  }

  // Zero successful audits → fire the polite no-match reply. Context-
  // aware: if the classifier rejected a specific vehicle class, surface
  // that in the reply opener. Otherwise the reply is generic.
  if (audited.length === 0 && outcomesWithFile.length > 0) {
    const reason = inferNoMatchReason(
      outcomesWithFile.map((o) => o.result)
    );
    console.log(
      `[audit-runner] zero audited from ${args.fromEmail}; sending no-match reply (kind=${reason.kind})`
    );
    try {
      await sendNoMatchReplyForForward({
        fromEmail: args.fromEmail,
        reason,
      });
    } catch (err) {
      console.error(
        `[audit-runner] no-match reply send failed:`,
        err
      );
    }
  }

  console.log(
    `[audit-runner] forward processed: ${outcomesWithFile.length} attempt(s), ${audited.length} audited & replied, ${excluded.length} excluded`
  );
}

/**
 * Extract a short, customer-friendly reason from a pipeline crash.
 * Most failures we'd surface to the customer fall into a handful of
 * shapes: Anthropic API failure after retries, PDF parse failure, or
 * a generic timeout. We map status codes / well-known error messages
 * to readable copy; the long technical detail still goes to logs.
 */
function describePipelineError(err: unknown): string {
  // Customer-facing wording — never asks the customer to compensate
  // for our infrastructure failures. The queue retries on their
  // behalf; if a doc still ends up surfaced via this path it's a
  // hard failure that survived all retries. We tell them we're on it.
  const status =
    err && typeof err === "object" && "status" in err
      ? (err as { status?: unknown }).status
      : undefined;
  if (typeof status === "number") {
    if (status === 429 || status === 529) {
      return "our parser was busy when this one came through — we're retrying on our side";
    }
    if (status >= 500) {
      return "our parser hit a hiccup on this one — our team is looking into it";
    }
  }
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : "";
  if (/timeout|timed out|ETIMEDOUT/i.test(message)) {
    return "this one timed out on our side — our team is looking into it";
  }
  if (/network|ECONNRESET|ECONNREFUSED/i.test(message)) {
    return "we lost the connection reading this one — our team is looking into it";
  }
  return "we couldn't finish reading this one on our side — our team is looking into it";
}

/**
 * Convert an audit-pipeline rejection into a one-line, customer-
 * friendly reason. The pipeline returns structured rejection data
 * (category + headline + body); we want a tight line ready for a
 * bullet list in the email. Also handles the synthetic "errored"
 * outcome we attach when the pipeline crashes — see describePipelineError.
 */
function humaniseExclusionReason(result: LocalOutcome): string {
  if (result.kind === "audited") return ""; // shouldn't happen
  if (result.kind === "errored") {
    return result.reason;
  }
  if (result.kind === "unreadable") {
    return "looks like a scanned image, not a text PDF";
  }
  // rejected branch — use category for a tight line
  switch (result.category) {
    case "two-wheeler":
      return "looks like a two-wheeler policy (we review private four-wheelers only)";
    case "commercial-vehicle":
      return "looks like a commercial vehicle policy (we review private four-wheelers only)";
    case "non-motor":
      return "doesn't look like a motor insurance document";
    case "unknown":
    default:
      return "couldn't confirm this is a private-car policy or quote";
  }
}

/**
 * Pick the most-informative no-match reason from a set of failed
 * audit outcomes. Priority (informative → generic):
 *   1. wrong-vehicle-class — best signal we can give the customer
 *   2. scanned-image — same: they can fix this by sending the digital PDF
 *   3. generic not-a-policy — fall-through when we don't know more
 *
 * When multiple PDFs were forwarded with different rejection reasons,
 * we pick the most specific one for the reply. Reasoning: the customer
 * almost always meant to send their main policy; if even one PDF
 * rejected for a specific reason, that's likely the one they meant.
 */
function inferNoMatchReason(
  outcomes: LocalOutcome[]
): InboundNoMatchReason {
  // Look for wrong-vehicle-class first
  const wrongClass = outcomes.find(
    (o): o is Extract<AuditPipelineResult, { kind: "rejected" }> =>
      o.kind === "rejected" &&
      (o.category === "two-wheeler" || o.category === "commercial-vehicle")
  );
  if (wrongClass) {
    const label =
      wrongClass.category === "two-wheeler"
        ? "two-wheeler"
        : "commercial vehicle";
    return { kind: "wrong-vehicle-class", vehicleClass: label };
  }

  // Then scanned-image
  if (outcomes.some((o) => o.kind === "unreadable")) {
    return { kind: "scanned-image" };
  }

  // If ALL outcomes errored (no rejection / no scanned-image), it's an
  // infrastructure problem — surface as the generic not-a-policy reply
  // for now, since we don't have a dedicated "try again later" reply
  // template. The errored entries themselves still surface in the
  // "Couldn't process" block.
  return { kind: "not-a-policy" };
}

/**
 * Render-free no-match reply runner. Looks up the customer's first
 * name (best-effort) + DPDP-first-touch state, then sends the polite
 * reply. Wraps sendInboundNoMatchReply so the runner's logic stays
 * focused on flow control.
 */
export async function sendNoMatchReplyForForward(args: {
  fromEmail: string;
  reason: InboundNoMatchReason;
}): Promise<void> {
  try {
    const lowered = args.fromEmail.toLowerCase();
    const userRow = await findOne<User>(
      Tables.USERS,
      (u) => (u.email ?? "").toLowerCase() === lowered
    );
    const firstName = friendlyFirstName(userRow?.name) || undefined;
    const includeDpdpConsentLine = !userRow;

    await sendInboundNoMatchReply({
      to: args.fromEmail,
      firstName,
      reason: args.reason,
      includeDpdpConsentLine,
    });
    console.log(
      `[audit-runner] no-match reply sent to ${args.fromEmail} (reason=${args.reason.kind})`
    );
  } catch (err) {
    console.error("[audit-runner] no-match reply failed:", err);
  }
}

/**
 * Render the report PDF and fire the editorial reply email. Reuses
 * the existing puppeteer render pipeline (renderReportPdf) and stores
 * the rendered PDF in Blob for later access. Falls back gracefully
 * if PDF render fails — sends an "audit ready on web" email without
 * the attachment, so the customer can still click through.
 */
async function sendAuditReplyForForward(args: {
  fromEmail: string;
  parsedPolicyId: string;
  vehicleLabel: string;
  includeDpdpConsentLine: boolean;
}): Promise<void> {
  const magicLinkUrl = buildAuditMagicLinkUrl(
    args.fromEmail,
    SITE_URL,
    `/report/${args.parsedPolicyId}`
  );

  // Best-effort: render PDF for attachment. If puppeteer can't reach
  // the page (cold start, transient infra), we still send the email
  // with the magic-link so the customer has a path to the audit.
  let pdfBuffer: Buffer | null = null;
  try {
    const t0 = Date.now();
    pdfBuffer = await renderReportPdf({
      reportId: args.parsedPolicyId,
      baseUrl: SITE_URL,
    });
    console.log(
      `[audit-runner] rendered PDF for ${args.parsedPolicyId} in ${Date.now() - t0}ms (${pdfBuffer.length} bytes)`
    );
    // Store for later retrieval (so /report's "download PDF" link
    // can serve it instead of re-rendering).
    await storeReportPdf(args.parsedPolicyId, pdfBuffer).catch((err) =>
      console.error("[audit-runner] storeReportPdf failed (non-fatal):", err)
    );
  } catch (err) {
    console.error(
      `[audit-runner] PDF render failed for ${args.parsedPolicyId}; sending without attachment:`,
      err
    );
  }

  // Look up the customer's display name so the editorial reply can
  // greet by first name.
  const lowered = args.fromEmail.toLowerCase();
  const userRow = await findOne<User>(
    Tables.USERS,
    (u) => (u.email ?? "").toLowerCase() === lowered
  );
  const firstName = friendlyFirstName(userRow?.name) || undefined;

  // Compute the one-click "Remind me before this expires" magic link.
  // Gated to policies with a future expiry — quotes have no renewal
  // cliff, lapsed policies have nothing to nudge. Lookup is
  // best-effort: a miss here just suppresses the remind line.
  let remindMeUrl: string | undefined;
  try {
    const parsed = await findById<ParsedPolicy>(
      Tables.PARSED_POLICIES,
      args.parsedPolicyId
    );
    remindMeUrl = maybeBuildRemindUrl(parsed, args.fromEmail);
  } catch (err) {
    console.warn(
      "[audit-runner] remind-url lookup failed (non-fatal):",
      err
    );
  }

  await sendInboundAuditReply({
    to: args.fromEmail,
    firstName,
    vehicleLabel: args.vehicleLabel,
    magicLinkUrl,
    pdf: pdfBuffer ?? Buffer.alloc(0),
    includeDpdpConsentLine: args.includeDpdpConsentLine,
    remindMeUrl,
  });
  console.log(
    `[audit-runner] reply sent to ${args.fromEmail} for ${args.parsedPolicyId}`
  );
}

/**
 * Build the one-click "Remind me" magic-link URL for an audit reply.
 * Returns undefined when the doc isn't a policy or its expiry is in
 * the past — quotes and lapsed policies have no renewal to subscribe
 * to. The link is HMAC-signed with a 30-day expiry; the click handler
 * at /api/reminders/click verifies + creates the subscription.
 */
function maybeBuildRemindUrl(
  parsed: ParsedPolicy | null,
  email: string
): string | undefined {
  if (!parsed) return undefined;
  if ((parsed.documentType ?? "policy") !== "policy") return undefined;
  if (!parsed.odPeriodEnd) return undefined;
  const expiryMs = Date.parse(parsed.odPeriodEnd);
  if (!Number.isFinite(expiryMs) || expiryMs < Date.now()) return undefined;
  return buildRemindMeUrl(email, parsed.id, SITE_URL);
}

/**
 * K11 — consolidated reply for forwards yielding 2+ audited PDFs.
 *
 * Renders ONE master PDF (Phase 3 architecture: comparator + inline
 * annexures, replacing the per-doc N-attachment pattern), then sends
 * ONE email with that PDF + a magic-link to the tabbed /reports view.
 *
 * If master PDF render fails, we still send the email with the
 * magic-link only — graceful degradation.
 */
async function sendConsolidatedReplyForForward(args: {
  fromEmail: string;
  audits: Array<Extract<AuditPipelineResult, { kind: "audited" }>>;
  /** Docs from the same forward that we couldn't process (rejected /
   *  unreadable / errored). Surfaced in the reply body so the customer
   *  knows exactly what landed and what didn't. */
  excludedDocs: ExcludedDoc[];
  includeDpdpConsentLine: boolean;
}): Promise<void> {
  const magicLinkUrl = buildAuditMagicLinkUrl(
    args.fromEmail,
    SITE_URL,
    "/reports"
  );

  // Look up each audit's ParsedPolicy for per-doc metadata (insurer,
  // year). If the lookup fails we STILL push a degraded entry — the
  // pipeline already produced a successful audited outcome, so the
  // customer should see the doc even when enrichment hiccups.
  // Silently dropping here was a real production bug that lost
  // legitimate audits.
  const audits: InboundMultiAuditAttachment[] = [];
  for (const audit of args.audits) {
    let parsed: ParsedPolicy | null = null;
    try {
      parsed = await findById<ParsedPolicy>(
        Tables.PARSED_POLICIES,
        audit.parsedPolicyId
      );
    } catch (err) {
      console.error(
        `[audit-runner] metadata lookup THREW for ${audit.parsedPolicyId} (continuing with degraded entry):`,
        err
      );
    }
    if (!parsed) {
      console.warn(
        `[audit-runner] metadata lookup returned null for ${audit.parsedPolicyId} (likely a KV-write race or replication lag) — surfacing audit with what we have from the pipeline outcome`
      );
      audits.push({
        vehicleLabel: audit.vehicleLabel,
        documentType: audit.documentType,
        insurerName: "audit",
        yearLabel: "",
      });
      continue;
    }
    const yearLabel = parsed.odPeriodEnd
      ? new Date(parsed.odPeriodEnd).getFullYear().toString()
      : "";
    audits.push({
      vehicleLabel: audit.vehicleLabel,
      documentType: audit.documentType,
      insurerName: parsed.insurerName || "audit",
      yearLabel,
    });
  }

  if (audits.length < 2) {
    console.log(
      `[audit-runner] only ${audits.length} valid audits after metadata lookup for ${args.fromEmail}; falling back to single-doc path`
    );
  }

  // Render the master PDF — the /reports view scoped to this
  // forward's doc IDs. Replaces the per-doc render loop. One
  // puppeteer instance instead of N.
  //
  // Excluded docs are threaded through to /reports via the URL so
  // the master PDF carries a "Couldn't process" section for the
  // docs that didn't qualify (two-wheeler policy, scanned image,
  // etc.). The customer gets a complete record of what was
  // received and what made it through in one self-contained
  // document.
  let masterPdf: Buffer | null = null;
  try {
    const t0 = Date.now();
    masterPdf = await renderReportsPdf({
      docIds: args.audits.map((a) => a.parsedPolicyId),
      baseUrl: SITE_URL,
      excludedDocs: args.excludedDocs,
    });
    console.log(
      `[audit-runner] rendered master PDF in ${Date.now() - t0}ms (${masterPdf.length} bytes)`
    );
  } catch (err) {
    console.error(
      `[audit-runner] master PDF render failed for ${args.fromEmail}; sending without attachment:`,
      err
    );
  }

  // Resolve first name (best-effort) for the greeting.
  const lowered = args.fromEmail.toLowerCase();
  const userRow = await findOne<User>(
    Tables.USERS,
    (u) => (u.email ?? "").toLowerCase() === lowered
  );
  const firstName = friendlyFirstName(userRow?.name) || undefined;

  // If only one valid audit survived metadata lookup, fall back to the
  // single-doc reply path.
  if (audits.length < 2) {
    if (args.audits.length === 1) {
      const onlyAudit = args.audits[0];
      let singlePdf: Buffer | null = null;
      try {
        singlePdf = await renderReportPdf({
          reportId: onlyAudit.parsedPolicyId,
          baseUrl: SITE_URL,
        });
        await storeReportPdf(onlyAudit.parsedPolicyId, singlePdf).catch(
          () => undefined
        );
      } catch (err) {
        console.error(
          `[audit-runner] single-doc fallback PDF render failed:`,
          err
        );
      }
      let remindMeUrlSolo: string | undefined;
      try {
        const parsed = await findById<ParsedPolicy>(
          Tables.PARSED_POLICIES,
          onlyAudit.parsedPolicyId
        );
        remindMeUrlSolo = maybeBuildRemindUrl(parsed, args.fromEmail);
      } catch (err) {
        console.warn(
          "[audit-runner] solo-fallback remind-url lookup failed:",
          err
        );
      }
      await sendInboundAuditReply({
        to: args.fromEmail,
        firstName,
        vehicleLabel: onlyAudit.vehicleLabel,
        magicLinkUrl: buildAuditMagicLinkUrl(
          args.fromEmail,
          SITE_URL,
          `/report/${onlyAudit.parsedPolicyId}`
        ),
        pdf: singlePdf ?? Buffer.alloc(0),
        includeDpdpConsentLine: args.includeDpdpConsentLine,
        remindMeUrl: remindMeUrlSolo,
      });
      return;
    }
    console.warn(
      `[audit-runner] no valid audits to send for ${args.fromEmail}; skipping reply`
    );
    return;
  }

  // Compute the side-by-side comparator data inline for the reply
  // body. Best-effort — if computation fails (e.g. missing reports),
  // the email still ships with the master PDF + magic-link, just
  // without the inline comparison summary.
  const comparator = await computeComparatorForReply(args.audits).catch(
    (err) => {
      console.error(
        "[audit-runner] comparator computation failed (non-fatal):",
        err
      );
      return undefined;
    }
  );

  // Build the master PDF filename from the most-common vehicle label.
  const vehicleLabels = new Set(audits.map((a) => a.vehicleLabel));
  const masterFilename =
    vehicleLabels.size === 1
      ? buildMasterPdfFilename(audits[0].vehicleLabel)
      : "Comparison.pdf";

  // Anchor policy for the renewal-reminder link. Anchor = most-recent
  // POLICY in the forward (matches the comparator's anchor selection
  // heuristic). Quotes alone can't be subscribed to. Best-effort
  // lookup; a miss here just suppresses the remind line in the email.
  let remindMeUrlMulti: string | undefined;
  try {
    const candidates: ParsedPolicy[] = [];
    for (const a of args.audits) {
      const parsed = await findById<ParsedPolicy>(
        Tables.PARSED_POLICIES,
        a.parsedPolicyId
      );
      if (parsed && (parsed.documentType ?? "policy") === "policy") {
        candidates.push(parsed);
      }
    }
    candidates.sort(
      (a, b) =>
        new Date(b.odPeriodStart ?? 0).getTime() -
        new Date(a.odPeriodStart ?? 0).getTime()
    );
    remindMeUrlMulti = maybeBuildRemindUrl(
      candidates[0] ?? null,
      args.fromEmail
    );
  } catch (err) {
    console.warn(
      "[audit-runner] multi-doc anchor remind-url lookup failed:",
      err
    );
  }

  // Multi-reply path. Sends ONE email with the master PDF attached.
  await sendInboundMultiAuditReply({
    to: args.fromEmail,
    firstName,
    audits,
    magicLinkUrl,
    masterPdf: masterPdf ?? Buffer.alloc(0),
    masterPdfFilename: masterFilename,
    includeDpdpConsentLine: args.includeDpdpConsentLine,
    comparator,
    excludedDocs: args.excludedDocs,
    remindMeUrl: remindMeUrlMulti,
  });
  console.log(
    `[audit-runner] consolidated reply sent to ${args.fromEmail} — ${audits.length} audits, 1 master PDF${comparator ? " + comparator summary" : ""}`
  );
}

/**
 * Build the inline comparator summary that goes in the multi-audit
 * reply body. Mirrors the comparator engine /reports uses but is
 * scoped to the docs from THIS forward.
 */
async function computeComparatorForReply(
  audited: Array<Extract<AuditPipelineResult, { kind: "audited" }>>
): Promise<InboundComparatorSummary | undefined> {
  if (audited.length < 2) return undefined;

  const fetched = await Promise.all(
    audited.map(async (a) => {
      const [parsed, report] = await Promise.all([
        findById<ParsedPolicy>(Tables.PARSED_POLICIES, a.parsedPolicyId),
        a.policyReportId
          ? findById<PolicyReport>(Tables.REPORTS, a.policyReportId)
          : findOne<PolicyReport>(
              Tables.REPORTS,
              (r) => r.parsedPolicyId === a.parsedPolicyId
            ),
      ]);
      if (!parsed || !report) return null;
      return { parsed, report };
    })
  );
  const valid = fetched.filter(
    (f): f is { parsed: ParsedPolicy; report: PolicyReport } => f !== null
  );
  if (valid.length < 2) return undefined;

  // Anchor: first policy in the list, else first doc.
  const anchor =
    valid.find((v) => (v.parsed.documentType ?? "policy") === "policy") ??
    valid[0];

  const rcp = computeRCP(anchor.parsed, anchor.report);

  const scores = valid.map((v) => {
    const addOnNames = (v.parsed.addOns ?? []).map((a) => a.name);
    const scored = scoreAgainstRcp(addOnNames, rcp);
    const role =
      (v.parsed.documentType ?? "policy") === "quote"
        ? "Renewal quote"
        : "Policy";
    const yearLabel = v.parsed.odPeriodEnd
      ? new Date(v.parsed.odPeriodEnd).getFullYear().toString()
      : "";
    const grandTotal = v.parsed.premium?.grandTotal ?? 0;
    return {
      roleLabel: role,
      insurerName: v.parsed.insurerName || "Unknown insurer",
      yearLabel,
      premiumLabel: grandTotal > 0 ? formatINR(grandTotal) : "—",
      missingRequired: scored.missingRequired,
      isRcpComplete: scored.isRcpComplete,
      grandTotal,
      isExactlyRcp: scored.isExactlyRcp,
      extraNonRcp: scored.extraNonRcp,
    };
  });

  const verdict = buildAuditOnlyVerdict(scores);

  const vehicleLabel =
    `${anchor.parsed.vehicle.make} ${anchor.parsed.vehicle.model}`.trim() ||
    "your car";

  return {
    vehicleLabel,
    requiredAddOns: rcp.requiredAddOns.map((a) => a.name),
    optionalAddOns: rcp.optionalAddOns.map((a) => a.name),
    requiredAddOnsPremiumLabel:
      rcp.requiredAddOnsPremiumTotal > 0
        ? formatINR(rcp.requiredAddOnsPremiumTotal)
        : "₹0",
    idvLabel: rcp.idv.current > 0 ? formatINR(rcp.idv.current) : "—",
    scores: scores.map((s) => ({
      roleLabel: s.roleLabel,
      insurerName: s.insurerName,
      yearLabel: s.yearLabel,
      premiumLabel: s.premiumLabel,
      missingRequired: s.missingRequired,
      isRcpComplete: s.isRcpComplete,
    })),
    verdictHeadline: verdict.headline,
    verdictBody: verdict.body,
  };
}

interface AuditOnlyScoredDoc {
  roleLabel: string;
  insurerName: string;
  yearLabel: string;
  premiumLabel: string;
  missingRequired: string[];
  isRcpComplete: boolean;
  grandTotal: number;
  isExactlyRcp: boolean;
  extraNonRcp: string[];
}

/** Mirrors the marketplace-off branch of /reports' computeVerdict.
 *  Picks the best fit among the customer's own docs. */
function buildAuditOnlyVerdict(scores: AuditOnlyScoredDoc[]): {
  headline: string;
  body: string;
} {
  // Exactly-RCP-complete (no padding) — preferred.
  const exactly = scores
    .filter((s) => s.isExactlyRcp)
    .sort((a, b) => a.grandTotal - b.grandTotal);
  if (exactly.length > 0) {
    const w = exactly[0];
    return {
      headline: `${w.insurerName} comes out ahead.`,
      body: `Covers every recommendation at ${w.premiumLabel} — no missing essentials, no padding. The cleanest fit among what you've forwarded.`,
    };
  }

  // RCP-complete (extras allowed).
  const complete = scores
    .filter((s) => s.isRcpComplete)
    .sort((a, b) => a.grandTotal - b.grandTotal);
  if (complete.length > 0) {
    const w = complete[0];
    const extras = w.extraNonRcp.length
      ? ` (with ${w.extraNonRcp.join(", ")} thrown in)`
      : "";
    return {
      headline: `${w.insurerName} comes out ahead.`,
      body: `Covers everything we recommend${extras} at ${w.premiumLabel}. The most complete cover among what you've forwarded.`,
    };
  }

  // Closest fit — surface what's missing.
  const sorted = [...scores].sort(
    (a, b) =>
      a.missingRequired.length - b.missingRequired.length ||
      a.grandTotal - b.grandTotal
  );
  const closest = sorted[0];
  return {
    headline: `Closest fit: ${closest.insurerName}, but with gaps.`,
    body: `Missing ${closest.missingRequired.join(", ")}. Worth asking the insurer to add ${
      closest.missingRequired.length === 1 ? "this" : "these"
    } before you bind, or shopping for a quote that already includes them.`,
  };
}

/**
 * Look up whether the sender has any prior audits (ParsedPolicy rows
 * for their email). Used to decide whether the reply email includes
 * the first-touch DPDP consent line.
 */
async function senderHasNoPriorAudits(email: string): Promise<boolean> {
  try {
    const lowered = email.toLowerCase();
    const priors = await findMany<ParsedPolicy>(
      Tables.PARSED_POLICIES,
      (p) => (p.owner?.email ?? "").toLowerCase() === lowered
    );
    return priors.length === 0;
  } catch (err) {
    console.error("[audit-runner] senderHasNoPriorAudits check failed:", err);
    return true;
  }
}

// ============================================================================
// Multi-vehicle dispatch — same forward spans multiple cars
// ============================================================================

/** Fetch the ParsedPolicy for each audited outcome. Audits whose row
 *  fetch fails (KV consistency hiccup, deleted row) are filtered out
 *  but logged — the customer still sees the rest of their vehicles. */
async function fetchAuditedParsedPolicies(
  audited: Array<{
    filename: string;
    result: Extract<AuditPipelineResult, { kind: "audited" }>;
  }>
): Promise<AuditedWithPolicy[]> {
  const out: AuditedWithPolicy[] = [];
  for (const a of audited) {
    try {
      const parsed = await findById<ParsedPolicy>(
        Tables.PARSED_POLICIES,
        a.result.parsedPolicyId
      );
      if (!parsed) {
        console.warn(
          `[audit-runner] ParsedPolicy ${a.result.parsedPolicyId} not found during vehicle-grouping fetch; skipping`
        );
        continue;
      }
      out.push({ filename: a.filename, result: a.result, parsed });
    } catch (err) {
      console.error(
        `[audit-runner] ParsedPolicy fetch threw for ${a.result.parsedPolicyId} during vehicle-grouping:`,
        err
      );
    }
  }
  return out;
}

/** Group audited outcomes by vehicleKey. Returns a Map keyed on the
 *  stable vehicle identifier, preserving insertion order (most-recent
 *  audited first when caller passes outcomes in that order). */
function groupByVehicle(
  audited: AuditedWithPolicy[]
): Map<string, AuditedWithPolicy[]> {
  const groups = new Map<string, AuditedWithPolicy[]>();
  for (const a of audited) {
    const key = vehicleKey(a.parsed);
    const arr = groups.get(key) ?? [];
    arr.push(a);
    groups.set(key, arr);
  }
  return groups;
}

/**
 * Multi-vehicle reply path. Builds per-vehicle sections for the email
 * body, renders a master PDF that puppeteer assembles by hitting
 * /reports?docs=<all ids> (the /reports page itself detects
 * multi-vehicle and lays out vehicle tabs / sections), then sends ONE
 * email with that PDF + a magic link.
 *
 * Per-vehicle section contains:
 *   · Vehicle label (make + model + year)
 *   · Doc count for that vehicle
 *   · Insurer name (anchor)
 *   · Top gap headline if any
 *   · Aryan's bottom-line verdict
 *
 * Customer reads: "Audits ready · N vehicles. Here's each one."
 */
async function sendMultiVehicleReplyForForward(args: {
  fromEmail: string;
  vehicleGroups: Map<string, AuditedWithPolicy[]>;
  excludedDocs: ExcludedDoc[];
  includeDpdpConsentLine: boolean;
}): Promise<void> {
  const magicLinkUrl = buildAuditMagicLinkUrl(
    args.fromEmail,
    SITE_URL,
    "/reports"
  );

  // Build one section per vehicle. Within each section we pick the
  // ANCHOR doc (same heuristic as MultiDocComparison: most-recent
  // policy if any, else most-recent doc) and render its summary.
  const sections: InboundMultiVehicleSection[] = [];
  const allDocIds: string[] = [];

  for (const [key, audits] of args.vehicleGroups.entries()) {
    // Anchor selection — same as buildMultiDocComparison.
    const policies = audits.filter(
      (a) => (a.parsed.documentType ?? "policy") === "policy"
    );
    const sortByMostRecent = (a: AuditedWithPolicy, b: AuditedWithPolicy) =>
      new Date(b.parsed.odPeriodStart ?? 0).getTime() -
      new Date(a.parsed.odPeriodStart ?? 0).getTime();
    const anchor =
      policies.sort(sortByMostRecent)[0] ?? [...audits].sort(sortByMostRecent)[0];

    // Pull anchor's report to surface the bottom line in the email body.
    let anchorReport: PolicyReport | null = null;
    try {
      anchorReport = await findOne<PolicyReport>(
        Tables.REPORTS,
        (r) => r.parsedPolicyId === anchor.result.parsedPolicyId
      );
    } catch (err) {
      console.error(
        `[audit-runner] anchor report fetch failed for ${anchor.result.parsedPolicyId}:`,
        err
      );
    }

    // Collect all doc IDs from this vehicle group for the master PDF
    // render URL (puppeteer hits /reports?docs=id,id,id&print=1).
    allDocIds.push(...audits.map((a) => a.result.parsedPolicyId));

    // Bottom-line text — string OR {verdict, action} shape, flatten.
    let bottomLineText = "";
    const bl = anchorReport?.bottomLine;
    if (bl) {
      if (typeof bl === "string") {
        bottomLineText = bl;
      } else {
        bottomLineText = [bl.verdict, bl.action].filter(Boolean).join(" ");
      }
    }

    sections.push({
      vehicleKey: key,
      vehicleLabel: vehicleLabel(anchor.parsed),
      docCount: audits.length,
      insurerName: anchor.parsed.insurerName || "your insurer",
      docTypeLabel:
        (anchor.parsed.documentType ?? "policy") === "quote"
          ? "Renewal quote"
          : "Policy",
      yearLabel: anchor.parsed.odPeriodEnd
        ? new Date(anchor.parsed.odPeriodEnd).getFullYear().toString()
        : "",
      bottomLine: bottomLineText,
      anchorParsedPolicyId: anchor.result.parsedPolicyId,
      // Per-vehicle one-click "remind me" link. Skipped when the
      // anchor is a quote or its expiry has lapsed.
      remindMeUrl: maybeBuildRemindUrl(anchor.parsed, args.fromEmail),
    });
  }

  // Render master PDF — /reports with ALL the doc IDs across all
  // vehicles. The page itself detects multi-vehicle and lays out the
  // per-vehicle sections in print mode.
  let masterPdf: Buffer | null = null;
  try {
    const t0 = Date.now();
    masterPdf = await renderReportsPdf({
      docIds: allDocIds,
      baseUrl: SITE_URL,
      excludedDocs: args.excludedDocs,
    });
    console.log(
      `[audit-runner] rendered multi-vehicle master PDF in ${Date.now() - t0}ms (${masterPdf.length} bytes) for ${sections.length} vehicles`
    );
  } catch (err) {
    console.error(
      `[audit-runner] multi-vehicle master PDF render failed; sending without attachment:`,
      err
    );
  }

  // Greeting first-name lookup.
  const lowered = args.fromEmail.toLowerCase();
  const userRow = await findOne<User>(
    Tables.USERS,
    (u) => (u.email ?? "").toLowerCase() === lowered
  );
  const firstName = friendlyFirstName(userRow?.name) || undefined;

  await sendInboundMultiVehicleReply({
    to: args.fromEmail,
    firstName,
    sections,
    magicLinkUrl,
    masterPdf: masterPdf ?? Buffer.alloc(0),
    masterPdfFilename: `Audits — ${sections.length} vehicles.pdf`,
    includeDpdpConsentLine: args.includeDpdpConsentLine,
    excludedDocs: args.excludedDocs,
  });
  console.log(
    `[audit-runner] multi-vehicle reply sent to ${args.fromEmail} — ${sections.length} vehicles, ${allDocIds.length} docs total`
  );
}
