import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { readTable, updateById, Tables } from "@/lib/db";
import type { ParsedPolicy, RenewalSubscription } from "@/lib/types";
import { sendRenewalReminderEmail } from "@/lib/email-sender";
import { buildUnsubscribeUrl } from "@/lib/email-token";

export const runtime = "nodejs";
export const maxDuration = 60;

const SITE_URL = "https://rightoffer.in";
const FOUNDER_EMAIL = "chaudharimanish1977@gmail.com";
const DIGEST_FROM = "RightOffer Reports <hello@rightoffer.in>";

/**
 * Daily renewal-reminder cron. Fires once every 24h at 10:00 IST
 * (04:30 UTC). For each active subscription, computes how many days
 * remain until policyExpiryDate and decides whether to fire one of
 * the subscription's daysBefore checkpoints today.
 *
 * Single-fire rule: each daysBefore checkpoint fires at most once
 * per subscription. We track this in RenewalSubscription.nudgesFired
 * so even if the cron runs multiple times (manual retrigger, infra
 * hiccup) the customer never gets the same nudge twice.
 *
 * Latest-eligible-checkpoint rule: if a subscription has [60, 30, 7]
 * and we're 25 days from expiry, the only checkpoint that's
 * legitimately due is 30 — we send the "30 day" email even though
 * it's technically 25 days out. (60 already passed; 7 isn't yet due.)
 * This handles late-onboarded customers (signed up 25 days from
 * expiry) gracefully — they still get the most-relevant nudge
 * instead of being silently skipped.
 *
 * Auth: Vercel Cron hits us with `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = Date.now();
    const todayIst = istDateString(now);

    const [subs, policies] = await Promise.all([
      readTable<RenewalSubscription>(Tables.RENEWAL_SUBSCRIPTIONS),
      readTable<ParsedPolicy>(Tables.PARSED_POLICIES),
    ]);
    const policyById = new Map(policies.map((p) => [p.id, p]));

    const sentRecords: SentRecord[] = [];
    const skippedRecords: SkippedRecord[] = [];

    for (const sub of subs) {
      if (sub.status !== "active") continue;

      const policy = policyById.get(sub.parsedPolicyId);
      if (!policy) {
        skippedRecords.push({
          subscriptionId: sub.id,
          email: sub.customerEmail,
          reason: "parsed policy missing",
        });
        continue;
      }

      const daysUntilExpiry = daysBetween(now, sub.policyExpiryDate);
      if (daysUntilExpiry < 0) {
        // Already expired — no pre-renewal nudges. (Post-expiry recovery
        // mail is a separate flow we may add later.)
        continue;
      }

      const checkpoint = pickCheckpoint(
        daysUntilExpiry,
        sub.daysBefore,
        sub.nudgesFired ?? []
      );
      if (checkpoint === null) continue;

      try {
        const firstName = firstNameFor(policy);
        const vehicleLabel =
          `${policy.vehicle.make} ${policy.vehicle.model}`.trim();
        const expiryDateLabel = new Date(
          sub.policyExpiryDate
        ).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const unsubscribeUrl = buildUnsubscribeUrl(sub.id, SITE_URL);

        await sendRenewalReminderEmail({
          to: sub.customerEmail,
          firstName,
          vehicleLabel,
          expiryDate: expiryDateLabel,
          daysUntilExpiry,
          reviewUrl: `${SITE_URL}/upload`,
          unsubscribeUrl,
        });

        await updateById<RenewalSubscription>(
          Tables.RENEWAL_SUBSCRIPTIONS,
          sub.id,
          {
            lastNudgedAt: new Date().toISOString(),
            nudgesFired: [...(sub.nudgesFired ?? []), checkpoint],
          }
        );

        sentRecords.push({
          subscriptionId: sub.id,
          email: sub.customerEmail,
          vehicleLabel,
          checkpoint,
          daysUntilExpiry,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown send error";
        console.error(
          `[cron/renewal-reminders] Send failed for ${sub.id}:`,
          msg
        );
        skippedRecords.push({
          subscriptionId: sub.id,
          email: sub.customerEmail,
          reason: msg,
        });
      }
    }

    await sendFounderDigest({ todayIst, sentRecords, skippedRecords });

    return NextResponse.json({
      ok: true,
      sent: sentRecords.length,
      skipped: skippedRecords.length,
      sentRecords,
      skippedRecords,
    });
  } catch (err) {
    console.error("[cron/renewal-reminders] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

interface SentRecord {
  subscriptionId: string;
  email: string;
  vehicleLabel: string;
  checkpoint: number;
  daysUntilExpiry: number;
}

interface SkippedRecord {
  subscriptionId: string;
  email: string;
  reason: string;
}

/**
 * Pick which `daysBefore` checkpoint (if any) is the right one to fire
 * today. Returns null if none applies (because we've passed the smallest
 * checkpoint OR all eligible checkpoints have already fired).
 *
 * Rule: pick the *largest* checkpoint that is >= daysUntilExpiry and
 * hasn't already fired. That ensures a customer onboarded 25 days from
 * expiry with [60, 30, 7] gets the 30-day nudge (largest checkpoint
 * still ahead of us), not the 7-day (which would be wrong — they
 * haven't entered the 7-day window yet).
 *
 * Wait — re-reading: we want the checkpoint that is currently *due*.
 * A 30-day checkpoint becomes due when daysUntilExpiry <= 30. So:
 *   - Filter to checkpoints where cp >= daysUntilExpiry (already due).
 *   - Of those, pick the smallest (most-recently-crossed window).
 *   - Skip if already fired.
 * This avoids firing the 7-day nudge first when the customer hasn't
 * crossed the 7-day mark yet (cp=7, daysUntilExpiry=25 → 7 < 25, so
 * not due).
 */
function pickCheckpoint(
  daysUntilExpiry: number,
  daysBefore: number[],
  alreadyFired: number[]
): number | null {
  const due = daysBefore
    .filter((cp) => cp >= daysUntilExpiry)
    .filter((cp) => !alreadyFired.includes(cp))
    .sort((a, b) => a - b); // smallest first = most-recently-crossed
  return due[0] ?? null;
}

function daysBetween(fromMs: number, isoDate: string): number {
  const to = new Date(isoDate).getTime();
  return Math.ceil((to - fromMs) / (24 * 60 * 60 * 1000));
}

function firstNameFor(policy: ParsedPolicy): string {
  const raw = (policy.owner?.name ?? "").trim();
  if (!raw) return "there";
  const stripped = raw.replace(/^(Mr|Mrs|Ms|Dr|Smt|Shri)\.?\s+/i, "");
  const first = stripped.split(/\s+/)[0] ?? "";
  if (!first) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function istDateString(ms: number): string {
  return new Date(ms).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
  });
}

async function sendFounderDigest({
  todayIst,
  sentRecords,
  skippedRecords,
}: {
  todayIst: string;
  sentRecords: SentRecord[];
  skippedRecords: SkippedRecord[];
}) {
  // Skip the founder digest when there's literally nothing to report.
  if (sentRecords.length === 0 && skippedRecords.length === 0) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);

  const sentRows = sentRecords
    .map(
      (r) =>
        `<tr><td>${escape(r.email)}</td><td>${escape(r.vehicleLabel)}</td><td>${r.checkpoint}d</td><td>${r.daysUntilExpiry}d</td></tr>`
    )
    .join("");
  const skippedRows = skippedRecords
    .map(
      (r) =>
        `<tr><td>${escape(r.email)}</td><td colspan="3">${escape(r.reason)}</td></tr>`
    )
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F8F9FA;font-family:Inter,system-ui,sans-serif;color:#2D3436;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F9FA;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#0A2463,#247BA0);padding:20px 24px;color:#fff;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9;">RightOffer · Renewal nudges</div>
          <div style="font-size:18px;font-weight:700;margin-top:4px;">${escape(todayIst)} IST · ${sentRecords.length} sent · ${skippedRecords.length} skipped</div>
        </td></tr>
        <tr><td style="padding:20px 24px;font-size:13px;">
          ${
            sentRows
              ? `<div style="font-weight:700;margin-bottom:8px;color:#0A2463;">Sent</div>
                 <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
                   <thead><tr style="background:#F8F9FA;text-align:left;">
                     <th style="padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Email</th>
                     <th style="padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Vehicle</th>
                     <th style="padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Checkpoint</th>
                     <th style="padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">To expiry</th>
                   </tr></thead>
                   <tbody style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${sentRows}</tbody>
                 </table>`
              : ""
          }
          ${
            skippedRows
              ? `<div style="font-weight:700;margin-bottom:8px;color:#0A2463;">Skipped</div>
                 <table style="width:100%;border-collapse:collapse;">
                   <tbody style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${skippedRows}</tbody>
                 </table>`
              : ""
          }
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `RightOffer · Renewal nudges · ${todayIst} IST`,
    `${sentRecords.length} sent · ${skippedRecords.length} skipped`,
    ``,
    ...(sentRecords.length
      ? [
          `Sent:`,
          ...sentRecords.map(
            (r) =>
              `  - ${r.email} · ${r.vehicleLabel} · checkpoint=${r.checkpoint}d · ${r.daysUntilExpiry}d to expiry`
          ),
          ``,
        ]
      : []),
    ...(skippedRecords.length
      ? [
          `Skipped:`,
          ...skippedRecords.map(
            (r) => `  - ${r.email} · ${r.reason}`
          ),
        ]
      : []),
  ].join("\n");

  await resend.emails.send({
    from: DIGEST_FROM,
    to: FOUNDER_EMAIL,
    subject: `RightOffer · ${sentRecords.length} renewal nudge${sentRecords.length === 1 ? "" : "s"} sent today`,
    html,
    text,
  });
}

function escape(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
