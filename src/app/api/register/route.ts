import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendRow, findOne, Tables } from "@/lib/db";
import type { User } from "@/lib/types";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const RegisterSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile"),
  email: z.string().email("Invalid email"),
  dpdpConsent: z.boolean().refine((v) => v === true, "Consent required"),
});

/**
 * Registers a user (mobile + email + DPDP consent) for report download.
 * Persists to data/db/users.json as a contactable lead — feeds the
 * renewal-cadence flywheel.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RegisterSchema.parse(body);

    // Look up existing user by mobile to avoid duplicates
    const existing = await findOne<User>(
      Tables.USERS,
      (u) => u.mobile === validated.mobile
    );
    if (existing) {
      return NextResponse.json({
        userId: existing.id,
        existing: true,
      });
    }

    const user: User = {
      id: randomUUID(),
      mobile: validated.mobile,
      email: validated.email,
      createdAt: new Date().toISOString(),
      dpdpConsentGivenAt: new Date().toISOString(),
    };
    await appendRow<User>(Tables.USERS, user);

    return NextResponse.json({ userId: user.id, existing: false });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }
    console.error("[register] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
