/**
 * GET /api/me/export — DPDP §11 data portability right.
 *
 * Returns every piece of personal data we hold about the signed-in
 * customer as a single structured JSON file. Triggered from the
 * /me → Data & Consent surface as a "Download my data" button.
 *
 * What's included:
 *   · The User row (account email, name, provider, consent timestamps)
 *   · Every ParsedPolicy row owned by this email (one row per uploaded
 *     document — vehicle, IDV, add-ons, owner, premium breakdown)
 *   · Every PolicyReport row linked to those policies (the audit
 *     content, recommendations, IDV check, key takeaway, etc.)
 *   · Every RenewalSubscription row tied to those policies
 *   · Every ComparisonReport row owned by this email (quote
 *     comparison runs)
 *
 * What's NOT included:
 *   · Internal session tokens / cookies (security)
 *   · Other customers' data (obviously)
 *   · Anonymised aggregate analytics (no longer personal)
 *   · System logs (technical, not user-facing)
 *
 * Auth model:
 *   · Requires a verified session — either the full magic-link / OAuth
 *     session (lib/session.ts) or the narrower upload-session
 *     (lib/upload-session.ts). Upload-session users get only the data
 *     scoped to docs they uploaded in this browser; full session users
 *     get everything tied to their email.
 *
 * Response: application/json with a Content-Disposition header so the
 * browser saves it as a file rather than rendering inline.
 */

import { NextResponse } from "next/server";
import { findOne, readTable, Tables } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import type {
  ComparisonReport,
  ParsedPolicy,
  PolicyReport,
  RenewalSubscription,
  User,
} from "@/lib/types";

export const runtime = "nodejs";

interface UserWithMeta extends User {
  name?: string;
  authMethod?: string;
  providerUserId?: string;
  lastSignedInAt?: string;
}

export async function GET() {
  // Auth — accept either full session OR upload-session.
  const fullSessionEmail = await getSession();
  const uploadSession = fullSessionEmail
    ? null
    : await getUploadSession();
  const sessionEmail = fullSessionEmail ?? uploadSession?.email ?? null;
  if (!sessionEmail) {
    return NextResponse.json(
      { error: "Not signed in" },
      { status: 401 }
    );
  }
  const email = sessionEmail.toLowerCase();
  // Upload-session users get scoped data only (only the docs in their
  // browser cookie). Full session users get everything by email.
  const scopedDocIds = uploadSession
    ? new Set(uploadSession.docs)
    : null;

  // User row by email
  const user = await findOne<UserWithMeta>(
    Tables.USERS,
    (u) => (u.email ?? "").toLowerCase() === email
  );

  // ParsedPolicy rows — every doc owned by this email (or scoped to
  // this browser if only upload-session).
  const allPolicies = await readTable<ParsedPolicy>(Tables.PARSED_POLICIES);
  const policies = allPolicies.filter((p) => {
    const ownerMatch = (p.owner?.email ?? "").toLowerCase() === email;
    if (!ownerMatch) return false;
    if (scopedDocIds) return scopedDocIds.has(p.id);
    return true;
  });
  const policyIds = new Set(policies.map((p) => p.id));

  // PolicyReport rows — every audit linked to one of those policies.
  const allReports = await readTable<PolicyReport>(Tables.REPORTS);
  const reports = allReports.filter((r) => policyIds.has(r.parsedPolicyId));

  // RenewalSubscription rows — reminders tied to these policies.
  const allSubs = await readTable<RenewalSubscription>(
    Tables.RENEWAL_SUBSCRIPTIONS
  );
  const subs = allSubs.filter(
    (s) =>
      (s.customerEmail ?? "").toLowerCase() === email &&
      policyIds.has(s.parsedPolicyId)
  );

  // ComparisonReport rows — quote comparison runs owned by this email.
  const allComparisons = await readTable<ComparisonReport>(
    Tables.COMPARISONS
  );
  const comparisons = allComparisons.filter(
    (c) => (c.customerEmail ?? "").toLowerCase() === email
  );

  const payload = {
    exportedAt: new Date().toISOString(),
    exportedFor: email,
    scope: scopedDocIds ? "upload-session" : "full-session",
    account: user
      ? {
          email: user.email,
          name: user.name ?? null,
          authMethod: user.authMethod ?? "magic-link",
          createdAt: user.createdAt,
          lastSignedInAt: user.lastSignedInAt ?? null,
          dpdpConsentGivenAt: user.dpdpConsentGivenAt ?? null,
          mobile: user.mobile || null,
        }
      : null,
    policies,
    reports,
    renewalSubscriptions: subs,
    comparisons,
    notes: [
      "This export is generated under your DPDP right to data portability.",
      "Anonymised aggregate analytics derived from your data (which are no longer personal) are not included.",
      "Internal system logs and session tokens are not included.",
      "Need anything else? Email grievance@rightoffer.in",
    ],
  };

  const filename = `rightoffer-data-export-${email.replace(/[^a-z0-9.@_-]/gi, "_")}-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
