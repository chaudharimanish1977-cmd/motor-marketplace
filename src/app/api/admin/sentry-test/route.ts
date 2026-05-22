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
  const expected = process.env.SENTRY_TEST_TOKEN;
  if (!expected) {
    // Endpoint deactivated. Return a 404-shaped response so it doesn't
    // advertise its presence to scanners.
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token || token !== expected) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Path 1: explicit captureMessage — covers the path the
  // /api/jobs/audit-forward-failed callback uses to alert on
  // exhausted queue retries.
  Sentry.captureMessage("Sentry test message (manual probe)", {
    level: "warning",
    tags: { test: "manual-probe", endpoint: "/api/admin/sentry-test" },
    extra: {
      timestamp: new Date().toISOString(),
      note: "If you can see this in Sentry, the SDK is wired correctly.",
    },
  });

  // Force Sentry to flush before throw, otherwise the throw could
  // tear down the process before the message reaches Sentry's
  // ingest. 2s ceiling keeps the request from hanging if Sentry's
  // network is slow.
  await Sentry.flush(2000);

  // Path 2: thrown error — covers automatic capture via Next.js
  // instrumentation hooks (the route handler's onRequestError).
  throw new Error("Sentry test exception (manual probe)");
}
