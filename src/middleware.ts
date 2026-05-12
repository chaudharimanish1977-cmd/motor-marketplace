import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Hostname-based rewrite for the dedicated pitch subdomain.
 *
 *   pitch.rightoffer.in/        →  /pitch  (the investor deck)
 *
 * Anything else on that subdomain (assets, deep paths) falls through to the
 * normal app; in practice nothing else lives there. The main domain is
 * unaffected — middleware only branches on hostnames starting with `pitch.`.
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
