/**
 * Centralised feature-flag helpers.
 *
 * Phase 1 (audit-only) ships with the marketplace UI gated behind
 * `MARKETPLACE_ENABLED`. Same codebase, two faces: production hides
 * marketplace routes + buttons; preview/dev/demo shows them. When V2
 * is ready, flip the env var on production — no code deploy needed.
 *
 * Why three states (true / false / unset):
 *   - "true"   → enabled (explicit opt-in, e.g. demo.rightoffer.in)
 *   - "false"  → disabled (explicit opt-out, e.g. production today)
 *   - unset    → default-by-environment:
 *                 · VERCEL_ENV=production → disabled
 *                 · everything else       → enabled
 *
 * The unset-default keeps local development friction-free: a developer
 * pulling the repo, running `npm run dev`, sees the full marketplace
 * flow without having to remember to set an env var. Production stays
 * safe because Vercel auto-sets VERCEL_ENV=production for the prod
 * deployment, so the default reads correctly there too.
 *
 * Server- and client-safe (does not read user data, no Next.js APIs).
 * Both server components and `"use client"` files can call this.
 */

export async function isMarketplaceEnabled(): Promise<boolean> {
  // Override 1: explicit env var (highest priority). Tests + scripted
  // demos can force a deterministic answer regardless of host or
  // environment.
  const explicit = process.env.MARKETPLACE_ENABLED;
  if (explicit === "true") return true;
  if (explicit === "false") return false;

  // Override 2: demo subdomain. Investor-facing previews are served on
  // demo.rightoffer.in — marketplace UI MUST be visible there even
  // though the underlying deploy is the same production build serving
  // rightoffer.in (where marketplace stays hidden). Host-based gate
  // lets us share one deploy across both audiences.
  try {
    // Dynamic import keeps this file usable from contexts where
    // next/headers isn't available (e.g. unit tests).
    const { headers } = await import("next/headers");
    const hdrs = await headers();
    const host = hdrs.get("host") ?? "";
    if (host.startsWith("demo.")) return true;
  } catch {
    // headers() throws outside a request scope (build-time prerender,
    // unit test, etc.). Fall through to env-based default.
  }

  // Unset → default-by-environment.
  // VERCEL_ENV is "production" only on the production deployment;
  // "preview" on preview deploys; undefined locally.
  return process.env.NEXT_PUBLIC_VERCEL_ENV !== "production" &&
    process.env.VERCEL_ENV !== "production";
}

/**
 * Client-side mirror of the same logic. Next.js inlines NEXT_PUBLIC_*
 * env vars into the client bundle at build time — so client-side
 * callers see the same flag value the server would.
 *
 * Use this from "use client" components when conditionally rendering
 * marketplace UI. Server components can call isMarketplaceEnabled()
 * directly.
 */
export function isMarketplaceEnabledClient(): boolean {
  const explicit = process.env.NEXT_PUBLIC_MARKETPLACE_ENABLED;
  if (explicit === "true") return true;
  if (explicit === "false") return false;

  // Demo subdomain override — mirrors the server-side host check.
  // SSR-safe: typeof window check protects against running on the
  // server pass of an isomorphic component.
  if (typeof window !== "undefined") {
    if (window.location.hostname.startsWith("demo.")) return true;
  }

  return process.env.NEXT_PUBLIC_VERCEL_ENV !== "production";
}

/**
 * True ONLY on the canonical production deployment (rightoffer.in).
 * Returns false on Vercel preview URLs, demo.rightoffer.in, local dev.
 *
 * Used by robots.ts + sitemap.ts to gate indexability — we only want
 * Google crawling the production domain. Demo + preview deployments
 * must be uncrawlable so they don't pollute the search index with
 * marketplace-visible content or stale preview-URL content.
 */
export function isProductionEnvironment(): boolean {
  return process.env.VERCEL_ENV === "production";
}
