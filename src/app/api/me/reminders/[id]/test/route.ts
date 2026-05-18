import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { findById, findOne, Tables } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendRenewalReminderEmail } from "@/lib/email-sender";
import { buildUnsubscribeUrl } from "@/lib/email-token";
import { friendlyFirstName } from "@/lib/format";
import { buildPreviousAuditSnapshot } from "@/lib/previous-audit-snapshot";
import type {
  ParsedPolicy,
  PolicyReport,
  RenewalSubscription,
} from "@/lib/types";

export const runtime = "nodejs";

const SITE_URL = "https://rightoffer.in";
// 60s cooldown per subscription so a stuck client / impatient finger
// can't drive a Resend spam loop. Far below abuse thresholds; far
// above what a real "let me see this in my inbox" user needs.
const COOLDOWN_SECONDS = 60;

const useKv = !!process.env.KV_REST_API_URL;

/**
 * Send a preview of the renewal-reminder email to the signed-in
 * customer's address. Identical to what the cron would fire,
 * computed from the subscription's *current* policy-expiry date
 * (not a synthetic value). The customer sees exactly what they'd
 * receive on a real checkpoint day.
 *
 * Distinct from /api/cron/renewal-reminders:
 *   - No nudgesFired stamping (this is a preview, not a real fire).
 *   - No lastNudgedAt write. Safe to call repeatedly.
 *   - Auth via session (not CRON_SECRET). The named subscription
 *     must belong to the signed-in email.
 *   - Status check skipped: paused subscriptions can still be
 *     previewed. The customer might pause first, then want to see
 *     what they paused.
 *
 * Always sends email even if the subscription has only WhatsApp
 * checked — the UI button is labelled "Send test email" so the
 * contract is honest, and previewing email is useful regardless of
 * the saved channel config.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const sessionEmail = await getSession();
  if (!sessionEmail) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const target = sessionEmail.toLowerCase();

  const { id } = await context.params;
  const sub = await findById<RenewalSubscription>(
    Tables.RENEWAL_SUBSCRIPTIONS,
    id
  );
  if (!sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if ((sub.customerEmail ?? "").toLowerCase() !== target) {
    // 404 (not 403) — keep cross-account probing useless.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Rate-limit per subscription.
  if (useKv) {
    const key = `test-send:cooldown:${id}`;
    const existing = await kv.get<number>(key);
    if (existing) {
      return NextResponse.json(
        {
          error:
            "Just sent a test — give it 60 seconds and check your inbox first.",
        },
        { status: 429 }
      );
    }
    await kv.set(key, 1, { ex: COOLDOWN_SECONDS });
  }

  const policy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    sub.parsedPolicyId
  );
  if (!policy) {
    return NextResponse.json(
      { error: "Linked policy missing." },
      { status: 404 }
    );
  }

  const expiryMs = new Date(sub.policyExpiryDate).getTime();
  // Floor at 0 so the email never reads "renewal in -3 days." If the
  // policy already expired, the preview just says "0 days" which is
  // still an honest rendering.
  const daysUntilExpiry = Math.max(
    0,
    Math.ceil((expiryMs - Date.now()) / (24 * 60 * 60 * 1000))
  );

  const firstName = friendlyFirstName(policy.owner?.name);
  const vehicleLabel =
    `${policy.vehicle.make} ${policy.vehicle.model}`.trim();
  const expiryDateLabel = new Date(sub.policyExpiryDate).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
  const unsubscribeUrl = buildUnsubscribeUrl(sub.id, SITE_URL);

  // Preview should reflect what the real cron would send today,
  // including the previous-audit enrichment block. Best-effort —
  // if the report lookup fails, fall through to the un-enriched copy.
  let previousAudit;
  try {
    const report = await findOne<PolicyReport>(
      Tables.REPORTS,
      (r) => r.parsedPolicyId === policy.id
    );
    previousAudit =
      buildPreviousAuditSnapshot(
        policy,
        report,
        `${SITE_URL}/report/${policy.id}`
      ) ?? undefined;
  } catch (err) {
    console.warn("[me/reminders/test] Could not load report:", err);
  }

  try {
    await sendRenewalReminderEmail({
      to: sub.customerEmail,
      firstName,
      vehicleLabel,
      expiryDate: expiryDateLabel,
      daysUntilExpiry,
      reviewUrl: `${SITE_URL}/upload`,
      unsubscribeUrl,
      previousAudit,
    });
  } catch (err) {
    console.error("[me/reminders/test] Send failed:", err);
    return NextResponse.json(
      { error: "Couldn't send the test. Try again in a minute." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, to: sub.customerEmail });
}
