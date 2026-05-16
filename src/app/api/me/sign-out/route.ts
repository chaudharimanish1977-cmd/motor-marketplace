import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { clearUploadSession } from "@/lib/upload-session";

export const runtime = "nodejs";

export async function POST() {
  // Clear both session types — customer hitting Sign Out wants out
  // of every flavour of session this browser holds, not just the
  // magic-link one.
  await clearSession();
  await clearUploadSession();
  return NextResponse.json({ ok: true });
}
