/**
 * Next.js instrumentation hook — loads runtime-specific config.
 *
 * Required by @sentry/nextjs for App Router. The runtime check ensures
 * we load the right config (Node server vs edge) and don't pay the
 * cost of loading server-side init code in the edge runtime.
 *
 * Location matters: when the project uses a src/ directory layout,
 * Next.js looks for instrumentation.ts at `src/instrumentation.ts` —
 * NOT at the project root. Placing it at the root in a src/-layout
 * project means Next.js never picks it up, register() never fires,
 * and Sentry.init never runs (silently). See:
 * https://nextjs.org/docs/app/guides/instrumentation
 *
 * Sentry's own config files (sentry.server.config.ts /
 * sentry.edge.config.ts) stay at the project root per Sentry's
 * convention; we reach them via the parent-relative `../` import.
 */

export async function register() {
  console.log(
    `[instrumentation] register() called — NEXT_RUNTIME=${process.env.NEXT_RUNTIME}`
  );
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[instrumentation] loading sentry.server.config...");
    await import("../sentry.server.config");
    console.log("[instrumentation] sentry.server.config loaded");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    console.log("[instrumentation] loading sentry.edge.config...");
    await import("../sentry.edge.config");
    console.log("[instrumentation] sentry.edge.config loaded");
  }
}

// Re-export Sentry's request error capture so Next.js calls it on
// server-side render / route handler exceptions.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
