/**
 * Sentry verification endpoint.
 *
 * Sole purpose: prove that the Sentry SDK is wired correctly in
 * production. When hit with the right token, it explicitly captures
 * a message AND throws an error — both should appear in the Sentry
 * dashboard within ~30 seconds.
 *
 * Protected by a server-side env var (SENTRY_TEST_TOKEN). Without
 * the env var set, the endpoint returns a 404-style "not configured"
 * response so casual probes can't trigger it.
 *
 * Usage:
 *   1. Add SENTRY_TEST_TOKEN=<any-secret-string> to Vercel env vars
 *   2. Redeploy
 *   3. Visit https://rightoffer.in/api/admin/sentry-test?token=<secret>
 *   4. Browser sees 500. Check Sentry Issues — two events should land:
 *      - "Sentry test message (manual probe)"  (captureMessage path)
 *      - "Sentry test exception (manual probe)" (auto-capture from throw)
 *   5. Once verified, REMOVE the SENTRY_TEST_TOKEN env var so the
 *      endpoint goes dormant. No need to redeploy to remove it.
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  // Verbose diagnostic logging — Sentry-wiring problems are notoriously
  // silent (no DSN = no error, wrong DSN = events ingest into a project
  // you can't see). Print enough to Vercel logs that we can diagnose
  // from there without needing to attach a debugger.
  console.log("[sentry-test] endpoint hit");

  const expected = process.env.SENTRY_TEST_TOKEN;
  const dsnPresent = !!process.env.SENTRY_DSN;
  const dsnSuffix = process.env.SENTRY_DSN
    ? process.env.SENTRY_DSN.slice(-20)
    : "<not set>";
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;
  const vercelCommit = process.env.VERCEL_GIT_COMMIT_SHA;
  console.log(
    `[sentry-test] env: SENTRY_DSN.suffix=${dsnSuffix} TOKEN_SET=${!!expected} NODE_ENV=${nodeEnv} VERCEL_ENV=${vercelEnv} COMMIT=${vercelCommit?.slice(0, 7)}`
  );

  if (!expected) {
    console.warn(
      "[sentry-test] SENTRY_TEST_TOKEN not set — returning 404 (endpoint dormant)"
    );
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token || token !== expected) {
    console.warn(
      `[sentry-test] token mismatch — got "${token}" (length ${token?.length ?? 0}), expected length ${expected.length}`
    );
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Dry-run mode: return all diagnostic info as JSON in the response
  // body so the user doesn't need to dig through Vercel logs. Calls
  // captureMessage + flush to test the Sentry side-channel, but does
  // NOT throw — so the response actually delivers to the browser.
  const isDryRun = url.searchParams.get("dryRun") === "1";

  if (isDryRun) {
    const dryStart = Date.now();
    const eventId = Sentry.captureMessage(
      "Sentry dry-run probe (no throw)",
      {
        level: "warning",
        tags: { test: "dry-run", endpoint: "/api/admin/sentry-test" },
      }
    );
    // 8s flush ceiling — Sentry EU region from Vercel US-East needs
    // room for DNS + TLS handshake on cold start (the first event
    // from a fresh function instance can take 3-5s end-to-end).
    const flushed = await Sentry.flush(8000);
    return NextResponse.json({
      mode: "dry-run",
      diagnostics: {
        sentryDsnSet: dsnPresent,
        sentryDsnSuffix: dsnSuffix,
        nodeEnv,
        vercelEnv,
        commit: vercelCommit?.slice(0, 7),
        captureMessageEventId: eventId ?? null,
        flushReturned: flushed,
        flushDurationMs: Date.now() - dryStart,
      },
      hint: flushed
        ? eventId
          ? "SDK is wired. Look for 'Sentry dry-run probe (no throw)' in Sentry Issues. If absent there, the DSN points to a different project."
          : "SDK returned no eventId — Sentry.init was likely a no-op (DSN unset, or enabled:false at init time)."
        : "Sentry.flush() timed out even at 8s — SDK couldn't reach Sentry's ingest. Likely a network issue between Vercel and Sentry's EU region, OR the DSN itself is unreachable.",
    });
  }

  if (!dsnPresent) {
    console.error(
      "[sentry-test] SENTRY_DSN not set — Sentry init was a no-op, captureMessage / throw will silently disappear"
    );
  }

  // Path 1: explicit captureMessage — covers the path the
  // /api/jobs/audit-forward-failed callback uses to alert on
  // exhausted queue retries.
  console.log("[sentry-test] calling Sentry.captureMessage...");
  const messageEventId = Sentry.captureMessage(
    "Sentry test message (manual probe)",
    {
      level: "warning",
      tags: { test: "manual-probe", endpoint: "/api/admin/sentry-test" },
      extra: {
        timestamp: new Date().toISOString(),
        note: "If you can see this in Sentry, the SDK is wired correctly.",
      },
    }
  );
  console.log(
    `[sentry-test] captureMessage returned eventId=${messageEventId ?? "<none>"}`
  );

  // Force Sentry to flush before throw, otherwise the throw could
  // tear down the process before the message reaches Sentry's
  // ingest. 8s ceiling — Sentry EU region from Vercel US-East needs
  // room for DNS + TLS handshake on cold start.
  console.log("[sentry-test] calling Sentry.flush(8000)...");
  const flushed = await Sentry.flush(8000);
  console.log(`[sentry-test] flush returned ${flushed} (true=delivered)`);

  // Path 2: thrown error — covers automatic capture via Next.js
  // instrumentation hooks (the route handler's onRequestError).
  console.log("[sentry-test] throwing test exception now...");
  throw new Error("Sentry test exception (manual probe)");
}
