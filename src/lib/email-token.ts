/**
 * Stateless, signed tokens for email-borne actions (unsubscribe today;
 * magic-link login later). HMAC-SHA256 over a tiny JSON payload, no KV
 * lookup needed at verify time — the signature alone proves authenticity.
 *
 * Token layout (URL-safe, single path segment):
 *   <base64url(json)>.<base64url(sig)>
 *
 * Payload fields are single-letter to keep URLs short:
 *   t = type ("unsub" | "login")
 *   s = subject id (e.g. RenewalSubscription.id, or email for login)
 *   e = expiry (unix ms — token is rejected after this)
 *   v = schema version (1)
 *
 * Why one shared helper for both purposes?
 *   - Same crypto, same env secret, same audit story.
 *   - Distinct `t` claims prevent cross-use (an unsub token can never log
 *     someone in even if leaked, because verifyToken checks the type).
 */

import crypto from "crypto";

const SECRET_ENV = "EMAIL_TOKEN_SECRET";

export type TokenType = "unsub" | "login";

interface TokenPayload {
  t: TokenType;
  s: string;
  e: number;
  v: 1;
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

export function signToken(
  payload: Omit<TokenPayload, "v">
): string {
  const full: TokenPayload = { ...payload, v: 1 };
  const body = b64urlEncode(JSON.stringify(full));
  const sig = b64urlEncode(
    crypto.createHmac("sha256", secret()).update(body).digest()
  );
  return `${body}.${sig}`;
}

/**
 * Returns the payload if the token is valid (signature matches, not
 * expired, version recognised). Returns null for any failure — callers
 * should treat null as "show the generic 'link expired' page", not
 * leak details to the user.
 */
export function verifyToken(
  token: string,
  expectedType: TokenType
): TokenPayload | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;

    const expected = b64urlEncode(
      crypto.createHmac("sha256", secret()).update(body).digest()
    );
    // Constant-time compare to avoid timing attacks on the HMAC.
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(
      b64urlDecode(body).toString("utf-8")
    ) as TokenPayload;
    if (payload.v !== 1) return null;
    if (payload.t !== expectedType) return null;
    if (typeof payload.s !== "string" || !payload.s) return null;
    if (typeof payload.e !== "number" || payload.e < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------------
// Convenience builders — keep call sites trivial.
// ----------------------------------------------------------------------------

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Builds a fully-qualified unsubscribe URL for the given subscription.
 * One-year expiry — long enough that even a user who opens an old email
 * six months later can still click through. Cron is so cheap that even
 * mass re-issuance on rotation is fine.
 */
export function buildUnsubscribeUrl(
  subscriptionId: string,
  origin: string
): string {
  const token = signToken({
    t: "unsub",
    s: subscriptionId,
    e: Date.now() + ONE_YEAR_MS,
  });
  // Trim trailing slash to keep the URL canonical.
  const base = origin.replace(/\/+$/, "");
  return `${base}/unsubscribe/${token}`;
}
