/**
 * Worker endpoint — receives QStash callbacks for inbound-forward
 * audit jobs.
 *
 * Flow:
 *   1. Verify the Upstash-Signature on the callback. Reject 401 if
 *      missing or invalid. (Without this, the worker is open to
 *      arbitrary callers triggering LLM spend.)
 *   2. Read forwardId from the body.
 *   3. Check the retry-count header. If this is the FIRST retry
 *      (count === 1), fire a "holding" reply to the customer so they
 *      know the audit is taking a bit longer than usual.
 *   4. Load the forward state from KV (sender + PDF blob URLs).
 *   5. Fetch each PDF from Blob, then call the existing
 *      runAuditsForInboundForward() to do the actual audit work.
 *   6. On success, return 200. QStash marks the job complete.
 *      On failure (throw), QStash schedules a retry per the publish
 *      config (5 retries, exponential backoff). After 5 failures it
 *      POSTs to /api/jobs/audit-forward-failed.
 *
 * Idempotency: the run is fully idempotent — even if the same job
 * runs twice, the customer sees one extra reply, never wrong data.
 * QStash's deduplicationId (set on publish) covers most accidental
 * doubles; this layer is the secondary guard.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyQStashSignature,
  getRetryCount,
} from "@/lib/qstash";
import { loadForwardJob, deleteForwardJob } from "@/lib/forward-store";
import { sendHoldingReplyEmail } from "@/lib/email-sender";
import { runAuditsForInboundForward } from "@/lib/audit-runner";

// Worker can run as long as the longest audit pipeline. The current
// /api/inbound/email also runs at maxDuration 300; we mirror it.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // ---- 1. Signature verification ----
  const valid = await verifyQStashSignature(request, rawBody);
  if (!valid) {
    console.warn(
      "[jobs/audit-forward] rejected unverified callback (no/invalid Upstash-Signature)"
    );
    return NextResponse.json(
      { error: "invalid signature" },
      { status: 401 }
    );
  }

  // ---- 2. Parse body ----
  let body: { forwardId?: string };
  try {
    body = JSON.parse(rawBody) as { forwardId?: string };
  } catch (err) {
    console.error("[jobs/audit-forward] invalid JSON body:", err);
    return NextResponse.json(
      { error: "invalid json body" },
      { status: 400 }
    );
  }
  if (!body.forwardId || typeof body.forwardId !== "string") {
    return NextResponse.json(
      { error: "missing forwardId" },
      { status: 400 }
    );
  }
  const forwardId = body.forwardId;
  const retryCount = getRetryCount(request);
  console.log(
    `[jobs/audit-forward] received forwardId=${forwardId} retry=${retryCount}`
  );

  // ---- 3. Holding reply on first retry ----
  // We only know we're in "slow path" territory once the first attempt
  // has failed. Fire the holding email so the customer knows their
  // forward is being worked on. Best-effort — don't fail the job if
  // this email fails to send.
  if (retryCount === 1) {
    const job = await loadForwardJob(forwardId);
    if (job) {
      try {
        await sendHoldingReplyEmail({ to: job.fromEmail });
        console.log(
          `[jobs/audit-forward] sent holding reply to ${job.fromEmail} on first retry of forwardId=${forwardId}`
        );
      } catch (err) {
        console.error(
          `[jobs/audit-forward] holding-reply send failed (non-fatal):`,
          err
        );
      }
    }
  }

  // ---- 4. Load forward state ----
  const job = await loadForwardJob(forwardId);
  if (!job) {
    // Forward state expired or never stored. This is a hard failure
    // — we have no PDFs to audit. Return 200 (don't trigger another
    // QStash retry) but log loudly.
    console.error(
      `[jobs/audit-forward] no forward state found for forwardId=${forwardId} (TTL'd or never stored?) — giving up`
    );
    return NextResponse.json(
      { error: "forward state not found", forwardId },
      { status: 200 }
    );
  }

  // ---- 5. Fetch PDFs from Blob + run the existing pipeline ----
  // PDFs were saved to Vercel Blob during webhook intake. We fetch
  // them back here so the worker has the same byte input the sync
  // path would have had.
  try {
    const pdfBuffers = await Promise.all(
      job.pdfRefs.map(async (ref) => {
        const res = await fetch(ref.blobUrl);
        if (!res.ok) {
          throw new Error(
            `Blob fetch ${ref.blobUrl} returned ${res.status} for ${ref.name}`
          );
        }
        const arrayBuffer = await res.arrayBuffer();
        return {
          buffer: Buffer.from(arrayBuffer),
          name: ref.name,
          inboundId: ref.inboundId,
        };
      })
    );

    console.log(
      `[jobs/audit-forward] running audit pipeline for forwardId=${forwardId} (${pdfBuffers.length} PDFs, sender=${job.fromEmail})`
    );

    await runAuditsForInboundForward({
      pdfBuffers,
      fromEmail: job.fromEmail,
      subject: job.subject,
    });

    // ---- 6. Cleanup on success ----
    await deleteForwardJob(forwardId);
    console.log(
      `[jobs/audit-forward] completed forwardId=${forwardId} successfully`
    );
    return NextResponse.json({ ok: true, forwardId });
  } catch (err) {
    // Re-throw to QStash so the retry scheduler picks it up. The
    // failure callback handles the after-all-retries terminal case.
    console.error(
      `[jobs/audit-forward] pipeline run failed for forwardId=${forwardId} (retry=${retryCount}); will retry:`,
      err
    );
    // Throwing in a Next.js route handler doesn't trigger a QStash
    // retry — we have to return a 5xx. QStash treats any non-2xx as
    // a failure and schedules a retry per the publish config.
    return NextResponse.json(
      {
        error: "pipeline-failed",
        forwardId,
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
