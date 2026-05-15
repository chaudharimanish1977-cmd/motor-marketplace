import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findById, readTable, updateById, Tables } from "@/lib/db";
import { getSession } from "@/lib/session";
import { policyGroupKey } from "@/lib/policy-group";
import type { ParsedPolicy, RenewalSubscription } from "@/lib/types";

export const runtime = "nodejs";

// Schedule sanity bounds. Customer can pick any subset of [1..180]
// days-before, with 1-10 items. Anything beyond 180 means we'd be
// trying to remind them more than 6 months before renewal, which is
// pointless. Capping at 10 items keeps the email cadence sane.
const Schema = z
  .object({
    status: z.enum(["active", "unsubscribed"]).optional(),
    daysBefore: z
      .array(z.number().int().min(1).max(180))
      .min(1)
      .max(10)
      .optional(),
    channels: z
      .array(z.enum(["email", "whatsapp"]))
      .min(1)
      .max(2)
      .optional(),
  })
  .refine(
    (v) =>
      v.status !== undefined ||
      v.daysBefore !== undefined ||
      v.channels !== undefined,
    { message: "Provide status, daysBefore, or channels" }
  );

/**
 * Update a subscription's reminder controls (status and/or daysBefore),
 * cascading every change to all sibling subscriptions that point at
 * the same physical car-period.
 *
 * Why cascade: a customer who uploaded the same PDF multiple times
 * has one row in /me but many subscription rows underneath. Without
 * cascading, "Pause" or a schedule edit would silence/change the one
 * we display while the cron still fires emails from the orphans using
 * their old settings.
 *
 * Resume side-effect: clearing `unsubscribedAt` + resetting
 * `nudgesFired` to [] across the group so the cron rehydrates the
 * next-due checkpoint instead of treating it as already fired.
 *
 * Schedule-edit side-effect: `nudgesFired` is preserved — if the user
 * already received the 60d nudge and adds a new 90d checkpoint that's
 * in the past, the cron's `cp >= daysUntilExpiry` filter still
 * prevents a re-fire. The fired list is only reset when the user
 * EXPLICITLY resumes from a paused state.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const sessionEmail = await getSession();
  if (!sessionEmail) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const target = sessionEmail.toLowerCase();

  const { id } = await context.params;
  let body: z.infer<typeof Schema>;
  try {
    const parsed = await request.json();
    body = Schema.parse(parsed);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const named = await findById<RenewalSubscription>(
    Tables.RENEWAL_SUBSCRIPTIONS,
    id
  );
  if (!named) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if ((named.customerEmail ?? "").toLowerCase() !== target) {
    // 404 (not 403) so cross-account probing can't enumerate IDs.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patch = buildPatch(body);

  // Resolve the named sub's policy group, then apply the patch to
  // every sibling subscription belonging to this email in that group.
  const namedPolicy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    named.parsedPolicyId
  );
  if (!namedPolicy) {
    const updated = await updateById<RenewalSubscription>(
      Tables.RENEWAL_SUBSCRIPTIONS,
      id,
      patch
    );
    return NextResponse.json({
      ok: true,
      status: updated?.status ?? named.status,
      cascadedCount: 0,
    });
  }
  const targetGroupKey = policyGroupKey(namedPolicy);

  const [allPolicies, allSubs] = await Promise.all([
    readTable<ParsedPolicy>(Tables.PARSED_POLICIES),
    readTable<RenewalSubscription>(Tables.RENEWAL_SUBSCRIPTIONS),
  ]);
  const policyById = new Map(allPolicies.map((p) => [p.id, p]));

  const siblings = allSubs.filter((s) => {
    if ((s.customerEmail ?? "").toLowerCase() !== target) return false;
    const p = policyById.get(s.parsedPolicyId);
    if (!p) return false;
    return policyGroupKey(p) === targetGroupKey;
  });

  for (const s of siblings) {
    await updateById<RenewalSubscription>(
      Tables.RENEWAL_SUBSCRIPTIONS,
      s.id,
      patch
    );
  }

  return NextResponse.json({
    ok: true,
    status: patch.status ?? named.status,
    daysBefore: patch.daysBefore ?? named.daysBefore,
    cascadedCount: siblings.length,
  });
}

function buildPatch(
  body: z.infer<typeof Schema>
): Partial<RenewalSubscription> {
  const patch: Partial<RenewalSubscription> = {};

  if (body.status === "unsubscribed") {
    patch.status = "unsubscribed";
    patch.unsubscribedAt = new Date().toISOString();
  } else if (body.status === "active") {
    patch.status = "active";
    patch.unsubscribedAt = undefined;
    // Resume only: reset nudgesFired so the cron can re-evaluate the
    // schedule from scratch. Schedule-only edits don't touch this.
    patch.nudgesFired = [];
  }

  if (body.daysBefore !== undefined) {
    // Normalise: dedupe + sort descending so the earliest reminder
    // fires first chronologically (matches /api/reminders/subscribe).
    patch.daysBefore = Array.from(new Set(body.daysBefore)).sort(
      (a, b) => b - a
    );
  }

  if (body.channels !== undefined) {
    // Dedupe; preserve email-first ordering for readability.
    const set = new Set(body.channels);
    const ordered: ("email" | "whatsapp")[] = [];
    if (set.has("email")) ordered.push("email");
    if (set.has("whatsapp")) ordered.push("whatsapp");
    patch.channels = ordered;
  }

  return patch;
}
