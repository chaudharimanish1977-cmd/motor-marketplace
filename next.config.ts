import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // pdf-parse, puppeteer-core + @sparticuz/chromium use Node native modules
  // / native binaries — keep them external from the bundler so Vercel can
  // load them at runtime instead of trying to inline a Chromium build.
  serverExternalPackages: [
    "pdf-parse",
    "puppeteer",
    "puppeteer-core",
    "@sparticuz/chromium",
  ],

  // Strict mode for better React 19 / future-proofing
  reactStrictMode: true,
};

// Wrap with Sentry's Next.js plugin. Source-map upload + auto-instrumentation
// only activate when SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT are set
// in the build environment. Until those land in Vercel, the wrap is a no-op.
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  // Tunnel events through /monitoring to dodge ad-blockers.
  tunnelRoute: "/monitoring",
  // Don't fail the build when Sentry CLI is missing creds (local dev,
  // early prod) — log + continue.
  errorHandler: (err) => {
    console.warn("[sentry] build-time integration warning (non-fatal):", err);
  },
  disableLogger: true,
});
