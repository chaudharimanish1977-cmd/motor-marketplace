import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { findById, findOne, appendRow, updateById, Tables } from "@/lib/db";
import type { ParsedPolicy, RenewalSubscription } from "@/lib/types";

export const runtime = "nodejs";

const SubscribeSchema = z.object({
  parsedPolicyId: z.string().uuid(),
  email: z.string().email(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile"),
  daysBefore: z
    .array(z.number().int().min(1).max(180))
    .min(1)
    .max(10)
    .optional(),
  reminderHourIst: z.number().int().min(0).max(23).optional(),
});

const DEFAULT_DAYS_BEFORE = [60, 30, 7];
const DEFAULT_REMINDER_HOUR = 10;

/**
 * Opt-in renewal reminders. Captured on /thank-you after the customer has
 * already OTP-verified their email + mobile. Both email and WhatsApp are
 * recorded as agreed channels (the user's spec: capture both in one tap).
 *
 * Idempotent — re-subscribing to the same policy updates the existing record
 * rather than duplicating.
 *
 * The actual reminder delivery is handled by a separate daily cron (not
 * built yet) that scans this table for subscriptions whose expiry falls
 * within the pre-renewal nudge window.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SubscribeSchema.parse(body);

    const policy = await findById<ParsedPolicy>(
      Tables.PARSED_POLICIES,
      validated.parsedPolicyId
    );
    if (!policy) {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    const expiry = policy.odPeriodEnd;
    if (!expiry) {
      return NextResponse.json(
        { error: "Couldn't determine policy expiry date" },
        { status: 400 }
      );
    }

    const existing = await findOne<RenewalSubscription>(
      Tables.RENEWAL_SUBSCRIPTIONS,
      (s) => s.parsedPolicyId === validated.parsedPolicyId
    );

    // Normalise + sort the days-before list, dedupe, descending so the
    // earliest reminder fires first chronologically.
    const daysBefore = Array.from(
      new Set(validated.daysBefore ?? DEFAULT_DAYS_BEFORE)
    ).sort((a, b) => b - a);
    const reminderHourIst =
      validated.reminderHourIst ?? DEFAULT_REMINDER_HOUR;

    if (existing) {
      const updated = await updateById<RenewalSubscription>(
        Tables.RENEWAL_SUBSCRIPTIONS,
        existing.id,
        {
          customerEmail: validated.email,
          customerMobile: validated.mobile,
          channels: ["email", "whatsapp"],
          daysBefore,
          reminderHourIst,
          status: "active",
        }
      );
      return NextResponse.json({
        subscribed: true,
        existing: true,
        subscriptionId: updated?.id ?? existing.id,
        policyExpiryDate: expiry,
        daysBefore,
        reminderHourIst,
      });
    }

    const sub: RenewalSubscription = {
      id: randomUUID(),
      parsedPolicyId: validated.parsedPolicyId,
      customerEmail: validated.email,
      customerMobile: validated.mobile,
      channels: ["email", "whatsapp"],
      policyExpiryDate: expiry,
      daysBefore,
      reminderHourIst,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    await appendRow<RenewalSubscription>(Tables.RENEWAL_SUBSCRIPTIONS, sub);

    return NextResponse.json({
      subscribed: true,
      existing: false,
      subscriptionId: sub.id,
      policyExpiryDate: expiry,
      daysBefore,
      reminderHourIst,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }
    console.error("[reminders/subscribe] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
