import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { waitUntil } from "@vercel/functions";
import { kv } from "@vercel/kv";
import { storeInboxPdf } from "@/lib/blob-store";
import {
  runAuditPipeline,
  recordDpdpConsent,
  type AuditPipelineResult,
} from "@/lib/audit-pipeline";
import {
  buildMasterPdfFilename,
  sendInboundAuditReply,
  sendInboundMultiAuditReply,
  sendInboundNoMatchReply,
  sendRateLimitReplyEmail,
  type InboundComparatorSummary,
  type InboundMultiAuditAttachment,
  type InboundNoMatchReason,
} from "@/lib/email-sender";
import { buildAuditMagicLinkUrl } from "@/lib/email-token";
import { renderReportPdf, renderReportsPdf } from "@/lib/pdf-renderer";
import { storeReportPdf } from "@/lib/blob-store";
import { findById, findMany, findOne, Tables } from "@/lib/db";
import { friendlyFirstName, formatINR } from "@/lib/format";
import {
  computeRCP,
  scoreAgainstRcp,
} from "@/lib/recommended-coverage-profile";
import type { ParsedPolicy, PolicyReport, User } from "@/lib/types";

const SITE_URL = "https://rightoffer.in";

/** Per-sender rate limits. Defensive against spam, accidental
 *  re-forward loops, and abusive automation. Generous enough that
 *  realistic renewal-shopping behaviour (forwarding multiple quotes
 *  + policy versions over a day) never hits them. */
const RATE_LIMIT_HOURLY = 20;
const RATE_LIMIT_DAILY = 100;

/** Internal test addresses bypassed from rate limiting entirely so
 *  testing scenarios (founder + trusted testers) never get blocked.
 *  Add new addresses here when onboarding new internal testers.
 *  Compared case-insensitively; entries here MUST be lowercased. */
const RATE_LIMIT_BYPASS_EMAILS = new Set([
  "chaudharimanish1977@gmail.com",
  "vikram2lead@gmail.com",
  "expertmanchau@gmail.com",
]);

/** Throwaway/disposable email providers — silent drop these senders.
 *  A real customer's policy email will never be on a throwaway domain.
 *  List is conservative — only blocks domains that exist primarily
 *  for one-shot signups. Expand if abuse appears in production. */
const SPAM_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "yopmail.com",
  "tempmail.com",
  "trashmail.com",
  "throwaway.email",
  "sharklasers.com",
  "maildrop.cc",
]);

const useKv = !!process.env.KV_REST_API_URL;

/**
 * /api/inbound/email — webhook receiver for the email-forward channel.
 *
 * Customer flow:
 *   1. Customer forwards their policy email to review@rightoffer.in
 *   2. Titan Mail receives the forward, then forwards to Postmark's
 *      unique inbound address (configured in Titan as the destination
 *      for review@'s mailbox)
 *   3. Postmark parses the email, posts the JSON payload to this route
 *   4. We extract PDF attachments, save the raw arrivals to Blob, and
 *      hand off to the parse + audit pipeline (K4 lights up next)
 *   5. K5/K6 send the editorial reply
 *
 * Auth: Postmark doesn't HMAC-sign webhooks today, so we authenticate
 * via a long random secret in the URL query string. The full webhook
 * URL configured in Postmark looks like:
 *   https://rightoffer.in/api/inbound/email?token=<48-char-hex>
 * Requests without the matching `?token=` are rejected 401. The secret
 * lives in the POSTMARK_WEBHOOK_TOKEN env var.
 *
 * Why query-string auth instead of HTTP Basic Auth:
 *   - Postmark's UI accepts the full URL including query params, so
 *     pasting the URL once handles the secret. No separate credentials
 *     field to fill in their dashboard.
 *   - Easy to rotate: change the env var + re-paste the new URL.
 *   - The token is never logged to client-side anywhere; only Postmark
 *     and our Vercel env have it.
 *
 * This is K3 (the scaffold). K4 wires the parse+classify+audit. K5+K6
 * send the editorial replies. K7 adds rate limits. K8 wires DPDP.
 */

export const runtime = "nodejs";
// 600s covers the worst-case 3-PDF forward end-to-end:
//   · Audit pipeline (sequential): 3 docs × ~60s = ~180s
//   · PDF rendering (now serial after the parallel-memory bug): 3 ×
//     ~30s = ~90s
//   · Resend send + logging: ~5s
//   Total typical: ~275s. Worst-case outlier LLM latency: ~400s.
// Postmark's webhook timeout is 30s — we work around it by firing
// all the work inside waitUntil so the webhook returns 200 fast.
// 600s gives breathing room without going to Vercel's 900s ceiling.
export const maxDuration = 600;

/**
 * Subset of the Postmark Inbound webhook payload we actually use.
 * Full reference: https://postmarkapp.com/developer/webhooks/inbound-webhook
 *
 * We deliberately type only the fields we touch — typing the full
 * payload (40+ fields) adds noise without value.
 */
interface PostmarkInboundPayload {
  From: string;
  FromName?: string;
  To?: string;
  Subject?: string;
  Date?: string;
  MessageID?: string;
  TextBody?: string;
  HtmlBody?: string;
  Attachments?: PostmarkAttachment[];
}

interface PostmarkAttachment {
  Name: string;
  Content: string; // base64-encoded
  ContentType: string;
  ContentLength: number;
}

interface SavedAttachment {
  name: string;
  sizeBytes: number;
  blobUrl: string;
  inboundId: string;
  /** Raw PDF bytes — kept on the in-memory record so the audit
   *  pipeline doesn't need to re-fetch from Blob. waitUntil keeps
   *  this scope alive past the response. */
  buffer: Buffer;
}

/** Maximum size of a single PDF attachment we'll accept. Mirrors the
 *  10 MB cap on /upload — anything larger is almost certainly a scan,
 *  a multi-doc bundle, or junk. */
const MAX_PDF_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  // ---- Auth check ----
  const expectedToken = process.env.POSTMARK_WEBHOOK_TOKEN;
  if (!expectedToken) {
    console.error(
      "[inbound/email] POSTMARK_WEBHOOK_TOKEN env var is not set — refusing all requests"
    );
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 }
    );
  }
  const providedToken = request.nextUrl.searchParams.get("token");
  if (providedToken !== expectedToken) {
    // 401 with no detail so probes don't get useful info.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ---- Parse payload ----
  let payload: PostmarkInboundPayload;
  try {
    payload = (await request.json()) as PostmarkInboundPayload;
  } catch (err) {
    console.error("[inbound/email] Invalid JSON payload:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fromEmail = (payload.From || "").trim().toLowerCase();
  const subject = payload.Subject || "(no subject)";
  const attachments = payload.Attachments ?? [];

  console.log(
    `[inbound/email] received from=${fromEmail} subject="${subject}" attachments=${attachments.length}`
  );

  if (!fromEmail) {
    // No usable sender = nothing we can reply to. Log + drop.
    console.warn("[inbound/email] No From address; dropping silently");
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // ---- Spam-domain block ----
  // Silent drop senders on throwaway domains. We never want to be a
  // free OCR service for one-shot accounts.
  const domain = fromEmail.split("@")[1] || "";
  if (SPAM_DOMAINS.has(domain)) {
    console.warn(
      `[inbound/email] sender on blocked domain (${domain}); dropping silently`
    );
    return NextResponse.json({ ok: true, dropped: "spam-domain" });
  }

  // ---- Per-sender rate limit ----
  // Sliding-window-ish: two counters (hourly + daily) keyed by sender
  // email, both TTL'd. Internal test addresses (founder + trusted
  // testers, see RATE_LIMIT_BYPASS_EMAILS) bypass entirely so testing
  // scenarios are never blocked.
  //
  // Customers who exceed the limit get a polite reply explaining the
  // window, not a silent drop. Returns 200 to Postmark either way so
  // no webhook retry loop.
  if (!RATE_LIMIT_BYPASS_EMAILS.has(fromEmail)) {
    const limit = await checkRateLimit(fromEmail);
    if (!limit.ok) {
      console.warn(
        `[inbound/email] rate limit exceeded for ${fromEmail} (hourly=${limit.hourly}, daily=${limit.daily})`
      );
      // Fire a polite "you're sending too fast" reply in the background.
      // Best-effort; if Resend errors, the customer just doesn't hear
      // back from this forward.
      waitUntil(sendRateLimitReply(fromEmail, limit));
      return NextResponse.json({
        ok: true,
        dropped: "rate-limit",
        hourly: limit.hourly,
        daily: limit.daily,
      });
    }
  }

  // ---- Filter PDF attachments ----
  const pdfAttachments = attachments.filter(
    (a) => a.ContentType === "application/pdf"
  );
  const nonPdfCount = attachments.length - pdfAttachments.length;
  if (nonPdfCount > 0) {
    console.log(
      `[inbound/email] Ignoring ${nonPdfCount} non-PDF attachment(s)`
    );
  }

  if (pdfAttachments.length === 0) {
    // No PDFs in the forward at all (customer might've forwarded a
    // confirmation email without attachment, or just plain text).
    // Send a polite no-match reply and return 200 to Postmark.
    console.log(
      `[inbound/email] No PDFs found in forward from ${fromEmail}; sending no-pdf reply`
    );
    waitUntil(
      sendNoMatchReplyForForward({
        fromEmail,
        reason: { kind: "no-pdf" },
      })
    );
    return NextResponse.json({
      ok: true,
      sender: fromEmail,
      pdfsReceived: 0,
      reply: "no-pdf",
    });
  }

  // ---- Save each PDF to Blob ----
  // Each gets a fresh inboundId so the raw arrivals are addressable
  // even before parsing decides if they're audit-worthy.
  const saved: SavedAttachment[] = [];
  for (const attachment of pdfAttachments) {
    // Hard cap on size. Postmark itself caps inbound at 35 MB but we
    // mirror the /upload limit to keep behaviour consistent.
    if (attachment.ContentLength > MAX_PDF_BYTES) {
      console.warn(
        `[inbound/email] Skipping oversized PDF "${attachment.Name}" (${attachment.ContentLength} bytes)`
      );
      continue;
    }

    const inboundId = randomUUID();
    let buffer: Buffer;
    try {
      buffer = Buffer.from(attachment.Content, "base64");
    } catch (err) {
      console.error(
        `[inbound/email] Failed to decode base64 for "${attachment.Name}":`,
        err
      );
      continue;
    }

    try {
      const blob = await storeInboxPdf(inboundId, buffer);
      saved.push({
        name: attachment.Name,
        sizeBytes: attachment.ContentLength,
        blobUrl: blob.url,
        inboundId,
        buffer,
      });
      console.log(
        `[inbound/email] Stored "${attachment.Name}" (${attachment.ContentLength} bytes) at ${blob.url}`
      );
    } catch (err) {
      console.error(
        `[inbound/email] Blob upload failed for "${attachment.Name}":`,
        err
      );
    }
  }

  // Schedule the audit pipeline for each saved PDF in the background.
  // We return 200 to Postmark within seconds (Postmark's webhook
  // timeout is 30s and the audit pipeline can take 60-90s per PDF
  // for the LLM extraction + report generation legs). Running inside
  // waitUntil means the function keeps executing after the response
  // is sent, up to maxDuration (300s above).
  //
  // Sequential, not parallel, across PDFs in the same forward —
  // protects against LLM API rate limits and keeps the founder
  // digest readable when multiple audits happen in one inbound.
  waitUntil(
    runAuditsForInboundForward({
      pdfBuffers: saved.map((s) => ({
        buffer: s.buffer,
        name: s.name,
        inboundId: s.inboundId,
      })),
      fromEmail,
      subject,
    })
  );

  return NextResponse.json({
    ok: true,
    sender: fromEmail,
    pdfsReceived: pdfAttachments.length,
    pdfsStored: saved.length,
    note: "audit pipeline scheduled in background; reply email follows when K5/K6 ship",
  });
}

/**
 * Background runner — sequences through each stored PDF, runs the
 * audit pipeline, and logs the outcome. Errors per-PDF are swallowed
 * so one bad PDF doesn't stop downstream PDFs in the same forward
 * from being processed.
 *
 * K5 wires this to send a polite reply when zero PDFs qualify.
 * K6 wires this to send the editorial success reply with audit
 * summaries when one or more PDFs qualify.
 */
async function runAuditsForInboundForward(args: {
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
  // Promise.all and lose the audits for the others.
  console.log(
    `[inbound/email] fanning out ${args.pdfBuffers.length} doc(s) in parallel for ${args.fromEmail}`
  );
  const t0 = Date.now();
  const outcomesWithFile: Array<{
    filename: string;
    result: AuditPipelineResult;
  }> = (
    await Promise.all(
      args.pdfBuffers.map(async ({ buffer, name, inboundId }) => {
        console.log(
          `[inbound/email] starting audit for ${name} (inbound=${inboundId}, sender=${args.fromEmail})`
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
              `[inbound/email] ${name}: audited as ${result.documentType}, parsed=${result.parsedPolicyId}, report=${result.policyReportId ?? "(missing)"}`
            );
          } else {
            console.log(
              `[inbound/email] ${name}: ${result.kind} (${result.category})`
            );
          }
          return { filename: name, result };
        } catch (err) {
          console.error(
            `[inbound/email] audit pipeline crashed for ${name}:`,
            err
          );
          return null;
        }
      })
    )
  ).filter(
    (o): o is { filename: string; result: AuditPipelineResult } => o !== null
  );
  console.log(
    `[inbound/email] parallel fan-out done in ${Date.now() - t0}ms for ${args.fromEmail} (${outcomesWithFile.length}/${args.pdfBuffers.length} returned an outcome)`
  );

  // K6/K11 — send editorial reply with the audit PDF(s) attached.
  //
  // Dispatch: ONE reply per forward, regardless of doc count.
  //   · 1 audited PDF  → single-doc reply via sendInboundAuditReply
  //   · 2+ audited PDFs → consolidated multi-doc reply
  //   · 0 audited      → polite no-match reply
  //
  // Excluded docs (rejected / unreadable) get surfaced in the multi-
  // doc reply body so the customer knows what we couldn't process.
  const audited = outcomesWithFile.filter(
    (o): o is { filename: string; result: Extract<AuditPipelineResult, { kind: "audited" }> } =>
      o.result.kind === "audited"
  );
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
        `[inbound/email] single-reply send failed for ${audited[0].result.parsedPolicyId}:`,
        err
      );
    }
  } else if (audited.length >= 2) {
    try {
      await sendConsolidatedReplyForForward({
        fromEmail: args.fromEmail,
        audits: audited.map((a) => a.result),
        excludedDocs,
        includeDpdpConsentLine: wasFirstTouch,
      });
    } catch (err) {
      console.error(
        `[inbound/email] multi-reply send failed for ${args.fromEmail}:`,
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
      `[inbound/email] zero audited from ${args.fromEmail}; sending no-match reply (kind=${reason.kind})`
    );
    try {
      await sendNoMatchReplyForForward({
        fromEmail: args.fromEmail,
        reason,
      });
    } catch (err) {
      console.error(
        `[inbound/email] no-match reply send failed:`,
        err
      );
    }
  }

  console.log(
    `[inbound/email] forward processed: ${outcomesWithFile.length} attempt(s), ${audited.length} audited & replied, ${excluded.length} excluded`
  );
}

/** Customer-visible exclusion entry for the email body. */
interface ExcludedDoc {
  filename: string;
  /** Short, plain-English reason — e.g. "looks like a two-wheeler policy". */
  reason: string;
}

/**
 * Convert an audit-pipeline rejection into a one-line, customer-
 * friendly reason. The pipeline returns structured rejection data
 * (category + headline + body); we want a tight line ready for a
 * bullet list in the email.
 */
function humaniseExclusionReason(result: AuditPipelineResult): string {
  if (result.kind === "audited") return ""; // shouldn't happen
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
  outcomes: AuditPipelineResult[]
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

  // Then generic non-policy (eg "non-motor", "other", "unknown")
  return { kind: "not-a-policy" };
}

/**
 * Render-free no-match reply runner. Looks up the customer's first
 * name (best-effort) + DPDP-first-touch state, then sends the polite
 * reply. Wraps sendInboundNoMatchReply so the route's logic stays
 * focused on flow control.
 */
async function sendNoMatchReplyForForward(args: {
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
      `[inbound/email] no-match reply sent to ${args.fromEmail} (reason=${args.reason.kind})`
    );
  } catch (err) {
    console.error("[inbound/email] no-match reply failed:", err);
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
      `[inbound/email] rendered PDF for ${args.parsedPolicyId} in ${Date.now() - t0}ms (${pdfBuffer.length} bytes)`
    );
    // Store for later retrieval (so /report's "download PDF" link
    // can serve it instead of re-rendering).
    await storeReportPdf(args.parsedPolicyId, pdfBuffer).catch((err) =>
      console.error("[inbound/email] storeReportPdf failed (non-fatal):", err)
    );
  } catch (err) {
    console.error(
      `[inbound/email] PDF render failed for ${args.parsedPolicyId}; sending without attachment:`,
      err
    );
  }

  // Look up the customer's display name so the editorial reply can
  // greet by first name. May be missing (User row created via the
  // audit pipeline doesn't always carry a name — depends on whether
  // OAuth ever ran). Falls back to a generic "Hi there".
  const lowered = args.fromEmail.toLowerCase();
  const userRow = await findOne<User>(
    Tables.USERS,
    (u) => (u.email ?? "").toLowerCase() === lowered
  );
  const firstName = friendlyFirstName(userRow?.name) || undefined;

  await sendInboundAuditReply({
    to: args.fromEmail,
    firstName,
    vehicleLabel: args.vehicleLabel,
    magicLinkUrl,
    // sendInboundAuditReply requires a PDF; if render failed, fall
    // back to an empty buffer (Resend accepts 0-byte attachments;
    // they show as an empty file but the body still delivers).
    // Better: send a different variant of the email without the
    // attachment when pdf is null. For now, ship the simpler path
    // and iterate if render reliability becomes an issue.
    pdf: pdfBuffer ?? Buffer.alloc(0),
    includeDpdpConsentLine: args.includeDpdpConsentLine,
  });
  console.log(
    `[inbound/email] reply sent to ${args.fromEmail} for ${args.parsedPolicyId}`
  );
}

/**
 * K11 — consolidated reply for forwards yielding 2+ audited PDFs.
 *
 * Renders all audit PDFs in parallel (puppeteer can take 15-30s
 * each; parallel keeps the waitUntil window honest), enriches each
 * with insurer + year so the body + filenames read informatively,
 * then sends ONE email with all attachments + a magic-link to the
 * tabbed /reports view.
 *
 * If any PDF render fails, we still send the email with whatever
 * rendered successfully — graceful degradation. The magic-link
 * always works; the attachments are the cherry.
 */
async function sendConsolidatedReplyForForward(args: {
  fromEmail: string;
  audits: Array<Extract<AuditPipelineResult, { kind: "audited" }>>;
  /** Docs from the same forward that we couldn't process (rejected /
   *  unreadable). Surfaced in the reply body so the customer knows
   *  exactly what landed and what didn't. */
  excludedDocs: ExcludedDoc[];
  includeDpdpConsentLine: boolean;
}): Promise<void> {
  // Phase 3 architecture: ONE master PDF carries the comparator +
  // annexures instead of N per-doc PDFs. Magic-link still lands on
  // the master /reports view; each doc gets an individual magic-link
  // in the email body for those who want to click into a specific
  // report.
  const magicLinkUrl = buildAuditMagicLinkUrl(
    args.fromEmail,
    SITE_URL,
    "/reports"
  );

  // Look up each audit's ParsedPolicy for the per-doc metadata
  // (insurer, year, individual report magic-link).
  const audits: InboundMultiAuditAttachment[] = [];
  for (const audit of args.audits) {
    try {
      const parsed = await findById<ParsedPolicy>(
        Tables.PARSED_POLICIES,
        audit.parsedPolicyId
      );
      if (!parsed) continue;
      const yearLabel = parsed.odPeriodEnd
        ? new Date(parsed.odPeriodEnd).getFullYear().toString()
        : "";
      audits.push({
        vehicleLabel: audit.vehicleLabel,
        documentType: audit.documentType,
        insurerName: parsed.insurerName || "audit",
        yearLabel,
      });
    } catch (err) {
      console.error(
        `[inbound/email] metadata lookup failed for ${audit.parsedPolicyId}:`,
        err
      );
    }
  }

  if (audits.length < 2) {
    console.log(
      `[inbound/email] only ${audits.length} valid audits after metadata lookup for ${args.fromEmail}; falling back to single-doc path`
    );
    // Fall through to single-doc fallback below.
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
      `[inbound/email] rendered master PDF in ${Date.now() - t0}ms (${masterPdf.length} bytes)`
    );
  } catch (err) {
    console.error(
      `[inbound/email] master PDF render failed for ${args.fromEmail}; sending without attachment:`,
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
  // single-doc reply path. Need to render an individual report PDF in
  // that case (master PDF would only contain one annexure, which is
  // weird).
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
          `[inbound/email] single-doc fallback PDF render failed:`,
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
      });
      return;
    }
    console.warn(
      `[inbound/email] no valid audits to send for ${args.fromEmail}; skipping reply`
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
        "[inbound/email] comparator computation failed (non-fatal):",
        err
      );
      return undefined;
    }
  );

  // Build the master PDF filename from the most-common vehicle label.
  // Default to the first audit's vehicle if all are the same; otherwise
  // a generic "Comparison.pdf".
  const vehicleLabels = new Set(audits.map((a) => a.vehicleLabel));
  const masterFilename =
    vehicleLabels.size === 1
      ? buildMasterPdfFilename(audits[0].vehicleLabel)
      : "Comparison.pdf";

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
  });
  console.log(
    `[inbound/email] consolidated reply sent to ${args.fromEmail} — ${audits.length} audits, 1 master PDF${comparator ? " + comparator summary" : ""}`
  );
}

/**
 * Build the inline comparator summary that goes in the multi-audit
 * reply body. Mirrors the comparator engine /reports uses but is
 * scoped to the docs from THIS forward. Returns undefined when there
 * aren't enough docs to compare (caller skips the section).
 *
 * Anchor pick (which doc defines the RCP):
 *   1. The first policy in the forward (most-realistic baseline), OR
 *   2. The first doc overall (when no policy was forwarded).
 *
 * Audit-only verdict path — same logic as /reports comparator when
 * marketplace is off: rank docs by RCP-completeness + price; if
 * nothing is RCP-complete, surface the closest-fit with gaps.
 */
async function computeComparatorForReply(
  audited: Array<Extract<AuditPipelineResult, { kind: "audited" }>>
): Promise<InboundComparatorSummary | undefined> {
  if (audited.length < 2) return undefined;

  // Fetch ParsedPolicy + PolicyReport for each audited doc.
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

  // Audit-only verdict — same logic as the comparator on /reports when
  // marketplace=off. Surface the best fit; if nothing is complete,
  // surface the closest with gaps and what to ask about.
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
 * the first-touch DPDP consent line. The audit pipeline always upserts
 * the User row first, so the User check alone isn't enough — we look
 * at ParsedPolicy rows directly.
 *
 * Returns true when this appears to be the customer's first audit.
 */
async function senderHasNoPriorAudits(email: string): Promise<boolean> {
  try {
    const lowered = email.toLowerCase();
    const priors = await findMany<ParsedPolicy>(
      Tables.PARSED_POLICIES,
      (p) => (p.owner?.email ?? "").toLowerCase() === lowered
    );
    // Called BEFORE the audit pipeline runs, so a true first-time
    // sender shows priors.length === 0. Any prior audits at all
    // → not first-touch.
    return priors.length === 0;
  } catch (err) {
    console.error("[inbound/email] senderHasNoPriorAudits check failed:", err);
    // Default to true — including the DPDP line is safer than
    // omitting it.
    return true;
  }
}

/**
 * Helpful 405 for GET probes (browser tab opens, monitoring tools,
 * curl without -X POST). Postmark only ever POSTs.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "POST only. This endpoint receives Postmark inbound webhooks.",
    },
    { status: 405 }
  );
}

/**
 * Wrapper around sendRateLimitReplyEmail — picks the right "wait an
 * X" window based on which limit was hit. If the daily limit is
 * exceeded, suggest waiting a day; otherwise suggest waiting an hour.
 * Errors swallowed; this runs inside waitUntil so it's best-effort.
 */
async function sendRateLimitReply(
  fromEmail: string,
  limit: { hourly: number; daily: number }
): Promise<void> {
  try {
    await sendRateLimitReplyEmail({
      to: fromEmail,
      window: limit.daily > RATE_LIMIT_DAILY ? "day" : "hour",
    });
    console.log(`[inbound/email] rate-limit reply sent to ${fromEmail}`);
  } catch (err) {
    console.error(
      `[inbound/email] rate-limit reply failed for ${fromEmail}:`,
      err
    );
  }
}

/**
 * Two-window rate-limiter, keyed by sender email. INCR-with-EXPIRE
 * pattern: first hit per window creates the counter and stamps TTL;
 * subsequent hits in the same window increment it. Both windows are
 * checked on every request — a sender at the daily limit gets dropped
 * even if their hourly window has refreshed.
 *
 * Returns ok=false when EITHER window is over its limit; the caller
 * returns 200 to Postmark (no retry) but skips downstream work.
 *
 * Falls open (ok=true) when KV isn't configured — preserves dev/test
 * behaviour where local builds run without Upstash.
 */
async function checkRateLimit(senderEmail: string): Promise<{
  ok: boolean;
  hourly: number;
  daily: number;
}> {
  if (!useKv) {
    return { ok: true, hourly: 0, daily: 0 };
  }
  const lowered = senderEmail.toLowerCase();
  const hourKey = `inbound-rate:${lowered}:h`;
  const dayKey = `inbound-rate:${lowered}:d`;

  try {
    const hourly = await kv.incr(hourKey);
    if (hourly === 1) {
      await kv.expire(hourKey, 60 * 60); // 1 hour
    }
    const daily = await kv.incr(dayKey);
    if (daily === 1) {
      await kv.expire(dayKey, 60 * 60 * 24); // 24 hours
    }
    return {
      ok: hourly <= RATE_LIMIT_HOURLY && daily <= RATE_LIMIT_DAILY,
      hourly,
      daily,
    };
  } catch (err) {
    console.error(
      "[inbound/email] rate-limit KV failed; falling open:",
      err
    );
    return { ok: true, hourly: 0, daily: 0 };
  }
}
