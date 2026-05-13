import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateOtpCode, storeOtp } from "@/lib/otp-store";
import { sendOtpEmail } from "@/lib/email-sender";

export const runtime = "nodejs";

const RegisterSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile"),
  email: z.string().email("Invalid email"),
  dpdpConsent: z.boolean().refine((v) => v === true, "Consent required"),
});

/**
 * Step 1 of the OTP gate.
 *
 * Takes (mobile, email, consent), generates a 4-digit code, stores it in KV
 * with a 10-minute TTL, and emails it via Resend. The actual user record is
 * NOT created here — that happens in /api/verify-otp once the OTP is proven
 * good. This way we don't write half-validated records into the users table.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RegisterSchema.parse(body);

    const code = generateOtpCode();
    const consentAt = new Date().toISOString();

    await storeOtp(validated.mobile, {
      code,
      email: validated.email,
      consentAt,
    });

    try {
      await sendOtpEmail({ to: validated.email, code });
    } catch (mailErr) {
      // If email delivery fails we still respond success-ish but flag it —
      // the user can resend, and we don't want to leak SMTP errors back.
      console.error("[register] OTP email failed:", mailErr);
      return NextResponse.json(
        {
          error:
            "Couldn't send the OTP email. Please check the address or try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ sent: true, channel: "email" });
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
