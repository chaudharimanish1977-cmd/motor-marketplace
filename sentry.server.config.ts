/**
 * Sentry — server-side init.
 *
 * Loaded automatically by @sentry/nextjs on the Node.js server runtime.
 * Captures errors from API routes, server components, and middleware.
 *
 * No-op when SENTRY_DSN is unset (local dev, early prod). Once the env
 * var lands in Vercel the SDK kicks in with zero code change.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Sample everything in early days; tune down once volume grows.
    tracesSampleRate: 1.0,
    // Profiling adds non-trivial overhead; off by default.
    profilesSampleRate: 0,
    // Don't ship to Sentry from local dev unless explicitly opted in.
    enabled: process.env.NODE_ENV === "production",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    // Tag every event with the deploy SHA when Vercel provides it.
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    // We never want to capture our own LLM prompts or PII (parsed
    // policy contents, customer emails) by accident — keep breadcrumbs
    // strictly to runtime / network noise.
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === "http" && breadcrumb.data) {
        delete breadcrumb.data.request_body;
        delete breadcrumb.data.response_body;
      }
      return breadcrumb;
    },
  });
}
