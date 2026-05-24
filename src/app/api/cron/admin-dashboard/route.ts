/**
 * Cron: refresh the admin dashboard snapshot.
 *
 * Runs every 3 hours between 9am-9pm IST (UTC 3:30, 6:30, 9:30, 12:30,
 * 15:30 — 5 firings per day, 1.5h gap before 9am IST). Computes the
 * full snapshot and writes the singleton row to KV.
 *
 * Auth: Vercel Cron hits us with `Authorization: Bearer <CRON_SECRET>`.
 * Same gate as the renewal-reminders cron.
 */

import { NextRequest, NextResponse } from "next/server";
import { writeTable, Tables } from "@/lib/db";
import { computeAdminDashboardSnapshot } from "@/lib/admin-dashboard";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await computeAdminDashboardSnapshot();
    // Singleton row — overwrite the table entirely each cron tick.
    await writeTable(Tables.ADMIN_DASHBOARD_SNAPSHOTS, [snapshot]);
    return NextResponse.json({
      ok: true,
      computedAt: snapshot.computedAt,
      computedDurationMs: snapshot.computedDurationMs,
      totals: {
        audits: snapshot.volume.totalAudits,
        customers: snapshot.volume.totalCustomers,
        insurers: snapshot.breadth.insurerCount,
      },
    });
  } catch (err) {
    console.error("[cron/admin-dashboard] compute failed:", err);
    return NextResponse.json(
      {
        error: "compute_failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
