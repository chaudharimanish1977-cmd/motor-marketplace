import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { appendRow, findOne, updateById, Tables } from "@/lib/db";
import { clearOtp, readOtp } from "@/lib/otp-store";
import type { User } from "@/lib/types";

export const runtime = "nodejs";

const VerifySchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile"),
  otp: z.string().regex(/^\d{4}$/, "OTP must be 4 digits"),
});

/**
 * Step 2 of the OTP gate.
 *
 * Reads the pending OTP from KV (set by /api/register), compares against
 * what the user typed, and on success creates the User record with the
 * captured email + mobile + consent timestamp. The OTP is deleted after a
 * single successful verification — one-shot, can't be replayed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = VerifySchema.parse(body);

    const pending = await readOtp(validated.mobile);
    if (!pending) {
      return NextResponse.json(
        { verified: false, error: "OTP expired. Please request a new one." },
        { status: 400 }
      );
    }
    if (pending.code !== validated.otp) {
      return NextResponse.json(
        { verified: false, error: "Wrong OTP. Try again." },
        { status: 400 }
      );
    }

    // OTP matches — invalidate it immediately so the same code can't be reused
    await clearOtp(validated.mobile);

    // Find or create the user record now that we trust the email + mobile pair
    const existing = await findOne<User>(
      Tables.USERS,
      (u) => u.mobile === validated.mobile
    );
    let userId: string;
    if (existing) {
      await updateById<User>(Tables.USERS, existing.id, {
        email: pending.email,
        dpdpConsentGivenAt: pending.consentAt,
      });
      userId = existing.id;
    } else {
      const user: User = {
        id: randomUUID(),
        mobile: validated.mobile,
        email: pending.email,
        createdAt: new Date().toISOString(),
        dpdpConsentGivenAt: pending.consentAt,
      };
      await appendRow<User>(Tables.USERS, user);
      userId = user.id;
    }

    return NextResponse.json({
      verified: true,
      userId,
      email: pending.email,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { verified: false, error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }
    console.error("[verify-otp] Error:", err);
    return NextResponse.json(
      { verified: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
