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

export type TokenType = "unsub" | "login" | "session" | "remind";

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

const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Builds a magic-link sign-in URL. 15-minute window — long enough for
 * the customer to find the email and click, short enough to limit
 * blast radius if the inbox is compromised.
 *
 * The token is stateless: anyone with the URL within 15 min can sign
 * in as that email. Not one-shot (would need a KV write to track use),
 * but the short window keeps the practical attack surface tiny —
 * Substack / Linear / Cal.com all ship this trade-off.
 */
export function buildMagicLinkUrl(email: string, origin: string): string {
  const token = signToken({
    t: "login",
    s: email.toLowerCase().trim(),
    e: Date.now() + FIFTEEN_MIN_MS,
  });
  const base = origin.replace(/\/+$/, "");
  return `${base}/me/auth/${token}`;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Magic-link for email-forward audit replies. Different expiry from
 * the standard buildMagicLinkUrl (15 min) — when a customer forwards
 * their policy, they may not check the inbox for the reply email
 * until hours or a day later. 7-day window is the sweet spot: long
 * enough that the link works even when the customer comes back the
 * next morning, short enough to limit blast radius if the inbox is
 * compromised.
 *
 * The `nextPath` is appended as `?next=<encoded>` so the magic-link
 * route deep-links to the specified page after setting the session.
 * Caller is responsible for passing a same-origin path; the route
 * does its own safety check.
 */
export function buildAuditMagicLinkUrl(
  email: string,
  origin: string,
  nextPath: string
): string {
  const token = signToken({
    t: "login",
    s: email.toLowerCase().trim(),
    e: Date.now() + SEVEN_DAYS_MS,
  });
  const base = origin.replace(/\/+$/, "");
  return `${base}/me/auth/${token}?next=${encodeURIComponent(nextPath)}`;
}

/**
 * Magic-link for "Yes, remind me before this expires" — embedded in
 * the audit-reply email body. One click subscribes the customer to
 * the renewal-reminder cron for the given parsedPolicyId.
 *
 * Payload subject packs `email|parsedPolicyId` so the click handler
 * has everything it needs without a session lookup. We use `|` as
 * the separator — neither email nor a UUID contain that character.
 *
 * Long expiry (30 days) — customers sometimes find the audit email
 * weeks later and we'd rather they subscribe late than not at all.
 * Single-use semantics aren't required: a re-click on an already-
 * active subscription is harmlessly idempotent at the API layer.
 */
export function buildRemindMeUrl(
  email: string,
  parsedPolicyId: string,
  origin: string
): string {
  const subject = `${email.toLowerCase().trim()}|${parsedPolicyId}`;
  const token = signToken({
    t: "remind",
    s: subject,
    e: Date.now() + THIRTY_DAYS_MS,
  });
  const base = origin.replace(/\/+$/, "");
  return `${base}/api/reminders/click/${token}`;
}

/** Default session lifetime: 30 days. */
export const SESSION_TTL_MS = THIRTY_DAYS_MS;

/**
 * Mints a session token for the cookie. Same crypto, different `t`
 * claim so a stolen session token can't be repurposed as a login
 * (which would re-trigger account creation flows etc.).
 */
export function signSessionToken(email: string): string {
  return signToken({
    t: "session",
    s: email.toLowerCase().trim(),
    e: Date.now() + SESSION_TTL_MS,
  });
}
