/**
 * Demo subdomain password gate.
 *
 * Anyone hitting demo.rightoffer.in or rightoffer.in/investor must
 * first enter a shared password. Once entered, a marker cookie
 * (`ro-demo-pass = "ok-v1"`) carries the proof of entry for 30 days
 * so investors don't re-enter on every visit.
 *
 * Threat model is "casual gate, not vault" — the demo surfaces carry
 * product walkthroughs and aggregate metrics, not customer PII. The
 * cookie's only job is to suppress the password prompt for someone
 * who already proved they know the password. Anyone determined to
 * bypass can just enter the password (or set the cookie in DevTools,
 * which is also where they could read it). HMAC-signing adds nothing
 * a static marker doesn't already give us at this trust level.
 *
 * Password source: `DEMO_PASSWORD` env var with a sensible default so
 * the gate works without env config — deliberate trade-off for solo-
 * founder simplicity. Set + rotate in Vercel env when needed.
 *
 * Note: this module is imported by middleware (Edge runtime) AND by
 * the auth route handler (Node runtime). Both runtimes have native
 * string + Uint8Array, so the implementation uses only those — no
 * `node:crypto`, no `Buffer`.
 */

/** Constant fingerprint stored as the cookie value after a successful
 *  password entry. Bumping the suffix invalidates all live sessions. */
export const DEMO_COOKIE_NAME = "ro-demo-pass";
export const DEMO_COOKIE_VALUE = "ok-v1";

/** Shared password. Override via env var in Vercel for rotation. */
export function getDemoPassword(): string {
  return process.env.DEMO_PASSWORD || "Envy@123789";
}

/** Returns true iff the cookie value matches the known marker. */
export function verifyDemoCookie(value: string | undefined): boolean {
  return value === DEMO_COOKIE_VALUE;
}

/**
 * Constant-time string compare to dodge timing attacks on the
 * password check. Strings of different lengths fail immediately.
 * Uses XOR-aggregate over codepoints so total work doesn't depend
 * on first-mismatch position.
 */
export function checkPassword(submitted: string): boolean {
  const expected = getDemoPassword();
  if (submitted.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < submitted.length; i++) {
    diff |= submitted.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
