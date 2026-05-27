/**
 * Manual refresh endpoint for the admin dashboard.
 *
 * Triggered by the "Refresh now" button on /admin/dashboard. Re-computes
 * the snapshot and overwrites the singleton KV row, same as the cron at
 * /api/cron/admin-dashboard does.
 *
 * Gated by the demo-marketplace flag — i.e. anyone who got past the
 * demo password cookie on demo.rightoffer.in (or is on a preview
 * build) can refresh. We previously also required a founder magic-link
 * session, but that double-gate locked the founder out on the demo
 * subdomain since they authenticate there with the demo password,
 * not their /me magic-link.
 */

import { NextResponse } from "next/server";
import { writeTable, Tables } from "@/lib/db";
import { isMarketplaceEnabled } from "@/lib/feature-flags";
import { computeAdminDashboardSnapshot } from "@/lib/admin-dashboard";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  if (!(await isMarketplaceEnabled())) {
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
