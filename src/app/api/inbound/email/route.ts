import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { storeInboxPdf } from "@/lib/blob-store";

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
// 60s window covers the inbound payload decode + Blob writes. The
// actual parse + audit (K4) happens via the existing parse pipeline,
// which can take up to ~120s — we'll fire that via waitUntil so the
// webhook itself returns fast and Postmark doesn't retry.
export const maxDuration = 60;

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
    // K5 will replace this log with a polite "no policy found" reply.
    console.log(
      `[inbound/email] No PDFs found in forward from ${fromEmail}; K5 reply pending`
    );
    return NextResponse.json({
      ok: true,
      sender: fromEmail,
      pdfsReceived: 0,
      note: "no PDFs — K5 polite reply will trigger here once wired",
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

  // K4 will pick up from here: for each saved PDF, run the parser,
  // classify, and if it qualifies as a policy or quote with high or
  // medium confidence, write a ParsedPolicy row + generate a report
  // + send a reply email. For now, the webhook just returns success
  // so we can validate end-to-end plumbing.

  return NextResponse.json({
    ok: true,
    sender: fromEmail,
    pdfsReceived: pdfAttachments.length,
    pdfsStored: saved.length,
    note: "K3 scaffold — parsing + reply pipeline lands in K4-K6",
  });
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
