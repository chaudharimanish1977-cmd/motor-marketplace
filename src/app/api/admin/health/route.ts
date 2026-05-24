/**
 * Admin health endpoint — daily glance dashboard for the founder.
 *
 * Returns a JSON snapshot of key KPIs so the founder can gut-check the
 * product state in 5 seconds without opening Vercel / Sentry / KV:
 *   · How many parsed policies + reports + users in total
 *   · How many were created in the last 24h
 *   · How many active renewal subscriptions exist
 *   · How many reminders fired in the last 24h
 *   · Pointer to Sentry dashboard for actual errors
 *
 * Gated by founder email match. Anyone else hitting this gets a 404
 * (not 401 — we don't advertise the endpoint exists to non-founders).
 *
 * Lightweight by design — reads four tables in parallel, ~one round
 * trip to Upstash. No LLM calls, no heavy computation. Safe to refresh
 * frequently.
 */

import { NextResponse } from "next/server";
import { readTable, Tables } from "@/lib/db";
import { getSession } from "@/lib/session";
import type {
  ParsedPolicy,
  PolicyReport,
  RenewalSubscription,
  User,
} from "@/lib/types";

const FOUNDER_EMAIL = "chaudharimanish1977@gmail.com";

export const runtime = "nodejs";
// Tight maxDuration — this endpoint is cheap. If it ever times out
// at 10s it's a KV problem worth surfacing as a 500.
export const maxDuration = 10;

export async function GET() {
  const session = await getSession();
  if (!session || session.toLowerCase() !== FOUNDER_EMAIL) {
    // Mimic the not-found shape so the endpoint stays invisible to
    // non-founders. Same 404 a deleted resource would return.
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const now = Date.now();
  const oneDayAgoMs = now - 24 * 60 * 60 * 1000;
  const todayUtcIso = new Date(now).toISOString().slice(0, 10); // YYYY-MM-DD

  const [users, policies, reports, subscriptions] = await Promise.all([
    readTable<User>(Tables.USERS),
    readTable<ParsedPolicy>(Tables.PARSED_POLICIES),
    readTable<PolicyReport>(Tables.REPORTS),
    readTable<RenewalSubscription>(Tables.RENEWAL_SUBSCRIPTIONS),
  ]);

  // ParsedPolicy.uploadedAt is the ISO timestamp the row was created.
  // We classify "today" as a UTC-date prefix match (good enough for an
  // IST-based founder dashboard; off-by-hour at midnight is acceptable
  // for this rough-glance metric).
  const policiesParsedToday = policies.filter((p) =>
    (p.uploadedAt ?? "").startsWith(todayUtcIso)
  ).length;
  const policiesParsedLast24h = policies.filter((p) => {
    const t = Date.parse(p.uploadedAt ?? "");
    return Number.isFinite(t) && t >= oneDayAgoMs;
  }).length;

  // Active subs = customers we're still tracking renewal cadence on.
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === "active"
  ).length;
  const unsubscribed = subscriptions.filter(
    (s) => s.status === "unsubscribed"
  ).length;

  // lastNudgedAt is set by the cron whenever it fires a reminder.
  // Count of subs whose last nudge fell within the last 24h.
  const remindersSentLast24h = subscriptions.filter((s) => {
    if (!s.lastNudgedAt) return false;
    const t = Date.parse(s.lastNudgedAt);
    return Number.isFinite(t) && t >= oneDayAgoMs;
  }).length;

  // Recent users — proxy for sign-up rate.
  const usersCreatedLast24h = users.filter((u) => {
    const t = Date.parse(u.createdAt ?? "");
    return Number.isFinite(t) && t >= oneDayAgoMs;
  }).length;

  return NextResponse.json({
    generatedAt: new Date(now).toISOString(),
    totals: {
      users: users.length,
      parsedPolicies: policies.length,
      reports: reports.length,
      subscriptions: {
        active: activeSubscriptions,
        unsubscribed,
        total: subscriptions.length,
      },
    },
    last24h: {
      newUsers: usersCreatedLast24h,
      policiesParsed: policiesParsedLast24h,
      remindersSent: remindersSentLast24h,
    },
    today: {
      policiesParsed: policiesParsedToday,
    },
    errorMonitoring: {
      sentryIssues: "https://rightoffer.sentry.io/issues/",
      note: "Open Sentry for actual error stream — this endpoint only counts the success path.",
    },
  });
}
