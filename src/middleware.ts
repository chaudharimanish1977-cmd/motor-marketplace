import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Hostname-based rewrites for marketing subdomains.
 *
 *   pitch.rightoffer.in/         →  /pitch   (the investor deck)
 *
 * The DEMO subdomain (demo.rightoffer.in) serves the same production
 * build as rightoffer.in, with the marketplace feature-flag flipped
 * ON via host detection in `isMarketplaceEnabled` (lib/feature-flags.ts).
 * It does NOT rewrite the root URL — `demo.rightoffer.in/` serves the
 * same editorial home page as `rightoffer.in/` for visual consistency.
 * The personas walkthrough remains accessible at `demo.rightoffer.in/investor`
 * for anyone navigating there directly.
 *
 * The pitch subdomain rewrites `/` → `/pitch` because that subdomain
 * exists exclusively to serve the deck — there's no other "home" to land on.
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

  // demo.rightoffer.in passes through with no rewrite — the host header
  // is naturally preserved, which is all isMarketplaceEnabled() needs
  // to flip the marketplace flag ON for this subdomain.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
