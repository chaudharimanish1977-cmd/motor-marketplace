import { redirect } from "next/navigation";
import {
  Car,
  Bell,
  BellOff,
  Calendar,
  FileText,
  Upload,
  ShieldCheck,
  Receipt,
  Archive,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import { readTable, Tables } from "@/lib/db";
import type {
  ParsedPolicy,
  PolicyReport,
  RenewalSubscription,
} from "@/lib/types";
import { formatDateShort, formatINR } from "@/lib/format";
import { policyGroupKey } from "@/lib/policy-group";
import { BrandBlobs } from "@/components/brand-blobs";
import { LoadingLink } from "@/components/loading-link";
import { ReminderToggle } from "./reminder-toggle";
import { ReminderSchedule } from "./reminder-schedule";
import { SignOutButton } from "./sign-out-button";
import { DeleteAccountCard } from "./delete-account-card";
import { DeletePolicyButton } from "./delete-policy-button";
import { RunComparisonButton } from "./run-comparison-button";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your policies — RightOffer",
  robots: { index: false, follow: false },
};

type CardBucket = "active" | "quote" | "expired";

interface PortalPolicy {
  parsed: ParsedPolicy;
  report: PolicyReport | null;
  subscription: RenewalSubscription | null;
  daysUntilExpiry: number;
  bucket: CardBucket;
  /**
   * Every parsed-policy record in this card's group, ordered most-
   * recent-upload first. Used by the per-card delete control to
   * surface the underlying records so the customer can pick which
   * to remove (e.g. delete the misclassified renewal-notice but
   * keep the bound policy).
   */
  groupRecords: ParsedPolicy[];
}

/**
 * Customer portal home. Lists every policy linked to the signed-in
 * email (subscriptions + parsed-policy owner.email match) sorted by
 * upcoming expiry. Each card surfaces the actions the customer
 * actually needs at this point in the lifecycle:
 *
 *   - View the live report (links to existing /report/[id])
 *   - Pause / resume renewal reminders (per-policy toggle)
 *   - Upload a fresh policy when renewal time comes (top-level CTA)
 *
 * Auth gate: redirect to /me/login if no valid session cookie.
 * Email comparison is always lowercased — the cookie holds the
 * normalised form so the DB-side join needs to match.
 */
export default async function PortalHome() {
  const fullSessionEmail = await getSession();
  // If no full session, try the upload session — narrower scope (only
  // docs uploaded in this browser) but enough to give the customer
  // their just-uploaded reports + comparator without forcing them to
  // wait for the magic-link email to arrive.
  const uploadSession = fullSessionEmail
    ? null
    : await getUploadSession();
  const sessionEmail = fullSessionEmail ?? uploadSession?.email ?? null;
  if (!sessionEmail) redirect("/me/login");

  const isUnverified = !fullSessionEmail && !!uploadSession;
  const scopedDocIds = isUnverified
    ? new Set(uploadSession?.docs ?? [])
    : null;

  const allPolicies = await loadPoliciesFor(sessionEmail);
  // In upload-session mode, intersect to only the docs in this
  // browser's cookie. Full session sees everything matching the
  // email (broader access).
  const policies = scopedDocIds
    ? allPolicies.filter((p) =>
        p.groupRecords.some((r) => scopedDocIds.has(r.id))
      )
    : allPolicies;

  const active = policies.filter((p) => p.bucket === "active");
  const quotes = policies.filter((p) => p.bucket === "quote");
  const expired = policies.filter((p) => p.bucket === "expired");

  // The "Get a fresh review" CTA pre-fills the upload from the most
  // recent ACTIVE policy. Falling back to expired (so a customer whose
  // policy just lapsed still gets a personalised renewal) — never a
  // quote (it isn't a policy yet, no point renewing it).
  const renewalSeed = active[0]?.parsed.id ?? expired[0]?.parsed.id ?? null;

  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-screen px-4 py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          {/* Header strip */}
          <div className="flex items-start justify-between mb-8 gap-4">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-deepblue bg-blue-50 border border-blue-100 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Your portal
              </span>
              <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-brand-charcoal">
                Your policies
              </h1>
              <p className="mt-1.5 text-sm text-brand-slate">
                {isUnverified ? "Browsing as " : "Signed in as "}
                <span className="font-semibold text-brand-charcoal">
                  {sessionEmail}
                </span>
              </p>
            </div>
            <SignOutButton />
          </div>

          {/* Soft notice when the customer is on the upload-session
              (typed-but-not-verified). Tells them what they need to do
              to unlock full access (click the magic link in their
              inbox) without being a hard wall. */}
          {isUnverified && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 flex items-start gap-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-semibold text-brand-charcoal">
                  Showing documents from this browser only
                </div>
                <p className="text-xs text-brand-slate mt-1 leading-relaxed">
                  We sent a sign-in link to{" "}
                  <span className="font-mono text-brand-charcoal">
                    {sessionEmail}
                  </span>
                  . Click it to unlock your full portal across any
                  device + enable PDF downloads.
                </p>
              </div>
            </div>
          )}

          {policies.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-8">
              <Section
                title="Active policies"
                subtitle="Currently in force. Renewal reminders fire from these."
                icon={ShieldCheck}
                tone="success"
                emptyHint="No active policies — upload your current policy below to add one."
                policies={active}
              />
              {quotes.length > 0 && (
                <Section
                  title="Quotes & renewal notices"
                  subtitle="Not yet bound. No reminders fire from these — once you receive the bound policy, upload that and it'll move to Active."
                  icon={Receipt}
                  tone="info"
                  policies={quotes}
                />
              )}
              {/* Comparator CTA — surfaces when the customer has at
                  least one quote. Sends canonical (latest-parse) IDs
                  per group so duplicate uploads don't double-compare. */}
              {quotes.length > 0 && (
                <ComparisonLauncher
                  quoteIds={quotes.map((q) => q.parsed.id)}
                  policyId={active[0]?.parsed.id}
                />
              )}
              {expired.length > 0 && (
                <Section
                  title="Expired"
                  subtitle="Past policies, kept here for reference. Reports remain viewable."
                  icon={Archive}
                  tone="muted"
                  policies={expired}
                />
              )}
            </div>
          )}

          {/* Footer CTA — always visible, encourages renewal upload.
              When the customer has at least one prior ACTIVE policy, we
              pass it as `?renewal=<id>` so the upload page can welcome
              them by vehicle and link the new parse back to their
              account. Quotes are excluded from this seed — a quote is
              not "the policy you're renewing." */}
          <div className="mt-10 rounded-2xl bg-gradient-to-br from-brand-deepblue to-brand-electricblue text-white p-6 md:p-8 text-center shadow-soft">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Up for renewal soon?
            </h2>
            <p className="mt-2 text-sm md:text-base opacity-90 max-w-md mx-auto leading-relaxed">
              Upload your latest renewal quote and we&rsquo;ll review this
              year&rsquo;s coverage — under 2 minutes, completely free.
            </p>
            <LoadingLink
              href={renewalSeed ? `/upload?renewal=${renewalSeed}` : "/upload"}
              spinnerPosition="right"
              className="mt-5 inline-flex items-center justify-center gap-2 px-7 py-3 bg-brand-orange hover:brightness-110 text-white font-semibold rounded-2xl shadow-glow transition-all"
            >
              <Upload className="w-4 h-4" />
              Get a fresh review
            </LoadingLink>
          </div>

          {/* Account controls — quiet, separate from the policy list.
              Delete-everything is a full-account action: only show it
              when the customer is verified (full session). On the
              upload-session we can't be sure the email is really theirs. */}
          {!isUnverified && (
            <div className="mt-10">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-slate mb-3">
                Account
              </div>
              <DeleteAccountCard email={sessionEmail} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// ----------------------------------------------------------------------------
// Data assembly
// ----------------------------------------------------------------------------

async function loadPoliciesFor(email: string): Promise<PortalPolicy[]> {
  const target = email.toLowerCase();
  const [policies, reports, subs] = await Promise.all([
    readTable<ParsedPolicy>(Tables.PARSED_POLICIES),
    readTable<PolicyReport>(Tables.REPORTS),
    readTable<RenewalSubscription>(Tables.RENEWAL_SUBSCRIPTIONS),
  ]);

  // All subscriptions owned by this customer, indexed by their target
  // policyId so we can match siblings within a group below.
  const subByPolicy = new Map<string, RenewalSubscription>();
  for (const s of subs) {
    if ((s.customerEmail ?? "").toLowerCase() === target) {
      subByPolicy.set(s.parsedPolicyId, s);
    }
  }

  const reportByPolicy = new Map<string, PolicyReport>();
  for (const r of reports) {
    reportByPolicy.set(r.parsedPolicyId, r);
  }

  // 1. Pre-filter to "policies this customer can see" — either the
  //    owner email matches, or they have a subscription on it.
  const mine = policies.filter((p) => {
    const ownerMatch = (p.owner?.email ?? "").toLowerCase() === target;
    const subMatch = subByPolicy.has(p.id);
    return ownerMatch || subMatch;
  });

  // 2. Bucket by policyGroupKey so duplicate parses of the same
  //    physical car-period collapse into one card. Picking the
  //    "canonical" parse for the card: the most recently uploaded.
  //    Picking the subscription to surface on the card: prefer an
  //    active one in the group (so the toggle shows "Pause" rather
  //    than "Resume" when even one sibling is still active),
  //    otherwise fall back to any. Toggling that subscription
  //    cascades to all siblings server-side — see /api/me/reminders.
  const groups = new Map<string, ParsedPolicy[]>();
  for (const p of mine) {
    const key = policyGroupKey(p);
    const arr = groups.get(key) ?? [];
    arr.push(p);
    groups.set(key, arr);
  }

  const now = Date.now();
  const cards: PortalPolicy[] = Array.from(groups.values()).map((group) => {
    const sorted = [...group].sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    const canonical = sorted[0];

    // Pick the subscription to expose on the card.
    const groupSubs = group
      .map((p) => subByPolicy.get(p.id))
      .filter((s): s is RenewalSubscription => !!s);
    const exposedSub =
      groupSubs.find((s) => s.status === "active") ?? groupSubs[0] ?? null;

    const expiryMs = new Date(canonical.odPeriodEnd).getTime();
    const daysUntilExpiry = Math.ceil(
      (expiryMs - now) / (24 * 60 * 60 * 1000)
    );

    // Bucket by document type first, then by date:
    //   quote   -> always "quote" (regardless of expiry — a quote's
    //              date is the proposed coverage window, not a binding)
    //   policy  -> "active" if odPeriodEnd >= today, else "expired"
    const docType: "policy" | "quote" =
      canonical.documentType ?? "policy";
    const bucket: CardBucket =
      docType === "quote"
        ? "quote"
        : daysUntilExpiry < 0
          ? "expired"
          : "active";

    return {
      parsed: canonical,
      report: reportByPolicy.get(canonical.id) ?? null,
      subscription: exposedSub,
      daysUntilExpiry,
      bucket,
      groupRecords: sorted,
    };
  });

  // 3. Within each bucket, sort sensibly:
  //    active   -> soonest-to-expire first
  //    quote    -> soonest-to-expire first (quote's coverage start date)
  //    expired  -> most-recently-expired first
  cards.sort((a, b) => {
    if (a.bucket !== b.bucket) return 0; // bucketing happens at render
    if (a.bucket === "expired") {
      return b.daysUntilExpiry - a.daysUntilExpiry;
    }
    return a.daysUntilExpiry - b.daysUntilExpiry;
  });

  return cards;
}

// ----------------------------------------------------------------------------
// UI bits
// ----------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="bg-white border border-brand-light-gray rounded-2xl shadow-soft p-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 text-brand-deepblue flex items-center justify-center">
        <Car className="w-7 h-7" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-brand-charcoal tracking-tight">
        No policies yet
      </h2>
      <p className="mt-2 text-sm text-brand-slate max-w-sm mx-auto leading-relaxed">
        We couldn&rsquo;t find any policies linked to this email. Upload one
        to get your first free review — it takes under 2 minutes.
      </p>
      <LoadingLink
        href="/upload"
        spinnerPosition="right"
        className="mt-5 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-orange hover:brightness-110 text-white font-semibold text-sm rounded-xl shadow-glow transition-all"
      >
        <Upload className="w-4 h-4" />
        Upload a policy
      </LoadingLink>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  tone,
  emptyHint,
  policies,
}: {
  title: string;
  subtitle: string;
  icon: typeof ShieldCheck;
  tone: "success" | "info" | "muted";
  emptyHint?: string;
  policies: PortalPolicy[];
}) {
  const toneCls =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : tone === "info"
        ? "bg-blue-50 text-brand-deepblue border-blue-100"
        : "bg-slate-50 text-brand-slate border-brand-light-gray";

  return (
    <section>
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] rounded-full border ${toneCls}`}
        >
          <Icon className="w-3 h-3" />
          {title}
        </span>
        <span className="text-[10px] text-brand-slate tabular-nums">
          {policies.length}
        </span>
      </div>
      <p className="text-xs text-brand-slate mb-3 leading-relaxed">
        {subtitle}
      </p>
      {policies.length === 0 && emptyHint ? (
        <div className="bg-white border border-dashed border-brand-light-gray rounded-2xl p-5 text-center text-xs text-brand-slate">
          {emptyHint}
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((p) => (
            <PolicyCard key={p.parsed.id} policy={p} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * "Run Right Offer comparison" CTA card. Visible when the customer
 * has at least one quote uploaded. Picks the latest-parse active
 * policy (if any) as the anchor so the comparator uses the richest
 * profile for RCP generation.
 */
function ComparisonLauncher({
  quoteIds,
  policyId,
}: {
  quoteIds: string[];
  policyId?: string;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-deepblue to-brand-electricblue text-white p-5 md:p-6 shadow-soft">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-90">
            Compare your quotes
          </div>
          <h3 className="mt-1 text-lg md:text-xl font-bold tracking-tight">
            Score them against the Right Offer profile
          </h3>
          <p className="mt-1.5 text-sm opacity-90 leading-relaxed">
            {policyId
              ? "We'll score every quote against what your car actually needs — and tell you straight if one of them is already the Right Offer for you."
              : "We'll infer your car's profile from the quotes and surface which one is genuinely best — or tell you what's missing across all of them."}
          </p>
        </div>
        <RunComparisonButton quoteIds={quoteIds} policyId={policyId} />
      </div>
    </div>
  );
}

function PolicyCard({ policy }: { policy: PortalPolicy }) {
  const { parsed, report, subscription, daysUntilExpiry, bucket, groupRecords } =
    policy;
  const vehicleLabel = `${parsed.vehicle.make} ${parsed.vehicle.model}`.trim();
  const isQuote = bucket === "quote";
  const isExpired = bucket === "expired";
  const isSoon = bucket === "active" && daysUntilExpiry <= 60;

  // Bucket-driven status pill. Quotes are distinct from both active
  // and expired — they aren't bound, so neither "active" nor
  // "expired" applies semantically.
  const statusPill = isQuote
    ? { label: "Quote", cls: "bg-blue-50 text-brand-deepblue border-blue-100" }
    : isExpired
      ? {
          label: "Expired",
          cls: "bg-rose-50 text-rose-700 border-rose-100",
        }
      : isSoon
        ? {
            label: `${daysUntilExpiry}d to expiry`,
            cls: "bg-amber-50 text-amber-700 border-amber-100",
          }
        : {
            label: "Active",
            cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
          };

  // The "Expires" fact reads weirdly for quotes (the date is when
  // coverage *would start* if you bound it, not an expiry). Rebrand
  // the label per bucket.
  const dateFactLabel = isQuote ? "Period ends" : "Expires";

  return (
    <div className="bg-white rounded-2xl border border-brand-light-gray shadow-soft overflow-hidden">
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="font-bold text-brand-charcoal text-lg leading-tight">
              {vehicleLabel}
            </div>
            <div className="text-xs text-brand-slate mt-0.5">
              {parsed.vehicle.variant}
              {parsed.vehicle.registrationNumber
                ? ` · ${parsed.vehicle.registrationNumber}`
                : ""}
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] rounded-full border ${statusPill.cls}`}
          >
            {statusPill.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-brand-light-gray">
          <Fact
            icon={Calendar}
            label={dateFactLabel}
            value={formatDateShort(parsed.odPeriodEnd)}
          />
          <Fact icon={ShieldCheck} label="IDV" value={formatINR(parsed.idv)} />
          <Fact
            icon={FileText}
            label="Insurer"
            value={parsed.insurerName.split(" ").slice(0, 2).join(" ")}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-brand-light-gray space-y-3">
          {/* Reminder status row — three distinct messages by bucket */}
          <div className="flex items-center gap-2 text-xs">
            {isQuote ? (
              <span className="inline-flex items-center gap-1.5 text-brand-slate">
                <BellOff className="w-3.5 h-3.5" />
                Reminders don&rsquo;t apply to quotes
              </span>
            ) : isExpired ? (
              <span className="inline-flex items-center gap-1.5 text-brand-slate">
                <BellOff className="w-3.5 h-3.5" />
                Policy expired — reminders not active
              </span>
            ) : subscription ? (
              subscription.status === "active" ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <Bell className="w-3.5 h-3.5" />
                  Renewal reminders on
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-brand-slate">
                  <BellOff className="w-3.5 h-3.5" />
                  Reminders paused
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 text-brand-slate">
                <BellOff className="w-3.5 h-3.5" />
                No reminders set
              </span>
            )}
          </div>

          {/* Schedule summary + inline editor — only for ACTIVE-bucket
              cards. Quotes don't drive reminders (no semantic meaning
              for "60 days before quote expiry"); expired policies are
              past the renewal window. Both hide the controls to keep
              the card focused on what's relevant: View report. */}
          {bucket === "active" && subscription && (
            <ReminderSchedule
              subscriptionId={subscription.id}
              policyExpiryDate={subscription.policyExpiryDate}
              daysBefore={subscription.daysBefore}
              nudgesFired={subscription.nudgesFired ?? []}
              channels={subscription.channels ?? ["email"]}
              paused={subscription.status !== "active"}
            />
          )}

          {/* Action row */}
          <div className="flex items-center justify-end gap-2 flex-wrap">
            {bucket === "active" && subscription && (
              <ReminderToggle
                subscriptionId={subscription.id}
                initialStatus={subscription.status}
              />
            )}
            {report && (
              <LoadingLink
                href={`/report/${parsed.id}`}
                spinnerPosition="right"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-deepblue px-3 py-1.5 rounded-xl border border-brand-deepblue/30 hover:bg-blue-50 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                View report
              </LoadingLink>
            )}
            <DeletePolicyButton
              vehicleLabel={vehicleLabel}
              records={groupRecords.map((p) => ({
                id: p.id,
                uploadedAt: p.uploadedAt,
                fileName: p.uploadedPdfFileName,
                policyNumber: p.policyNumber,
                documentType: p.documentType ?? "policy",
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-slate flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-sm font-bold text-brand-charcoal mt-0.5 truncate">
        {value}
      </div>
    </div>
  );
}
