import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/email-token";
import { setSession } from "@/lib/session";

export const runtime = "nodejs";

/**
 * Magic-link consumer. Implemented as a Route Handler (not a Server
 * Component page) because Next.js 15 only allows cookie writes from
 * Route Handlers and Server Actions — calling cookies().set() from a
 * server-rendered page throws at runtime.
 *
 * Flow:
 *   - Valid token  -> set session cookie, 302 to /me.
 *   - Bad/expired  -> 302 to /me/login?expired=1, which renders the
 *                     "link expired" notice inline above the form.
 *
 * No HTML rendered here — failure UX lives on the login page so the
 * user has a single place to recover (request a new link, then sign
 * in) without bouncing between routes.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const payload = verifyToken(token, "login");

  if (!payload) {
    return NextResponse.redirect(
      new URL("/me/login?expired=1", request.url)
    );
  }

  await setSession(payload.s);
  return NextResponse.redirect(new URL("/me", request.url));
}
