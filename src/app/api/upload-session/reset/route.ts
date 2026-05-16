import { NextResponse } from "next/server";
import { clearUploadSession } from "@/lib/upload-session";
import { clearAnonymousSession } from "@/lib/anonymous-session";

export const runtime = "nodejs";

/**
 * "Start a new comparison" — clears the anonymous + upload session
 * cookies so the customer's next upload starts a fresh stack. Does
 * NOT touch the full magic-link session (they stay signed in).
 *
 * Distinct from sign-out: this is "I want a clean comparison
 * workspace, but I'm still me." Sign-out also clears the full
 * session.
 */
export async function POST() {
  await clearUploadSession();
  await clearAnonymousSession();
  return NextResponse.json({ ok: true });
}
