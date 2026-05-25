/**
 * POST /api/demo-auth — validate the demo password + set the gate cookie.
 *
 * Receives a form-encoded submission from /demo-login with two fields:
 *   - password: the shared demo password
 *   - next:     the path to redirect to after successful auth
 *
 * On success: sets `ro-demo-pass` cookie (HMAC-signed, 30-day expiry,
 * httpOnly + secure + SameSite=Lax) and 303-redirects to `next`.
 * On failure: redirects back to /demo-login?next=<...>&error=1 so the
 * form can re-render with an error notice.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  checkPassword,
  DEMO_COOKIE_NAME,
  DEMO_COOKIE_VALUE,
} from "@/lib/demo-auth";

export const runtime = "nodejs";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const submitted = (form.get("password") ?? "").toString();
  const nextRaw = (form.get("next") ?? "/").toString();
  const next = sanitizeNext(nextRaw);

  if (!checkPassword(submitted)) {
    // 303 = "see other" — appropriate for POST → GET redirect after
    // form submission. Browser back-button won't re-submit.
    const failUrl = new URL("/demo-login", request.url);
    failUrl.searchParams.set("next", next);
    failUrl.searchParams.set("error", "1");
    return NextResponse.redirect(failUrl, { status: 303 });
  }

  const okUrl = new URL(next, request.url);
  const res = NextResponse.redirect(okUrl, { status: 303 });
  // Domain scope: .rightoffer.in in production so a password entered
  // on demo.rightoffer.in also unlocks rightoffer.in/investor (same
  // demo surface, two hostnames). On localhost/preview the cookie
  // stays per-host since the apex domain isn't rightoffer.in.
  const isProductionHost = request.headers
    .get("host")
    ?.endsWith("rightoffer.in");
  res.cookies.set({
    name: DEMO_COOKIE_NAME,
    value: DEMO_COOKIE_VALUE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    domain: isProductionHost ? ".rightoffer.in" : undefined,
  });
  return res;
}

function sanitizeNext(raw: string): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  return raw;
}
