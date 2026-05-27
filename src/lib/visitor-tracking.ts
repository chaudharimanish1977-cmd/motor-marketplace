/**
 * Lightweight unique-visitor counter for /admin/dashboard.
 *
 * Why hand-rolled and not PostHog: we want a single number on the
 * dashboard today, without a third-party script tag, and the H1
 * analytics task is still pending. This keeps everything inside KV
 * and edge-safe (used from middleware).
 *
 * Counting model:
 *   · `visitors:day:<YYYY-MM-DD>` — INCR'd once per browser per IST
 *     day. Cookie carries the visitor id + last-counted IST date so
 *     repeat visits the same day don't double-count.
 *   · `visitors:unique` — INCR'd only when the cookie was completely
 *     absent (i.e., genuinely-new browser).
 *
 *   Per-day counters expire in 60 days to bound the keyspace; the
 *   `unique` counter is permanent.
 *
 * The middleware calls trackVisitor() inline. KV failures are
 * swallowed — analytics must never break the page.
 */

import { kv } from "@vercel/kv";
import type { NextRequest, NextResponse } from "next/server";

export const VISITOR_COOKIE = "ro-visitor";
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 365; // 1 year
const DAY_TTL_S = 60 * 60 * 24 * 60; // 60 days

/** Returns `YYYY-MM-DD` in IST. Keeps day-buckets aligned with the rest
 *  of the dashboard, which uses IST throughout. */
export function todayIst(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Track a unique-per-day visitor. Mutates the response cookies.
 *
 * Logic:
 *   - No cookie     → set cookie, INCR day, INCR unique
 *   - Cookie, stale → set cookie (new date), INCR day
 *   - Cookie, today → no-op
 *
 * `await`-ed in middleware. The KV calls are cheap (~50ms) and only
 * happen on first-of-day per browser, not every page load.
 */
export async function trackVisitor(
  request: NextRequest,
  response: NextResponse
): Promise<void> {
  try {
    const today = todayIst();
    const raw = request.cookies.get(VISITOR_COOKIE)?.value ?? "";
    const [visitorId, lastDate] = raw.split(":");
    const isFresh = !visitorId;
    const needsCountToday = isFresh || lastDate !== today;

    if (!needsCountToday) return;

    const newId = visitorId || crypto.randomUUID();
    response.cookies.set({
      name: VISITOR_COOKIE,
      value: `${newId}:${today}`,
      path: "/",
      maxAge: COOKIE_MAX_AGE_S,
      sameSite: "lax",
      httpOnly: false,
      // No Domain= so the cookie scopes to the exact host that issued
      // it (rightoffer.in stays separate from demo.rightoffer.in,
      // which is what we want for keeping the prod metric clean).
    });

    const writes: Promise<unknown>[] = [
      kv.incr(`visitors:day:${today}`),
      kv.expire(`visitors:day:${today}`, DAY_TTL_S),
    ];
    if (isFresh) {
      writes.push(kv.incr(`visitors:unique`));
    }
    await Promise.all(writes);
  } catch {
    // analytics must never break the page
  }
}

/** Per-day count for the last `n` IST days, oldest first. */
function lastNDays(n: number): string[] {
  const out: string[] = [];
  // Walk back from "today in IST" — using Intl on shifted Date objects
  // to stay timezone-correct across DST etc.
  const todayMs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(todayMs - i * dayMs);
    const iso = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    out.push(iso);
  }
  return out;
}

export interface VisitorMetrics {
  /** All-time unique browsers that have ever loaded a page. */
  totalUnique: number;
  /** Unique browsers that loaded a page today (IST). */
  uniqueToday: number;
  /** Sum of daily uniques across the last 7 IST days. */
  uniqueLast7d: number;
  /** Sum of daily uniques across the last 30 IST days. */
  uniqueLast30d: number;
  /** Per-day series for the sparkbar — oldest → newest. */
  perDay30d: Array<{ date: string; count: number }>;
}

/** Read visitor metrics from KV. Returns zeros if no data yet. */
export async function readVisitorMetrics(): Promise<VisitorMetrics> {
  const days = lastNDays(30);
  const dayKeys = days.map((d) => `visitors:day:${d}`);

  const [totalUnique, ...perDayValues] = await Promise.all([
    kv.get<number>("visitors:unique"),
    ...dayKeys.map((k) => kv.get<number>(k)),
  ]);

  const perDay30d = days.map((date, i) => ({
    date,
    count: perDayValues[i] ?? 0,
  }));
  const uniqueLast7d = perDay30d.slice(-7).reduce((a, b) => a + b.count, 0);
  const uniqueLast30d = perDay30d.reduce((a, b) => a + b.count, 0);
  const uniqueToday = perDay30d[perDay30d.length - 1]?.count ?? 0;

  return {
    totalUnique: totalUnique ?? 0,
    uniqueToday,
    uniqueLast7d,
    uniqueLast30d,
    perDay30d,
  };
}
