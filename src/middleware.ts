import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyDemoCookie, DEMO_COOKIE_NAME } from "@/lib/demo-auth";
import { trackVisitor } from "@/lib/visitor-tracking";

/**
 * Hostname-based routing + demo password gate.
 *
 * Three jobs:
 *
 * 1. pitch.rightoffer.in/ → /pitch (rewrite). The pitch subdomain exists
 *    exclusively to serve the deck.
 *
 * 2. Demo password gate. Anything on `demo.rightoffer.in` plus
 *    `rightoffer.in/investor` requires the shared password cookie
 *    (`ro-demo-pass`, HMAC-signed via lib/demo-auth.ts). Missing or
 *    invalid → redirect to /demo-login?next=<path>. /demo-login itself
 *    and /api/demo-auth are exempt so the gate flow doesn't lock
 *    itself out.
 *
 * 3. demo subdomain passes through with no rewrite (post-auth) — the
 *    host header naturally reaches isMarketplaceEnabled() so the
 *    marketplace flag flips on for these requests.
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  if (host.startsWith("pitch.")) {
    const url = request.nextUrl.clone();
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/pitch";
      return NextResponse.rewrite(url);
    }
  }

  // ── Demo password gate ───────────────────────────────────────────
  // Apply when:
  //   · host is on a demo subdomain (covers all paths)
  //   · OR path starts with /investor on the canonical domain
  const isDemoHost = host.startsWith("demo.");
  const isInvestorPath = pathname.startsWith("/investor");
  const needsGate = isDemoHost || isInvestorPath;

  if (needsGate) {
    // Don't gate the gate itself — would create a redirect loop.
    const isGateBypassed =
      pathname === "/demo-login" ||
      pathname.startsWith("/api/demo-auth");
    if (!isGateBypassed) {
      const cookie = request.cookies.get(DEMO_COOKIE_NAME)?.value;
      if (!verifyDemoCookie(cookie)) {
        const url = request.nextUrl.clone();
        url.pathname = "/demo-login";
        // Preserve where they were trying to go so post-login redirects
        // them there. Encoded by Next's clone() handling.
        const dest = pathname + (request.nextUrl.search || "");
        url.search = `?next=${encodeURIComponent(dest)}`;
        return NextResponse.redirect(url);
      }
    }
  }

  // ── Visitor counting ─────────────────────────────────────────────
  // Track unique-per-day visitors on the canonical production host
  // only. We skip:
  //   · demo / preview subdomains (don't pollute the prod metric)
  //   · /admin/* (the founder hitting the dashboard isn't a "visitor")
  //   · /demo-login (gate page, not real traffic)
  //   · /investor (already gated)
  // The matcher excludes /api/* and static assets so we don't need to
  // re-check those here.
  const response = NextResponse.next();
  const isProdHost = !isDemoHost && !host.startsWith("pitch.");
  const isTrackablePath =
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/demo-login") &&
    !pathname.startsWith("/investor");
  if (isProdHost && isTrackablePath) {
    await trackVisitor(request, response);
  }
  return response;
}

export const config = {
  // Skip the matcher for /api/* (each endpoint has its own auth),
  // _next static assets, favicon, and any file with an extension.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
