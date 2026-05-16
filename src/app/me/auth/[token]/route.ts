import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/email-token";
import { setSession } from "@/lib/session";
import { clearUploadSession } from "@/lib/upload-session";
import { clearAnonymousSession } from "@/lib/anonymous-session";

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
  // The upload-session cookie (typed-but-unverified) is redundant
  // once we have a full magic-link session — clear it so /me reads
  // the broader full-session, not the narrower upload-scoped one.
  await clearUploadSession();
  // Anonymous-session is also redundant — the full session reads
  // the customer's docs by owner.email, scoped wider than the
  // browser-bound anonymous cookie. Leaving it stale would surface
  // it in /reports later as confusion.
  await clearAnonymousSession();
  return NextResponse.redirect(new URL("/me", request.url));
}
