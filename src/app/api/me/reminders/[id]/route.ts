import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findById, readTable, updateById, Tables } from "@/lib/db";
import { getSession } from "@/lib/session";
import { policyGroupKey } from "@/lib/policy-group";
import type { ParsedPolicy, RenewalSubscription } from "@/lib/types";

export const runtime = "nodejs";

const Schema = z.object({
  status: z.enum(["active", "unsubscribed"]),
});

/**
 * Update a subscription's reminder status, cascading to every
 * sibling subscription that points at the same physical car-period.
 *
 * Why cascade: a customer who uploaded the same policy multiple times
 * (e.g. while testing) has one row in /me but many subscription rows
 * underneath. Without cascading, "Pause" would silence the one we
 * happen to display while the cron still fires emails from the
 * orphans. The user would see "paused" and still get spammed.
 *
 * Auth model:
 *   1. Caller must have a session.
 *   2. The named subscription must belong to that session email.
 *   3. Cascade only updates other subs ALSO belonging to that email
 *      — no chance of toggling a stranger's reminders by guessing IDs.
 *
 * Resume side-effect: clearing `unsubscribedAt` + resetting
 * `nudgesFired` to [] across the group so the cron rehydrates the
 * next-due checkpoint instead of treating it as already fired.
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
  let next: "active" | "unsubscribed";
  try {
    const body = await request.json();
    const validated = Schema.parse(body);
    next = validated.status;
  } catch {
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

  // Find the policy this sub targets so we can compute its group key.
  const namedPolicy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    named.parsedPolicyId
  );
  if (!namedPolicy) {
    // The sub is orphaned (its policy was deleted). Toggle just this
    // one — there's nothing to cascade to.
    const updated = await updateById<RenewalSubscription>(
      Tables.RENEWAL_SUBSCRIPTIONS,
      id,
      buildPatch(next)
    );
    return NextResponse.json({
      ok: true,
      status: updated?.status ?? next,
      cascadedCount: 0,
    });
  }
  const targetGroupKey = policyGroupKey(namedPolicy);

  // Find every sibling sub belonging to this email whose target
  // policy lives in the same group.
  const [allPolicies, allSubs] = await Promise.all([
    readTable<ParsedPolicy>(Tables.PARSED_POLICIES),
    readTable<RenewalSubscription>(Tables.RENEWAL_SUBSCRIPTIONS),
  ]);
  const policyById = new Map(allPolicies.map((p) => [p.id, p]));

  const siblingsToUpdate = allSubs.filter((s) => {
    if ((s.customerEmail ?? "").toLowerCase() !== target) return false;
    const p = policyById.get(s.parsedPolicyId);
    if (!p) return false;
    return policyGroupKey(p) === targetGroupKey;
  });

  const patch = buildPatch(next);
  for (const s of siblingsToUpdate) {
    await updateById<RenewalSubscription>(
      Tables.RENEWAL_SUBSCRIPTIONS,
      s.id,
      patch
    );
  }

  return NextResponse.json({
    ok: true,
    status: next,
    cascadedCount: siblingsToUpdate.length,
  });
}

function buildPatch(
  next: "active" | "unsubscribed"
): Partial<RenewalSubscription> {
  if (next === "unsubscribed") {
    return {
      status: "unsubscribed",
      unsubscribedAt: new Date().toISOString(),
    };
  }
  // Resume: clear unsubscribedAt + reset nudgesFired so the cron
  // doesn't skip the next-due checkpoint as already-fired.
  return {
    status: "active",
    unsubscribedAt: undefined,
    nudgesFired: [],
  };
}
