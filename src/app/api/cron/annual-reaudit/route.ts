import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { readTable, updateById, Tables } from "@/lib/db";
import type {
  ParsedPolicy,
  PolicyReport,
  RenewalSubscription,
} from "@/lib/types";
import { sendAnniversaryAuditEmail } from "@/lib/email-sender";
import { buildUnsubscribeUrl } from "@/lib/email-token";
import { friendlyFirstName } from "@/lib/format";
import { buildPreviousAuditSnapshot } from "@/lib/previous-audit-snapshot";

export const runtime = "nodejs";
export const maxDuration = 60;

const SITE_URL = "https://rightoffer.in";
const FOUNDER_EMAIL = "chaudharimanish1977@gmail.com";
const DIGEST_FROM = "RightOffer Reports <hello@rightoffer.in>";

// Window around the 365-day anniversary. We don't have a guaranteed-
// daily schedule (we run weekly) so we sweep a ±10-day band each run
// to catch policies whose anniversary fell between our previous fire
// and this one. Combined with `anniversaryEmailedAt` dedup the same
// policy cannot fire twice in a window.
const ANNIVERSARY_WINDOW_DAYS_MIN = 355;
const ANNIVERSARY_WINDOW_DAYS_MAX = 375;

// Re-send guard: even if `anniversaryEmailedAt` is set, allow a fresh
// fire if the last anniversary email was more than 300 days ago. This
// covers year-2, year-3 reminders without manual intervention.
const ANNIVERSARY_RESEND_AFTER_DAYS = 300;

/**
 * Weekly annual-re-audit cron. Fires every Monday at 10:00 IST
 * (04:30 UTC, Monday). For each ParsedPolicy that hit (or recently
 * passed) the 12-month mark since upload, nudges the customer with
 * a fresh-audit invitation.
 *
 * Distinct from /api/cron/renewal-reminders:
 *   - Triggered by `uploadedAt` (anniversary), not `policyExpiryDate`.
 *   - Sweeps ALL ParsedPolicy rows, not just RenewalSubscription rows
 *     — catches customers who never opted into reminders, plus those
 *     whose parsed expiry date is unreliable.
 *   - Respects unsubscribe: if there's an unsubscribed RenewalSub for
 *     the same customer email, suppress.
 *   - Dedup via ParsedPolicy.anniversaryEmailedAt (300-day cooldown).
 *
 * Auth: Vercel Cron passes `Authorization: Bearer <CRON_SECRET>`.
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

    const [policies, reports, subs] = await Promise.all([
      readTable<ParsedPolicy>(Tables.PARSED_POLICIES),
      readTable<PolicyReport>(Tables.REPORTS),
      readTable<RenewalSubscription>(Tables.RENEWAL_SUBSCRIPTIONS),
    ]);
    const reportByPolicyId = new Map(
      reports.map((r) => [r.parsedPolicyId, r])
    );
    // Suppression set: any customer email that has unsubscribed from
    // RenewalSubscription gets no anniversary mail either. Honour the
    // opt-out across both streams — they signed up for reminders, not
    // a separate annual stream.
    const unsubscribedEmails = new Set(
      subs
        .filter((s) => s.status === "unsubscribed")
        .map((s) => (s.customerEmail || "").toLowerCase())
    );

    // For unsubscribe token: anniversary mail isn't keyed to a
    // RenewalSubscription row. We re-use the most-recent sub for the
    // same email if one exists; otherwise we fall back to a synthetic
    // suppression key (the parsedPolicyId itself). The /unsubscribe
    // page is tolerant of missing subs (renders "you're not
    // subscribed" rather than 404).
    const latestSubByEmail = new Map<string, RenewalSubscription>();
    for (const s of subs) {
      const key = (s.customerEmail || "").toLowerCase();
      if (!key) continue;
      const existing = latestSubByEmail.get(key);
      if (!existing || s.createdAt > existing.createdAt) {
        latestSubByEmail.set(key, s);
      }
    }

    const sentRecords: SentRecord[] = [];
    const skippedRecords: SkippedRecord[] = [];

    for (const policy of policies) {
      // Skip pre-bind quotations — anniversary makes no sense.
      if ((policy.documentType ?? "policy") === "quote") {
        continue;
      }
      const email = (policy.owner?.email || "").toLowerCase();
      if (!email) {
        // No customer email to send to. Common for older policies
        // uploaded before we captured email at OTP/OAuth.
        continue;
      }
      if (unsubscribedEmails.has(email)) {
        skippedRecords.push({
          policyId: policy.id,
          email,
          reason: "customer unsubscribed",
        });
        continue;
      }

      const daysSinceUpload = daysBetween(
        new Date(policy.uploadedAt).getTime(),
        now
      );
      const inWindow =
        daysSinceUpload >= ANNIVERSARY_WINDOW_DAYS_MIN &&
        daysSinceUpload <= ANNIVERSARY_WINDOW_DAYS_MAX;
      if (!inWindow) continue;

      // Dedup: if we sent an anniversary email in the last 300 days,
      // don't send another. Covers re-runs of the same cron + cohort
      // overlaps without manual intervention.
      if (policy.anniversaryEmailedAt) {
        const daysSinceLast = daysBetween(
          new Date(policy.anniversaryEmailedAt).getTime(),
          now
        );
        if (daysSinceLast < ANNIVERSARY_RESEND_AFTER_DAYS) {
          skippedRecords.push({
            policyId: policy.id,
            email,
            reason: `already nudged ${daysSinceLast}d ago`,
          });
          continue;
        }
      }

      try {
        const firstName = friendlyFirstName(policy.owner?.name);
        const vehicleLabel =
          `${policy.vehicle.make} ${policy.vehicle.model}`.trim() ||
          "your car";
        const originalAuditDate = new Date(
          policy.uploadedAt
        ).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        // Pick the most-recent sub for this email if we have one — it
        // lets one-click unsubscribe land on a real row. Otherwise
        // use the policy id as the sub-id placeholder; the unsubscribe
        // page degrades gracefully when no sub matches.
        const latestSub = latestSubByEmail.get(email);
        const unsubscribeSubjectId = latestSub?.id ?? policy.id;
        const unsubscribeUrl = buildUnsubscribeUrl(
          unsubscribeSubjectId,
          SITE_URL
        );

        const previousAudit =
          buildPreviousAuditSnapshot(
            policy,
            reportByPolicyId.get(policy.id),
            `${SITE_URL}/report/${policy.id}`
          ) ?? undefined;

        await sendAnniversaryAuditEmail({
          to: policy.owner?.email ?? email,
          firstName,
          vehicleLabel,
          originalAuditDate,
          reviewUrl: `${SITE_URL}/upload`,
          unsubscribeUrl,
          previousAudit,
        });

        await updateById<ParsedPolicy>(
          Tables.PARSED_POLICIES,
          policy.id,
          { anniversaryEmailedAt: new Date().toISOString() }
        );

        sentRecords.push({
          policyId: policy.id,
          email,
          vehicleLabel,
          daysSinceUpload,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown send error";
        console.error(
          `[cron/annual-reaudit] Send failed for ${policy.id}:`,
          msg
        );
        skippedRecords.push({
          policyId: policy.id,
          email,
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
    console.error("[cron/annual-reaudit] Error:", err);
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
  policyId: string;
  email: string;
  vehicleLabel: string;
  daysSinceUpload: number;
}

interface SkippedRecord {
  policyId: string;
  email: string;
  reason: string;
}

function daysBetween(fromMs: number, toMs: number): number {
  return Math.floor((toMs - fromMs) / (24 * 60 * 60 * 1000));
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
  if (sentRecords.length === 0 && skippedRecords.length === 0) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);

  const sentRows = sentRecords
    .map(
      (r) =>
        `<tr><td>${escape(r.email)}</td><td>${escape(r.vehicleLabel)}</td><td>${r.daysSinceUpload}d since upload</td></tr>`
    )
    .join("");
  const skippedRows = skippedRecords
    .map(
      (r) =>
        `<tr><td>${escape(r.email)}</td><td colspan="2">${escape(r.reason)}</td></tr>`
    )
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F8F9FA;font-family:Inter,system-ui,sans-serif;color:#2D3436;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F9FA;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#1a3470,#3A1E3D);padding:20px 24px;color:#fff;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9;">RightOffer · Annual re-audits</div>
          <div style="font-size:18px;font-weight:700;margin-top:4px;">${escape(todayIst)} IST · ${sentRecords.length} sent · ${skippedRecords.length} skipped</div>
        </td></tr>
        <tr><td style="padding:20px 24px;font-size:13px;">
          ${
            sentRows
              ? `<div style="font-weight:700;margin-bottom:8px;color:#1a3470;">Sent</div>
                 <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
                   <thead><tr style="background:#F8F9FA;text-align:left;">
                     <th style="padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Email</th>
                     <th style="padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Vehicle</th>
                     <th style="padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Since upload</th>
                   </tr></thead>
                   <tbody style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${sentRows}</tbody>
                 </table>`
              : ""
          }
          ${
            skippedRows
              ? `<div style="font-weight:700;margin-bottom:8px;color:#1a3470;">Skipped</div>
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
    `RightOffer · Annual re-audits · ${todayIst} IST`,
    `${sentRecords.length} sent · ${skippedRecords.length} skipped`,
    ``,
    ...(sentRecords.length
      ? [
          `Sent:`,
          ...sentRecords.map(
            (r) =>
              `  - ${r.email} · ${r.vehicleLabel} · ${r.daysSinceUpload}d since upload`
          ),
          ``,
        ]
      : []),
    ...(skippedRecords.length
      ? [
          `Skipped:`,
          ...skippedRecords.map((r) => `  - ${r.email} · ${r.reason}`),
        ]
      : []),
  ].join("\n");

  await resend.emails.send({
    from: DIGEST_FROM,
    to: FOUNDER_EMAIL,
    subject: `RightOffer · ${sentRecords.length} annual re-audit${sentRecords.length === 1 ? "" : "s"} sent`,
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
