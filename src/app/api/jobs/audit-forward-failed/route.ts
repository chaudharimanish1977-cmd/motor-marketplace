/**
 * Terminal-failure callback — receives QStash's failureCallback POST
 * after all 5 retries on /api/jobs/audit-forward have failed.
 *
 * Customer outcome: receives the "we're looking into it" reply (never
 * blamed, never asked to forward again).
 * Founder outcome: paged via Sentry (and Vercel logs as backup) so the
 * follow-up promise we just made is actually fulfilled.
 *
 * QStash's failureCallback payload includes the original message body
 * plus retry metadata. We extract the forwardId so we know who to
 * apologise to, then clean up the forward state.
 *
 * IMPORTANT: this endpoint is the *terminal* failure path. It MUST
 * return 2xx, otherwise QStash will keep trying to call IT — at which
 * point the failure handling itself is in retry hell. Always 200.
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import {
  verifyQStashSignature,
} from "@/lib/qstash";
import { loadForwardJob, deleteForwardJob } from "@/lib/forward-store";
import { sendPermanentFailureReplyEmail } from "@/lib/email-sender";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // ---- 1. Signature verification ----
  const valid = await verifyQStashSignature(request, rawBody);
  if (!valid) {
    console.warn(
      "[jobs/audit-forward-failed] rejected unverified callback"
    );
    return NextResponse.json(
      { error: "invalid signature" },
      { status: 401 }
    );
  }

  // ---- 2. Extract forwardId ----
  // QStash failureCallback POSTs the ORIGINAL message body verbatim
  // alongside failure metadata in headers + an outer wrapper. We
  // accept either shape so a future QStash change doesn't break us.
  let forwardId: string | null = null;
  let failureMetadata: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(rawBody);
    if (parsed && typeof parsed === "object") {
      // Direct shape: { forwardId: "..." }
      if (typeof parsed.forwardId === "string") {
        forwardId = parsed.forwardId;
      }
      // Wrapped shape: { sourceBody: "<base64>", ... }
      if (typeof parsed.sourceBody === "string") {
        try {
          const decoded = JSON.parse(
            Buffer.from(parsed.sourceBody, "base64").toString("utf8")
          );
          if (decoded && typeof decoded.forwardId === "string") {
            forwardId = decoded.forwardId;
          }
        } catch {
          // Fall through; we'll still report the failure even without
          // the forwardId.
        }
      }
      failureMetadata = parsed as Record<string, unknown>;
    }
  } catch (err) {
    console.error(
      "[jobs/audit-forward-failed] couldn't parse failure body:",
      err
    );
  }

  // ---- 3. Sentry alert ----
  // This is the page-the-team moment. Tag with forwardId for triage.
  Sentry.captureMessage(
    `Audit forward exhausted all queue retries${
      forwardId ? ` (forwardId=${forwardId})` : ""
    }`,
    {
      level: "error",
      tags: forwardId ? { forwardId } : {},
      extra: failureMetadata,
    }
  );
  console.error(
    `[jobs/audit-forward-failed] terminal failure for forwardId=${forwardId ?? "<unknown>"}`,
    failureMetadata
  );

  // ---- 4. Customer apology + state cleanup ----
  if (forwardId) {
    const job = await loadForwardJob(forwardId);
    if (job) {
      try {
        await sendPermanentFailureReplyEmail({ to: job.fromEmail });
        console.log(
          `[jobs/audit-forward-failed] sent permanent-failure reply to ${job.fromEmail}`
        );
      } catch (err) {
        // The Sentry alert above is still our primary signal — the
        // founder can manually email the customer if this fails.
        console.error(
          `[jobs/audit-forward-failed] permanent-failure email send failed:`,
          err
        );
        Sentry.captureException(err, { tags: { forwardId } });
      }
      await deleteForwardJob(forwardId);
    }
  }

  // Flush Sentry before the function instance shuts down — otherwise
  // queued events get dropped when the serverless process is killed
  // post-return. 8s ceiling covers Sentry EU-region cold-start
  // latency from Vercel US (sufficient for ~2 events with TLS).
  // Without this, captureMessage / captureException above are
  // best-effort fire-and-forget — and the page-the-team promise
  // becomes empty.
  try {
    await Sentry.flush(8000);
  } catch (err) {
    console.error(
      "[jobs/audit-forward-failed] Sentry.flush failed (non-fatal):",
      err
    );
  }

  // ALWAYS 2xx. See file header for why.
  return NextResponse.json({ ok: true, forwardId });
}
