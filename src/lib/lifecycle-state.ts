/**
 * Lifecycle-state computation — the policy / customer's position in the
 * insurance lifecycle drives which upload-page flow they get and which
 * 5-act journey content lands.
 *
 * Four states, computed from the policy's start / end dates against
 * today (in IST). Priority order: D > A > C > B.
 *
 *   D · Lapsed       — policy has already expired (today > endDate)
 *   A · Renewal      — endDate is within 60 days (quote-market open)
 *   C · Just-bought  — startDate is within last 30 days
 *   B · Mid-cycle    — active policy that's neither A nor C
 *                      (default fallback when dates are missing too)
 *
 * Pure function — no IO, no side effects. Easy to test, easy to memo.
 */

/** The four customer lifecycle states. */
export type LifecycleState = "A" | "B" | "C" | "D";

/** Result of state computation — state + the underlying day deltas. */
export interface LifecycleResult {
  state: LifecycleState;
  /** Positive = days until expiry. Negative = days since expiry.
   *  null when endDate is missing / unparseable. */
  daysUntilExpiry: number | null;
  /** Days since the policy started. null when startDate is missing. */
  daysSinceStart: number | null;
  /** Reason for the state assignment — useful for debugging / display. */
  reason: string;
}

/** State-A window: policy expires within this many days (inclusive). */
export const STATE_A_DAYS = 60;
/** State-C window: policy started within this many days ago (inclusive). */
export const STATE_C_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Round a Date down to the start of its IST day. We compute state in
 * IST because all customers + insurers operate in IST and we want
 * boundary days (e.g. "exactly 60 days to expiry") to be unambiguous.
 */
function toISTDayStart(date: Date): Date {
  // Shift to IST, zero the time, shift back to absolute ms.
  const istMs = date.getTime() + IST_OFFSET_MS;
  const istDayMs = Math.floor(istMs / MS_PER_DAY) * MS_PER_DAY;
  return new Date(istDayMs - IST_OFFSET_MS);
}

function safeParse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / MS_PER_DAY);
}

/**
 * Minimum input shape required to compute state. Callers can pass the
 * full ParsedPolicy (its policyPeriod fields will be picked up) or any
 * subset of date strings. ISO-8601 / `Date()`-parseable formats only.
 */
export interface PolicyDates {
  startDate?: string | null;
  endDate?: string | null;
}

/**
 * Compute the customer's current lifecycle state. Pure, deterministic.
 *
 * @param policy - object with optional `startDate` / `endDate` ISO strings
 * @param now    - Date to compute state against. Defaults to `new Date()`.
 *                 Inject during tests for determinism.
 */
export function computeLifecycleState(
  policy: PolicyDates,
  now: Date = new Date()
): LifecycleResult {
  const today = toISTDayStart(now);
  const start = safeParse(policy.startDate ?? null);
  const end = safeParse(policy.endDate ?? null);

  const startDay = start ? toISTDayStart(start) : null;
  const endDay = end ? toISTDayStart(end) : null;

  const daysUntilExpiry = endDay ? daysBetween(endDay, today) : null;
  const daysSinceStart = startDay ? daysBetween(today, startDay) : null;

  // Priority: D > A > C > B.
  if (daysUntilExpiry !== null && daysUntilExpiry < 0) {
    return {
      state: "D",
      daysUntilExpiry,
      daysSinceStart,
      reason: `Policy expired ${Math.abs(daysUntilExpiry)} day(s) ago`,
    };
  }
  if (daysUntilExpiry !== null && daysUntilExpiry <= STATE_A_DAYS) {
    return {
      state: "A",
      daysUntilExpiry,
      daysSinceStart,
      reason: `Renewal in ${daysUntilExpiry} day(s) — within ${STATE_A_DAYS}-day window`,
    };
  }
  if (
    daysSinceStart !== null &&
    daysSinceStart >= 0 &&
    daysSinceStart <= STATE_C_DAYS
  ) {
    return {
      state: "C",
      daysUntilExpiry,
      daysSinceStart,
      reason: `Policy started ${daysSinceStart} day(s) ago — within ${STATE_C_DAYS}-day window`,
    };
  }
  return {
    state: "B",
    daysUntilExpiry,
    daysSinceStart,
    reason:
      daysUntilExpiry === null
        ? "Expiry date unknown — defaulting to mid-cycle"
        : `Active policy with ${daysUntilExpiry} day(s) until renewal`,
  };
}

/**
 * Human-readable label per state. Used in admin / debug surfaces;
 * customer-facing copy lives in journey-copy.ts.
 */
export const STATE_LABELS: Record<LifecycleState, string> = {
  A: "Renewal-Active",
  B: "Mid-cycle",
  C: "Just-bought",
  D: "Lapsed",
};
