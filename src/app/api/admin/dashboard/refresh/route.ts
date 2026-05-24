/**
 * Manual refresh endpoint for the admin dashboard.
 *
 * Triggered by the "Refresh now" button on /admin/dashboard. Re-computes
 * the snapshot and overwrites the singleton KV row, same as the cron at
 * /api/cron/admin-dashboard does.
 *
 * Gated by founder-email session — anyone else gets a 404 so the
 * endpoint stays invisible to non-founders. Same not-found-spoofing
 * pattern as /api/admin/health.
 */

import { NextResponse } from "next/server";
import { writeTable, Tables } from "@/lib/db";
import { getSession } from "@/lib/session";
import { computeAdminDashboardSnapshot } from "@/lib/admin-dashboard";

const FOUNDER_EMAIL = "chaudharimanish1977@gmail.com";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const session = await getSession();
  if (!session || session.toLowerCase() !== FOUNDER_EMAIL) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const snapshot = await computeAdminDashboardSnapshot();
    await writeTable(Tables.ADMIN_DASHBOARD_SNAPSHOTS, [snapshot]);
    return NextResponse.json({
      ok: true,
      computedAt: snapshot.computedAt,
      computedDurationMs: snapshot.computedDurationMs,
    });
  } catch (err) {
    console.error("[admin/dashboard/refresh] compute failed:", err);
    return NextResponse.json(
      {
        error: "compute_failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
