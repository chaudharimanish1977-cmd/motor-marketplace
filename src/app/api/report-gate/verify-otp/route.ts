import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import {
  appendRow,
  findById,
  findOne,
  updateById,
  Tables,
} from "@/lib/db";
import {
  clearEmailOtp,
  readEmailOtp,
} from "@/lib/email-otp-store";
import { setUploadSession } from "@/lib/upload-session";
import {
  clearAnonymousSession,
  getAnonymousSession,
} from "@/lib/anonymous-session";
import type { ParsedPolicy, User } from "@/lib/types";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().email("Invalid email"),
  otp: z.string().regex(/^\d{4}$/, "OTP must be 4 digits"),
});

/**
 * Step 2 of the report-gate. Customer types the 4-digit code into the
 * gate form; we verify, then on success:
 *
 *   1. Stamp every doc in the anonymous-session cookie with the
 *      verified email (so they show up in /me).
 *   2. Create or update the User row with the email + WhatsApp (the
 *      WhatsApp was captured during request-otp and is read off the
 *      pending OTP record here).
 *   3. Set the upload-session cookie (scoped browser session, email
 *      verified, same as M3.5).
 *   4. Clear the anonymous-session cookie (its purpose is fulfilled).
 *
 * After verification the customer's docs are durably linked to their
 * email + the rest of the report unlocks. The page client refreshes
 * to re-render with the gate gone.
 *
 * A magic-link email used to fire here too as a "future cross-device
 * recovery" courtesy — that's been removed. The customer is fully
 * signed in on this browser already, and any future device can hit
 * /me/login to request a fresh magic-link on demand. Sending one
 * preemptively just landed a confusing second email in their inbox
 * seconds after the OTP code.
 */
export async function POST(request: NextRequest) {
  let body: z.infer<typeof Schema>;
  try {
    const raw = await request.json();
    body = Schema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { verified: false, error: "Enter the 4-digit code we emailed you." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { verified: false, error: "Bad request" },
      { status: 400 }
    );
  }

  const email = body.email.toLowerCase().trim();
  const pending = await readEmailOtp(email);
  if (!pending) {
    return NextResponse.json(
      {
        verified: false,
        error: "Code expired. Request a fresh one.",
      },
      { status: 400 }
    );
  }
  if (pending.code !== body.otp) {
    return NextResponse.json(
      { verified: false, error: "Wrong code. Try again." },
      { status: 400 }
    );
  }

  // OTP matches — invalidate immediately (one-shot).
  await clearEmailOtp(email);

  // Stamp every doc in this browser's anonymous session with the
  // verified email so /me shows them.
  const anon = await getAnonymousSession();
  const docIds = anon?.docs ?? [];
  for (const id of docIds) {
    const doc = await findById<ParsedPolicy>(Tables.PARSED_POLICIES, id);
    if (!doc) continue;
    const existing = (doc.owner?.email ?? "").toLowerCase();
    // Stamp if doc is unowned OR already owned by this email.
    if (existing && existing !== email) continue;
    await updateById<ParsedPolicy>(Tables.PARSED_POLICIES, id, {
      owner: { ...doc.owner, email },
    });
  }

  // Create or update the User row. We key on email here — different
  // from the legacy mobile-keyed flow — because email is the
  // mandatory identifier in the new gate.
  const existingUser = await findOne<User>(
    Tables.USERS,
    (u) => (u.email ?? "").toLowerCase() === email
  );
  if (existingUser) {
    await updateById<User>(Tables.USERS, existingUser.id, {
      mobile: pending.whatsapp ?? existingUser.mobile,
      dpdpConsentGivenAt: pending.consentAt,
    });
  } else {
    const user: User = {
      id: randomUUID(),
      // Mobile is required by the legacy schema; use the WhatsApp
      // number if given, else a placeholder. New-flow customers may
      // not supply mobile — that's expected. The reminder cron
      // doesn't depend on mobile presence.
      mobile: pending.whatsapp ?? "",
      email,
      createdAt: new Date().toISOString(),
      dpdpConsentGivenAt: pending.consentAt,
    };
    await appendRow<User>(Tables.USERS, user);
  }

  // Upgrade: set the upload-session cookie + clear the anonymous one.
  // The cookie holds the verified email + the docs the customer
  // uploaded — same shape as before, just minted via OTP instead of
  // typed-but-unverified.
  await setUploadSession(email, docIds, pending.whatsapp);
  await clearAnonymousSession();

  return NextResponse.json({ verified: true, email });
}
