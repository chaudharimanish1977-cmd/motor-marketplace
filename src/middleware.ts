import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Hostname-based rewrites for marketing + demo subdomains.
 *
 *   pitch.rightoffer.in/         →  /pitch   (the investor deck)
 *   demo.rightoffer.in/          →  /investor (investor walkthrough landing)
 *
 * The DEMO subdomain serves the same production build as rightoffer.in,
 * but the feature-flag helper (isMarketplaceEnabled) checks the request
 * host and force-enables the marketplace UI when host starts with
 * `demo.`. Result: investors get the full marketplace flow on a
 * dedicated URL; public customers on rightoffer.in see Phase 1 only.
 *
 * Anything else on these subdomains (assets, deep paths) falls through
 * to the normal app. The main domain is unaffected — middleware only
 * branches on hostnames starting with `pitch.` or `demo.`.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (host.startsWith("pitch.")) {
    const url = request.nextUrl.clone();
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/pitch";
      return NextResponse.rewrite(url);
    }
  }

  if (host.startsWith("demo.")) {
    const url = request.nextUrl.clone();
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/investor";
      return NextResponse.rewrite(url);
    }
    // Any other path on demo.rightoffer.in passes through. The host
    // header is preserved, which is all the feature-flag helper
    // needs to flip marketplace ON for this subdomain.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
