/**
 * Upload session — a SCOPED browser-session cookie distinct from the
 * full magic-link session.
 *
 * Why two session types:
 *   - Full session (lib/session.ts) = customer clicked a magic link
 *     from their email. Verified identity, 30 days, grants /me and
 *     PDF downloads and everything portal-side.
 *   - Upload session (this file) = customer typed an email on
 *     /upload but hasn't verified yet. Narrowly scoped to the
 *     specific docs they uploaded in THIS browser, 24h TTL. Lets
 *     them keep using the comparator + view-report in the same
 *     session without waiting for a magic-link click, but does NOT
 *     expose their full /me history (impersonation risk if it did).
 *
 * Scoping: the cookie payload includes the exact list of parsed-
 * policy IDs the customer uploaded after submitting their email.
 * Every protected route checks that the requested doc/comparison
 * is in this list. Cross-doc access requires the full session.
 *
 * Cookie attributes:
 *   - HttpOnly, Secure (in prod), SameSite=Lax, Path=/, 24h MaxAge.
 *
 * Cryptographic scheme: HMAC-SHA256 over a tiny JSON payload —
 * same shape as lib/email-token.ts but with a richer payload
 * (we need to carry the doc-ID list), so we use a dedicated
 * sign/verify here rather than shoehorning into signToken.
 * Same EMAIL_TOKEN_SECRET for rotation simplicity.
 */

import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "ro-upload-session";
const TTL_MS = 24 * 60 * 60 * 1000;
const SECRET_ENV = "EMAIL_TOKEN_SECRET";

interface UploadSessionPayload {
  /** Schema version. */
  v: 1;
  /** Lowercased, trimmed email the customer typed at /upload. NOT verified. */
  email: string;
  /** Optional WhatsApp number captured at /upload — stored for later use
   *  when WhatsApp Business API is wired. Today it's just persisted. */
  whatsapp?: string;
  /** Parsed-policy IDs the customer uploaded in this browser session.
   *  Used by /me, /comparison, etc. to scope what's accessible without
   *  the full magic-link verification. */
  docs: string[];
  /** Expiry in unix ms. */
  exp: number;
}

export interface UploadSession {
  email: string;
  whatsapp?: string;
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

function sign(payload: UploadSessionPayload): string {
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = b64urlEncode(
    crypto.createHmac("sha256", secret()).update(body).digest()
  );
  return `${body}.${sig}`;
}

function verify(token: string): UploadSessionPayload | null {
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
    ) as UploadSessionPayload;
    if (payload.v !== 1) return null;
    if (!payload.email || typeof payload.email !== "string") return null;
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

/**
 * Set or overwrite the upload-session cookie with the given email +
 * doc list. Idempotent — call freely after each new doc parse to keep
 * the cookie in sync.
 */
export async function setUploadSession(
  email: string,
  docs: string[],
  whatsapp?: string
): Promise<void> {
  const payload: UploadSessionPayload = {
    v: 1,
    email: email.toLowerCase().trim(),
    whatsapp: whatsapp?.trim() || undefined,
    docs: Array.from(new Set(docs)),
    exp: Date.now() + TTL_MS,
  };
  const token = sign(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, cookieAttrs());
}

/**
 * Read the current upload session if any. Returns null when missing,
 * tampered, or expired — caller should treat null as "not present"
 * and not leak details.
 */
export async function getUploadSession(): Promise<UploadSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const payload = verify(raw);
  if (!payload) return null;
  return {
    email: payload.email,
    whatsapp: payload.whatsapp,
    docs: payload.docs,
  };
}

/**
 * Append a doc ID to the existing upload session (no-op if no session,
 * or if the doc is already in the list). Used by /api/parse after a
 * successful parse so subsequent comparator runs know about the doc.
 */
export async function appendDocToUploadSession(docId: string): Promise<void> {
  const current = await getUploadSession();
  if (!current) return;
  if (current.docs.includes(docId)) return;
  await setUploadSession(
    current.email,
    [...current.docs, docId],
    current.whatsapp
  );
}

/**
 * Clear the upload session. Called when a customer signs in via the
 * full magic-link flow — at that point the broader session takes over
 * and the upload session is redundant.
 */
export async function clearUploadSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    ...cookieAttrs(),
    maxAge: 0,
  });
}
