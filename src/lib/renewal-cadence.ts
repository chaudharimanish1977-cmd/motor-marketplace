/**
 * Renewal cadence engine.
 *
 * Generates the full 12-month nudge schedule for a customer based on policy
 * expiry date. Real channels (email/SMS/Telegram/WhatsApp) — but for the
 * prototype, no actual sends; we display the calendar so investors see the
 * data flywheel mechanic.
 *
 * Per the locked spec:
 *   60 / 30 / 15 / 7 / 1-day pre-expiry + post-expiry continuation +
 *   lapsed-buyer re-engagement loop ("congrats — share your new policy")
 */

import { randomUUID } from "crypto";
import type {
  ParsedPolicy,
  RenewalNudge,
  RenewalSchedule,
} from "@/lib/types";

interface NudgeTemplate {
  triggerType: RenewalNudge["triggerType"];
  daysOffset: number; // negative = before expiry, positive = after
  channel: RenewalNudge["channel"];
  subjectTemplate: string;
  bodyTemplate: string;
}

const NUDGE_TEMPLATES: NudgeTemplate[] = [
  {
    triggerType: "60_day_pre",
    daysOffset: -60,
    channel: "email",
    subjectTemplate: "{firstName}, your {vehicle} renewal is in 60 days",
    bodyTemplate:
      "Hi {firstName}, your {vehicle} insurance expires on {expiryDate}. Lock in the best price 60 days early — explore curated offers from 3+ insurers in 60 seconds.",
  },
  {
    triggerType: "30_day_pre",
    daysOffset: -30,
    channel: "sms",
    subjectTemplate: "Renewal reminder",
    bodyTemplate:
      "RightOffer: {vehicle} insurance renewal in 30 days. Get curated offers: rightoffer.in/r",
  },
  {
    triggerType: "15_day_pre",
    daysOffset: -15,
    channel: "telegram",
    subjectTemplate: "Renewal in 15 days",
    bodyTemplate:
      "Hi {firstName} 👋 Your {vehicle} insurance renewal is in 15 days. Last year's review showed 4 critical add-ons missing — let's make sure you're covered. Tap to see your curated offers.",
  },
  {
    triggerType: "7_day_pre",
    daysOffset: -7,
    channel: "email",
    subjectTemplate: "1 week to your {vehicle} renewal",
    bodyTemplate:
      "Hi {firstName}, your {vehicle} policy expires on {expiryDate}. Don't lose your NCB — renew this week. Your curated offers are pre-loaded; just tap to confirm.",
  },
  {
    triggerType: "1_day_pre",
    daysOffset: -1,
    channel: "sms",
    subjectTemplate: "Renewal tomorrow",
    bodyTemplate:
      "URGENT: {vehicle} insurance expires tomorrow ({expiryDate}). Renew in 60 sec to avoid lapse + losing NCB: motormart.in/r",
  },
  {
    triggerType: "expiry_day",
    daysOffset: 0,
    channel: "email",
    subjectTemplate: "Your {vehicle} policy expires today",
    bodyTemplate:
      "Today is the last day of your {vehicle} insurance. After today, lapse penalties apply and you lose your hard-earned NCB. Renew now in 60 seconds.",
  },
  {
    triggerType: "post_expiry_7",
    daysOffset: 7,
    channel: "sms",
    subjectTemplate: "Policy lapsed - act fast",
    bodyTemplate:
      "Your {vehicle} policy lapsed 7 days ago. Renew within 90 days to retain partial NCB. Don't drive uninsured — TP is mandatory by law.",
  },
  {
    triggerType: "post_expiry_30",
    daysOffset: 30,
    channel: "telegram",
    subjectTemplate: "Need help renewing?",
    bodyTemplate:
      "Hi {firstName} — noticed you haven't renewed your {vehicle} insurance. Did you buy elsewhere? We can help you save next year too. Share the new policy with us.",
  },
  {
    triggerType: "lapsed_recovery",
    daysOffset: 60,
    channel: "email",
    subjectTemplate: "Congratulations on your renewal! 🎉",
    bodyTemplate:
      "Hi {firstName}, hope you renewed your {vehicle} insurance with another provider. We'd love to keep helping you save — share your new policy copy and we'll set up smart reminders 60 days before next renewal so you're never without options.",
  },
];

export function generateRenewalSchedule(
  parsedPolicy: ParsedPolicy,
  policyExpiryDate: string
): RenewalSchedule {
  const expiry = new Date(policyExpiryDate);

  // Owner name handling — title-cased "Mr Dinesh Shyamlal Jaiswal" → "Dinesh"
  const nameParts = parsedPolicy.owner.name
    .replace(/^(Mr|Mrs|Ms|Dr|Smt|Shri)\s+/i, "")
    .split(/\s+/);
  const firstName =
    nameParts[0]?.charAt(0).toUpperCase() +
      nameParts[0]?.slice(1).toLowerCase() || "there";

  const vehicle = `${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}`;

  const nudges: RenewalNudge[] = NUDGE_TEMPLATES.map((tmpl) => {
    const date = new Date(expiry);
    date.setDate(date.getDate() + tmpl.daysOffset);
    const expiryDateStr = expiry.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return {
      id: randomUUID(),
      triggerType: tmpl.triggerType,
      scheduledDate: date.toISOString(),
      channel: tmpl.channel,
      subject: tmpl.subjectTemplate
        .replace("{firstName}", firstName)
        .replace("{vehicle}", vehicle),
      bodyPreview: tmpl.bodyTemplate
        .replace("{firstName}", firstName)
        .replace("{vehicle}", vehicle)
        .replace("{expiryDate}", expiryDateStr),
    };
  });

  return {
    id: randomUUID(),
    parsedPolicyId: parsedPolicy.id,
    policyExpiryDate,
    nudges,
    generatedAt: new Date().toISOString(),
  };
}
