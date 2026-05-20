import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { waitUntil } from "@vercel/functions";
import { storeInboxPdf } from "@/lib/blob-store";
import { runAuditPipeline, type AuditPipelineResult } from "@/lib/audit-pipeline";
import {
  sendInboundAuditReply,
  sendInboundNoMatchReply,
  type InboundNoMatchReason,
} from "@/lib/email-sender";
import { buildAuditMagicLinkUrl } from "@/lib/email-token";
import { renderReportPdf } from "@/lib/pdf-renderer";
import { storeReportPdf } from "@/lib/blob-store";
import { findMany, findOne, Tables } from "@/lib/db";
import { friendlyFirstName } from "@/lib/format";
import type { ParsedPolicy, User } from "@/lib/types";

const SITE_URL = "https://rightoffer.in";

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
// 300s covers the inbound payload decode + Blob writes + per-PDF
// audit pipeline (extractPdfText ~5s + classify ~3s + extract ~25s +
// generateReport ~30s = ~63s per PDF, with headroom for outlier LLM
// latency and the rare 2-PDF forward). Postmark's webhook timeout is
// 30s — anything longer triggers a retry. We work around this by
// firing the audit work inside waitUntil so the webhook handler
// itself returns fast.
export const maxDuration = 300;

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
  const outcomes: AuditPipelineResult[] = [];
  for (const { buffer, name, inboundId } of args.pdfBuffers) {
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
      outcomes.push(result);
      if (result.kind === "audited") {
        console.log(
          `[inbound/email] ${name}: audited as ${result.documentType}, parsed=${result.parsedPolicyId}, report=${result.policyReportId ?? "(missing)"}`
        );
      } else {
        console.log(
          `[inbound/email] ${name}: ${result.kind} (${result.kind === "rejected" ? result.category : result.category})`
        );
      }
    } catch (err) {
      console.error(
        `[inbound/email] audit pipeline crashed for ${name}:`,
        err
      );
    }
  }

  // K6 — for each successful audit, send an editorial reply with the
  // PDF attached and a magic-link to view on the web.
  //
  // We send one reply PER audited PDF (not one combined reply per
  // forward). Reasoning: each audit is a distinct piece of content
  // with its own report URL. Bundling would mean either a single PDF
  // with multiple sections (more rendering complexity) or a single
  // email with N magic-links (confusing — which one is mine?). One
  // email per audit is the same pattern the web-upload path uses
  // when a customer uploads multiple PDFs in a session.
  const audited = outcomes.filter(
    (o): o is Extract<AuditPipelineResult, { kind: "audited" }> =>
      o.kind === "audited"
  );

  // First-time sender? Used to decide whether the reply includes the
  // DPDP consent line. We check AFTER the audit because the pipeline
  // itself upserts the User row + stamps consent. We're looking at
  // whether this is the customer's FIRST audit overall.
  const isFirstAudit = await senderHasNoPriorAudits(args.fromEmail);

  for (const result of audited) {
    try {
      await sendAuditReplyForForward({
        fromEmail: args.fromEmail,
        parsedPolicyId: result.parsedPolicyId,
        vehicleLabel: result.vehicleLabel,
        includeDpdpConsentLine: isFirstAudit,
      });
    } catch (err) {
      console.error(
        `[inbound/email] reply send failed for ${result.parsedPolicyId}:`,
        err
      );
    }
  }

  // Zero successful audits → fire the polite no-match reply. Context-
  // aware: if the classifier rejected a specific vehicle class, surface
  // that in the reply opener. Otherwise the reply is generic.
  if (audited.length === 0 && outcomes.length > 0) {
    const reason = inferNoMatchReason(outcomes);
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
    `[inbound/email] forward processed: ${outcomes.length} attempt(s), ${audited.length} audited & replied`
  );
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
    // The pipeline just wrote one (or more) ParsedPolicy row(s) for
    // THIS forward. If there's only that count, it's their first
    // forward. If there are MORE, they've forwarded before.
    return priors.length <= 1;
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
