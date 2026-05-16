import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { clearUploadSession } from "@/lib/upload-session";
import { clearAnonymousSession } from "@/lib/anonymous-session";

export const runtime = "nodejs";

export async function POST() {
  // Clear ALL session cookies — the customer hitting Sign Out wants
  // a clean slate. Anonymous session matters in particular because
  // its 7-day TTL would otherwise leave the previous browse's docs
  // surfacing in /reports on a subsequent visit, creating the
  // "I uploaded 2 docs but I'm seeing 4" confusion.
  await clearSession();
  await clearUploadSession();
  await clearAnonymousSession();
  return NextResponse.json({ ok: true });
}
