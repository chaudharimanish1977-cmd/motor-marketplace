import { NextResponse } from "next/server";
import { findOne, updateById, Tables } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { User } from "@/lib/types";

/**
 * POST /api/me/onboarding/done — dismiss the first-visit /me
 * welcome panel.
 *
 * Sets `User.meOnboardedAt` to now on the verified user's record.
 * After this fires, the MeOnboardingPanel will never render again
 * for this customer (persistence is on the User row, so it survives
 * device + browser changes — sign in anywhere and we won't show
 * the welcome again).
 *
 * Auth: full magic-link / OAuth session required. Upload-session-
 * only customers don't see the welcome panel (the upload session
 * is scoped to one browser; their User row may not exist yet, so
 * there's nothing to mark).
 */

export const runtime = "nodejs";

export async function POST() {
  const sessionEmail = await getSession();
  if (!sessionEmail) {
    return NextResponse.json(
      { error: "Not signed in" },
      { status: 401 }
    );
  }
  const lowered = sessionEmail.toLowerCase();
  const user = await findOne<User>(
    Tables.USERS,
    (u) => (u.email ?? "").toLowerCase() === lowered
  );
  if (!user) {
    // No User row — odd but possible if the customer signed in via
    // OAuth on a fresh device before any policy upload created a
    // User row. Silently accept; the next page render will create
    // the row at policy-upload time.
    return NextResponse.json({ ok: true, marked: false });
  }
  if (user.meOnboardedAt) {
    // Idempotent: already dismissed previously.
    return NextResponse.json({ ok: true, marked: false });
  }
  await updateById<User>(Tables.USERS, user.id, {
    meOnboardedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, marked: true });
}
