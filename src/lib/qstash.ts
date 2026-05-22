/**
 * Upstash QStash client wrapper.
 *
 * QStash is an HTTP-based queue: we POST a job, QStash POSTs back to a
 * callback URL with retry semantics (up to 5 retries with exponential
 * backoff between minutes and hours). Designed for Vercel serverless —
 * no long-running worker process required.
 *
 * Used by /api/inbound/email to hand off heavy audit work asynchronously
 * so the webhook returns 200 to Postmark in <2s, and a worker endpoint
 * processes the audit in the background with automatic retry on failure.
 *
 * Falls back to a "no queue configured" state when QSTASH_TOKEN is unset
 * so the codebase can ship before the env var is provisioned in Vercel.
 * Inbound webhook keeps the synchronous fallback path for that case.
 */

import { Client, Receiver } from "@upstash/qstash";

const SITE_URL = process.env.SITE_URL || "https://rightoffer.in";

let _client: Client | null = null;
let _receiver: Receiver | null = null;

function getClient(): Client | null {
  if (!process.env.QSTASH_TOKEN) return null;
  if (_client) return _client;
  _client = new Client({ token: process.env.QSTASH_TOKEN });
  return _client;
}

function getReceiver(): Receiver | null {
  const current = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const next = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!current || !next) return null;
  if (_receiver) return _receiver;
  _receiver = new Receiver({
    currentSigningKey: current,
    nextSigningKey: next,
  });
  return _receiver;
}

/**
 * Is the QStash queue available for use? When false, callers should
 * fall back to running work inline (current synchronous behaviour).
 */
export function isQStashConfigured(): boolean {
  return !!process.env.QSTASH_TOKEN;
}

export interface EnqueueAuditForwardOptions {
  /** Customer forward we're enqueuing. The worker will reload the
   *  forward metadata (PDFs + sender) from the forward-store KV using
   *  this ID. */
  forwardId: string;
}

/**
 * Publish an audit-forward job to QStash.
 *
 * QStash will POST to /api/jobs/audit-forward with the body
 * { forwardId } up to 5 times with exponential backoff. On all 5
 * failures it POSTs to /api/jobs/audit-forward-failed (the failure
 * callback) so we can send the customer a "we couldn't complete this"
 * reply and page the team.
 *
 * `deduplicationId` set to the forwardId so a webhook re-delivery from
 * Postmark (rare but possible) doesn't enqueue twice.
 */
export async function enqueueAuditForward(
  opts: EnqueueAuditForwardOptions
): Promise<{ messageId: string } | null> {
  const client = getClient();
  if (!client) {
    console.warn(
      "[qstash] QSTASH_TOKEN not configured — falling back to synchronous audit"
    );
    return null;
  }
  try {
    const callbackUrl = `${SITE_URL}/api/jobs/audit-forward`;
    const failureUrl = `${SITE_URL}/api/jobs/audit-forward-failed`;
    const res = await client.publishJSON({
      url: callbackUrl,
      body: { forwardId: opts.forwardId },
      retries: 5,
      failureCallback: failureUrl,
      deduplicationId: opts.forwardId,
    });
    console.log(
      `[qstash] enqueued forwardId=${opts.forwardId} as messageId=${res.messageId}`
    );
    return { messageId: res.messageId };
  } catch (err) {
    console.error(
      `[qstash] enqueue failed for forwardId=${opts.forwardId}:`,
      err
    );
    return null;
  }
}

/**
 * Verify the Upstash-Signature header on a QStash callback. Must be
 * called before processing any callback body — otherwise our worker
 * endpoint is open to arbitrary callers triggering audit work.
 *
 * Returns false on missing config / missing header / invalid signature.
 * The route should reject with 401 on false.
 */
export async function verifyQStashSignature(
  req: Request,
  rawBody: string
): Promise<boolean> {
  const receiver = getReceiver();
  if (!receiver) {
    // No signing keys configured. In a production deploy this is a
    // misconfiguration; reject the callback rather than process it
    // unverified. (Sync-fallback installs don't have the worker
    // endpoint reachable so this path isn't hit.)
    console.warn(
      "[qstash] signing keys not configured; rejecting unverified callback"
    );
    return false;
  }
  const signature = req.headers.get("upstash-signature");
  if (!signature) return false;
  try {
    return await receiver.verify({
      signature,
      body: rawBody,
      url: req.url,
    });
  } catch (err) {
    console.error("[qstash] signature verification failed:", err);
    return false;
  }
}

/**
 * Read the retry-count header from a QStash callback.
 * First attempt = 0, first retry = 1, ..., fifth retry = 5.
 * Used by the worker to decide whether to fire the "holding" customer
 * email (only on the first retry).
 */
export function getRetryCount(req: Request): number {
  const raw = req.headers.get("upstash-retried");
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
