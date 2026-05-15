/**
 * Server-side session cookie helpers.
 *
 * The cookie holds a signed session token (HMAC over { t: "session",
 * s: email, e: expiry }). No server-side session table — verification
 * is purely cryptographic, which keeps the portal cheap to scale and
 * lets us sign-out by simply clearing the cookie.
 *
 * Cookie attributes:
 *   - HttpOnly: JS can't read it (XSS-resistant).
 *   - Secure:   only sent over HTTPS in production.
 *   - SameSite=Lax: prevents CSRF on POST, allows top-level GET from
 *                   email magic-links to set the cookie.
 *   - Path=/:   available to every route.
 *   - MaxAge=30d: matches the token's HMAC expiry.
 *
 * If the cookie is missing, expired, or tampered with, getSession()
 * returns null and the caller is expected to redirect to /me/login.
 */

import { cookies } from "next/headers";
import { signSessionToken, verifyToken, SESSION_TTL_MS } from "@/lib/email-token";

const COOKIE_NAME = "ro-session";

export async function setSession(email: string): Promise<void> {
  const token = signSessionToken(email);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Reads the session cookie. Returns the signed-in email (lowercased,
 * trimmed) if a valid session exists, otherwise null. Treat null as
 * "not signed in" — never block on it without redirecting the user.
 */
export async function getSession(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const payload = verifyToken(raw, "session");
  if (!payload) return null;
  return payload.s;
}
