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
 *   - Valid token  -> set session cookie, 302 to `next` (default /me).
 *   - Bad/expired  -> 302 to /me/login?expired=1, which renders the
 *                     "link expired" notice inline above the form.
 *
 * The `next` query param lets callers deep-link to a specific page
 * after sign-in (e.g. an audit reply email links straight to the
 * report). For safety, `next` is restricted to same-origin paths
 * starting with `/` — external URLs are dropped, defaulting to /me.
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

  // Honour ?next=<path> when it's a safe same-origin path. Anything
  // else gets dropped silently — open-redirect protection.
  const nextParam = request.nextUrl.searchParams.get("next");
  const safeNext = isSafeRedirectPath(nextParam) ? nextParam! : "/me";

  return NextResponse.redirect(new URL(safeNext, request.url));
}

/** Allow only relative same-origin paths starting with a single "/"
 *  and not "//" (which would resolve to an external host in some
 *  parsers). Rejects schemes, query-only values, and protocol-
 *  relative URLs. Conservative on purpose. */
function isSafeRedirectPath(path: string | null): boolean {
  if (!path) return false;
  if (path.length > 200) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("\\")) return false;
  return true;
}
