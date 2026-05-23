import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { waitUntil } from "@vercel/functions";
import { kv } from "@vercel/kv";
import { storeInboxPdf } from "@/lib/blob-store";
import { sendRateLimitReplyEmail } from "@/lib/email-sender";
import { enqueueAuditForward, isQStashConfigured } from "@/lib/qstash";
import { storeForwardJob } from "@/lib/forward-store";
import {
  runAuditsForInboundForward,
  sendNoMatchReplyForForward,
} from "@/lib/audit-runner";

// Customer-facing SITE_URL lives in audit-runner.ts now (it owns the
// magic-link + PDF-render URLs that reach customer inboxes). This
// file no longer references the constant directly; the inbound webhook
// only writes to KV + enqueues jobs.

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

  // Hand off audit work to the QStash queue when configured. The
  // queue gives us five durable retries with exponential backoff
  // (1m, 5m, 15m, 1h, 6h) for any transient infra hiccup — without
  // ever asking the customer to forward again. After all retries the
  // failure callback (/api/jobs/audit-forward-failed) sends a polite
  // "we're looking into it" reply + pages the founder via Sentry.
  //
  // Sync fallback: when QSTASH_TOKEN isn't set (local dev, early
  // production before the env var lands), we run the pipeline inline
  // via waitUntil() — identical to the pre-queue behaviour. This
  // means the code can ship before Vercel env vars are configured;
  // once QSTASH_TOKEN is in place the queue path activates with no
  // further code change.
  const forwardId = randomUUID();
  if (isQStashConfigured()) {
    // Try the queue path. ANY failure inside this branch (KV write
    // throws, QStash enqueue throws, etc.) falls through to the sync
    // fallback below — never lose the forward because a piece of
    // queue infrastructure hiccups.
    try {
      // Store sender + PDF references in KV under forwardId. The worker
      // reloads this and fetches the PDFs back from Blob.
      await storeForwardJob({
        forwardId,
        fromEmail,
        subject,
        pdfRefs: saved.map((s) => ({
          name: s.name,
          inboundId: s.inboundId,
          blobUrl: s.blobUrl,
          sizeBytes: s.sizeBytes,
        })),
        receivedAt: new Date().toISOString(),
      });
      const enqueued = await enqueueAuditForward({ forwardId });
      if (enqueued) {
        console.log(
          `[inbound/email] enqueued forwardId=${forwardId} (messageId=${enqueued.messageId}) for ${fromEmail}`
        );
        return NextResponse.json({
          ok: true,
          sender: fromEmail,
          pdfsReceived: pdfAttachments.length,
          pdfsStored: saved.length,
          forwardId,
          mode: "queued",
        });
      }
      // Enqueue returned null — log and fall through.
      console.warn(
        `[inbound/email] QStash enqueue returned null for forwardId=${forwardId}; falling back to sync path`
      );
    } catch (err) {
      // KV write OR enqueue threw. Don't lose the forward — fall
      // through to the sync path so the customer still gets an audit.
      console.error(
        `[inbound/email] queue branch threw for forwardId=${forwardId}; falling back to sync path:`,
        err
      );
    }
  }

  // Synchronous fallback path. waitUntil keeps the function alive
  // until the audit completes (up to maxDuration). The webhook
  // returns 200 to Postmark immediately.
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
    forwardId,
    mode: "sync",
  });
}

// runAuditsForInboundForward + its helpers moved to src/lib/audit-runner.ts
// so the QStash worker (/api/jobs/audit-forward) can call them too.
// Next.js route files can only export HTTP method handlers, so the
// shared logic had to live outside the route module.


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
