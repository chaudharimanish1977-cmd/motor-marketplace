/**
 * Anonymous browser session — captures docs uploaded by an
 * unverified visitor so they can resume if they bounce and return
 * within 7 days.
 *
 * Why a third session type? (We already have lib/session.ts for full
 * magic-link verified sessions and lib/upload-session.ts for OTP-
 * verified email + doc scoping.)
 *
 * The Right Offer gate model (locked with user: Model A) is:
 *   1. Customer uploads docs anonymously, sees report up to "what's
 *      missing" section.
 *   2. Gate appears with email + WhatsApp + OTP.
 *   3. OTP verification upgrades to an upload session, then later to
 *      full session via magic link.
 *
 * Between steps (1) and (2), we still need to remember WHICH docs
 * the customer uploaded so:
 *   - They can navigate away (close tab, eat lunch) and resume on
 *     return — the report page still loads their docs.
 *   - When they verify at the gate, the OTP verifier knows which
 *     docs to associate with their email.
 *
 * This cookie carries only doc IDs, no PII. Set on every parse.
 * Cleared when the customer is upgraded to a full or upload session
 * (those sessions hold the same info, scoped or broader).
 *
 * Cookie attributes:
 *   - HttpOnly, Secure (in prod), SameSite=Lax, Path=/, 7-day MaxAge.
 *
 * Cryptographic scheme: HMAC-SHA256 over a tiny JSON payload — same
 * EMAIL_TOKEN_SECRET as the other session helpers so rotation is
 * unified.
 */

import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "ro-anon-session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SECRET_ENV = "EMAIL_TOKEN_SECRET";

interface AnonymousSessionPayload {
  v: 1;
  /** Parsed-policy IDs the customer uploaded in this browser. */
  docs: string[];
  /** Expiry in unix ms. */
  exp: number;
}

export interface AnonymousSession {
  docs: string[];
}

function secret(): string {
  const s = process.env[SECRET_ENV];
  if (!s || s.length < 32) {
    throw new Error(
      `${SECRET_ENV} is not set or is too short (need >= 32 chars)`
    );
  }
  return s;
}

function b64urlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function b64urlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function sign(payload: AnonymousSessionPayload): string {
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = b64urlEncode(
    crypto.createHmac("sha256", secret()).update(body).digest()
  );
  return `${body}.${sig}`;
}

function verify(token: string): AnonymousSessionPayload | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = b64urlEncode(
      crypto.createHmac("sha256", secret()).update(body).digest()
    );
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(
      b64urlDecode(body).toString("utf-8")
    ) as AnonymousSessionPayload;
    if (payload.v !== 1) return null;
    if (!Array.isArray(payload.docs)) return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now())
      return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieAttrs() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(TTL_MS / 1000),
  };
}

export async function setAnonymousSession(docs: string[]): Promise<void> {
  const payload: AnonymousSessionPayload = {
    v: 1,
    docs: Array.from(new Set(docs)),
    exp: Date.now() + TTL_MS,
  };
  const token = sign(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, cookieAttrs());
}

export async function getAnonymousSession(): Promise<AnonymousSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const payload = verify(raw);
  if (!payload) return null;
  return { docs: payload.docs };
}

/**
 * Append a doc ID to the cookie (no-op if missing or already there).
 * Called by /api/parse after each successful parse.
 */
export async function appendDocToAnonymousSession(
  docId: string
): Promise<void> {
  const current = await getAnonymousSession();
  if (current?.docs.includes(docId)) return;
  const next = current ? [...current.docs, docId] : [docId];
  await setAnonymousSession(next);
}

export async function clearAnonymousSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    ...cookieAttrs(),
    maxAge: 0,
  });
}
