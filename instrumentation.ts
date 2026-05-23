/**
 * Next.js instrumentation hook — loads runtime-specific config.
 *
 * Required by @sentry/nextjs for App Router. The runtime check ensures
 * we load the right config (Node server vs edge) and don't pay the
 * cost of loading server-side init code in the edge runtime.
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  console.log(
    `[instrumentation] register() called — NEXT_RUNTIME=${process.env.NEXT_RUNTIME}`
  );
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[instrumentation] loading sentry.server.config...");
    await import("./sentry.server.config");
    console.log("[instrumentation] sentry.server.config loaded");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    console.log("[instrumentation] loading sentry.edge.config...");
    await import("./sentry.edge.config");
    console.log("[instrumentation] sentry.edge.config loaded");
  }
}

// Re-export Sentry's request error capture so Next.js calls it on
// server-side render / route handler exceptions.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
