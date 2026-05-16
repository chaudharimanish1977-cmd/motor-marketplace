import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { kv } from "@vercel/kv";
import {
  generateEmailOtpCode,
  storeEmailOtp,
} from "@/lib/email-otp-store";
import { sendOtpEmail } from "@/lib/email-sender";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().email("Invalid email"),
  /** Optional Indian mobile (10 digits starting 6-9) — captured at the
   *  gate for future WhatsApp delivery. Stored alongside the OTP so
   *  the verify endpoint can persist it on the User row. */
  whatsapp: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile")
    .optional(),
});

// Cooldown: 60 seconds between OTP requests for the same email.
// Short enough that a real user retry isn't blocked, long enough to
// prevent abuse loops.
const COOLDOWN_SECONDS = 60;
const useKv = !!process.env.KV_REST_API_URL;

/**
 * Step 1 of the report-gate. Receives the customer's email + optional
 * WhatsApp from the gate form, generates a 4-digit OTP, stores it
 * email-keyed with a 10-minute TTL, and emails the code.
 *
 * Idempotent within the cooldown — a second request for the same
 * email within 60s returns the same {ok: true} without sending again.
 *
 * Unlike /api/auth/request-link (which sends a magic link for /me/login),
 * this endpoint sends a SHORT CODE that the customer types back into
 * the gate form. We want the in-the-moment friction of typing a code
 * to certify "yes this is really my email" — vital before unlocking
 * the high-value sections of the report.
 */
export async function POST(request: NextRequest) {
  let body: z.infer<typeof Schema>;
  try {
    const raw = await request.json();
    body = Schema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please enter a valid email." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();

  // Cooldown per email.
  if (useKv) {
    const cooldownKey = `report-gate:cooldown:${email}`;
    const existing = await kv.get<number>(cooldownKey);
    if (existing) {
      return NextResponse.json(
        {
          ok: true,
          cooldown: true,
          message:
            "Just sent a code — give it a minute and check your inbox first.",
        },
        { status: 200 }
      );
    }
    await kv.set(cooldownKey, 1, { ex: COOLDOWN_SECONDS });
  }

  const code = generateEmailOtpCode();
  const consentAt = new Date().toISOString();

  await storeEmailOtp(email, {
    code,
    whatsapp: body.whatsapp,
    consentAt,
  });

  try {
    await sendOtpEmail({ to: email, code });
  } catch (err) {
    console.error("[report-gate/request-otp] Send failed:", err);
    return NextResponse.json(
      {
        error:
          "Couldn't send the code to that email. Check the address or try again.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
