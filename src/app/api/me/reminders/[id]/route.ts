import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findById, updateById, Tables } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RenewalSubscription } from "@/lib/types";

export const runtime = "nodejs";

const Schema = z.object({
  status: z.enum(["active", "unsubscribed"]),
});

/**
 * Update a single subscription's reminder status. Requires a valid
 * session AND the subscription's `customerEmail` must match the
 * session email — preventing one signed-in user from toggling
 * someone else's reminders by guessing IDs.
 *
 * When the customer resumes reminders after a pause, we reset the
 * `nudgesFired` list so they receive the next-due checkpoint email
 * instead of the cron silently skipping them. Without this, a user
 * who paused at 60d and resumes at 25d would never get the 30d nudge.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const sessionEmail = await getSession();
  if (!sessionEmail) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await context.params;
  let next: "active" | "unsubscribed";
  try {
    const body = await request.json();
    const validated = Schema.parse(body);
    next = validated.status;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const existing = await findById<RenewalSubscription>(
    Tables.RENEWAL_SUBSCRIPTIONS,
    id
  );
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    (existing.customerEmail ?? "").toLowerCase() !== sessionEmail.toLowerCase()
  ) {
    // 404 (not 403) to avoid leaking subscription IDs.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patch: Partial<RenewalSubscription> = { status: next };
  if (next === "unsubscribed") {
    patch.unsubscribedAt = new Date().toISOString();
  } else {
    // Resume: clear unsubscribedAt + reset nudgesFired so the cron
    // doesn't skip the next-due checkpoint as already-fired.
    patch.unsubscribedAt = undefined;
    patch.nudgesFired = [];
  }

  const updated = await updateById<RenewalSubscription>(
    Tables.RENEWAL_SUBSCRIPTIONS,
    id,
    patch
  );
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status: updated.status });
}
