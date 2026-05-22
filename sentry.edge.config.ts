/**
 * Sentry — edge runtime init.
 *
 * Loaded automatically by @sentry/nextjs for code running on Vercel's
 * Edge runtime (middleware, edge routes). Smaller surface than the
 * Node server config — no profiling SDK, no Node integrations.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    enabled: process.env.NODE_ENV === "production",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
  });
}
