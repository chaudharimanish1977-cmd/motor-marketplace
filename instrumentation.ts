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
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Re-export Sentry's request error capture so Next.js calls it on
// server-side render / route handler exceptions.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
