/**
 * Forward-state store.
 *
 * Bridges the inbound webhook to the queue worker. The webhook stores
 * what was forwarded (sender + PDFs as Blob URLs) under a forwardId,
 * then enqueues a QStash job with just the forwardId. The worker
 * reloads the forward by ID, fetches the PDFs from Blob, and runs the
 * audit pipeline.
 *
 * Why not pass PDF buffers through the queue body? Two reasons:
 *   1. QStash bodies are capped at ~1 MB; PDFs can easily be 5-10 MB.
 *   2. Re-deliveries on retry would re-transmit the buffers each time.
 * The Blob URL pattern keeps the queue body small and the PDFs durable.
 *
 * KV entries TTL at 24h — much longer than QStash's 6h retry window,
 * so a job that's still retrying always finds its forward state intact.
 */

import { kv } from "@vercel/kv";

const TTL_SECONDS = 24 * 60 * 60; // 24h

export interface ForwardPdfRef {
  /** Original filename as the customer's mail client called it. */
  name: string;
  /** Per-PDF UUID stamped at intake time. */
  inboundId: string;
  /** Vercel Blob URL — the worker fetches the PDF from here. */
  blobUrl: string;
  /** For logging + sanity checks. */
  sizeBytes: number;
}

export interface ForwardJobState {
  /** Stable per-forward UUID. The QStash message body carries only this. */
  forwardId: string;
  /** Sender's email, lower-cased. */
  fromEmail: string;
  /** Original email subject. Logged for diagnostics; not customer-facing. */
  subject: string;
  /** PDF blobs to feed the audit pipeline. */
  pdfRefs: ForwardPdfRef[];
  /** ISO timestamp the webhook accepted the forward. */
  receivedAt: string;
}

const key = (forwardId: string) => `fwd:${forwardId}`;

/**
 * Persist a forward's state. Idempotent — re-stores overwrite the same
 * key, so a webhook re-delivery for the same Postmark message won't
 * fragment the state across keys.
 */
export async function storeForwardJob(job: ForwardJobState): Promise<void> {
  await kv.set(key(job.forwardId), job, { ex: TTL_SECONDS });
}

/**
 * Reload a forward's state. Returns null if the forwardId was never
 * stored, or if the entry expired (job was retrying for > 24h, which
 * means QStash has long given up too).
 */
export async function loadForwardJob(
  forwardId: string
): Promise<ForwardJobState | null> {
  return await kv.get<ForwardJobState>(key(forwardId));
}

/**
 * Clear a forward's state once the audit completes successfully (or
 * permanently fails). Non-fatal: a cleanup failure leaves the entry to
 * TTL out naturally in 24h.
 */
export async function deleteForwardJob(forwardId: string): Promise<void> {
  try {
    await kv.del(key(forwardId));
  } catch (err) {
    console.warn(
      `[forward-store] cleanup failed for ${forwardId} (non-fatal):`,
      err
    );
  }
}
