import { redirect } from "next/navigation";
import { Upload } from "lucide-react";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import { findOne, readTable, Tables } from "@/lib/db";
import type {
  ParsedPolicy,
  PolicyReport,
  RenewalSubscription,
  User,
} from "@/lib/types";
import { formatDateShort, formatINR } from "@/lib/format";
import { policyGroupKey } from "@/lib/policy-group";
import { computeLifecycleState } from "@/lib/lifecycle-state";
import { LoadingLink } from "@/components/loading-link";
import { ReminderToggle } from "./reminder-toggle";
import { ReminderSchedule } from "./reminder-schedule";
import { SignOutButton } from "./sign-out-button";
import { DeleteAccountCard } from "./delete-account-card";
import { DataConsentCard } from "./data-consent-card";
import { FleetSummary } from "./fleet-summary";
import { MeOnboardingPanel } from "./me-onboarding-panel";
import { PwaInstallCta } from "@/components/pwa-install-cta";
import { isMarketplaceEnabled } from "@/lib/feature-flags";
import { DeletePolicyButton } from "./delete-policy-button";
import { RunComparisonButton } from "./run-comparison-button";
import { INSIGHT_CATALOGUE } from "@/lib/insights/catalogue";
import {
  buildCustomerContext,
  matchAllInsights,
} from "@/lib/insights/matcher";
import type { Insight } from "@/lib/insights/types";

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
   * to remove.
   */
  groupRecords: ParsedPolicy[];
}

/**
 * Customer portal home — editorial redesign. Lists every policy
 * linked to the signed-in email (subscriptions + parsed-policy owner.email
 * match), sorted by upcoming expiry. Three buckets: active, quotes,
 * expired. Renewal reminders fire from active policies.
 *
 * Design vocabulary matches the report + privacy + share surfaces:
 * mono kickers, serif headings with italic-plum accents, hairline
 * rules, functional palette (sage / plum / alert / slate). No card
 * frames, no shadows, no gradients.
 */
export default async function PortalHome() {
  const fullSessionEmail = await getSession();
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
  const userRow = await findOne<User>(
    Tables.USERS,
    (u) => (u.email ?? "").toLowerCase() === sessionEmail.toLowerCase()
  );
  const policies = scopedDocIds
    ? allPolicies.filter((p) =>
        p.groupRecords.some((r) => scopedDocIds.has(r.id))
      )
    : allPolicies;

  // Match the global insight catalogue against each policy the
  // customer owns, dedupe by id. Surfaces an "X insights waiting"
  // link in the masthead when the matched set is non-empty.
  const matchedInsights = new Map<string, Insight>();
  for (const portalPolicy of policies) {
    const ctx = buildCustomerContext(portalPolicy.parsed);
    for (const insight of matchAllInsights(INSIGHT_CATALOGUE, ctx)) {
      if (!matchedInsights.has(insight.id)) {
        matchedInsights.set(insight.id, insight);
      }
    }
  }
  const insightCount = matchedInsights.size;
  const hasUrgentInsight = Array.from(matchedInsights.values()).some(
    (i) => i.urgent
  );

  const active = policies.filter((p) => p.bucket === "active");
  const quotes = policies.filter((p) => p.bucket === "quote");
  const expired = policies.filter((p) => p.bucket === "expired");

  const renewalSeed = active[0]?.parsed.id ?? expired[0]?.parsed.id ?? null;

  // First-visit onboarding. Shows ONLY when:
  //   · The customer has a full verified session (not upload-session
  //     only) — the User row is the source of truth for the
  //     dismissed flag.
  //   · The User row exists AND its `meOnboardedAt` is unset.
  // After they tap "Got it" the panel POSTs to /api/me/onboarding/done
  // which stamps the timestamp; this server render then re-evaluates
  // and the panel disappears for all future visits, on any device.
  const showOnboarding =
    !isUnverified && !!userRow && !userRow.meOnboardedAt;
  // Pick the active subscription to wire the "Preview the email"
  // affordance — first active one in any active policy. If the
  // customer hasn't uploaded anything yet (fresh OAuth signin), this
  // is undefined and the panel hides the preview link.
  const previewSubscriptionId =
    active.find((p) => p.subscription?.status === "active")
      ?.subscription?.id;

  return (
    <main className="relative z-10 min-h-screen px-5 md:px-6 py-10 md:py-14">
        <article className="max-w-3xl mx-auto font-serif text-brand-charcoal">
          {/* Masthead */}
          <header className="border-b border-brand-charcoal/15 pb-6 mb-8">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
              · Your portal ·
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="font-serif font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
                  Your <span className="italic text-brand-plum">policies</span>
                </h1>
                <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
                  {isUnverified ? "Browsing as " : "Signed in as "}
                  <span className="font-bold text-brand-charcoal">
                    {sessionEmail}
                  </span>
                </p>
              </div>
              <SignOutButton />
            </div>
          </header>

          {/* Upload-session soft notice */}
          {isUnverified && (
            <div className="mb-6 pl-4 border-l-2 border-brand-plum/60">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] font-bold text-brand-plum">
                · Showing documents from this browser only ·
              </div>
              <p className="mt-1.5 font-serif italic text-[14px] text-brand-slate leading-relaxed max-w-xl">
                We sent a sign-in link to{" "}
                <span className="not-italic font-mono text-brand-charcoal">
                  {sessionEmail}
                </span>
                . Click it to unlock your full portal across any device
                + enable PDF downloads.
              </p>
            </div>
          )}

          {/* First-visit onboarding — fires only on the customer's first
              landing inside /me, persists dismissal on the User row so
              it never shows again on any device. */}
          {showOnboarding && (
            <MeOnboardingPanel
              firstName={userRow.name}
              vehicleCount={policies.length}
              testSubscriptionId={previewSubscriptionId}
            />
          )}

          {/* Insights entry-point. Verified session only + at least one
              match. Editorial chip — plum left-rule, mono kicker —
              keeps gravity without competing with the policies list.
              Urgent matches flip the rule + kicker to alert tone. */}
          {!isUnverified && insightCount > 0 && (
            <LoadingLink
              href="/me/insights"
              className={`mb-6 block pl-4 py-2 border-l-2 ${
                hasUrgentInsight
                  ? "border-brand-alert"
                  : "border-brand-plum"
              } hover:bg-brand-offwhite/40 transition-colors group`}
            >
              <div
                className={`font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold ${
                  hasUrgentInsight ? "text-brand-alert" : "text-brand-plum"
                }`}
              >
                ·{" "}
                {hasUrgentInsight ? "Urgent update" : "Insights for your car"}
                {" ·"}
              </div>
              <div className="mt-1 font-serif text-[15px] md:text-[16px] text-brand-charcoal">
                <span className="font-semibold tabular-nums">
                  {insightCount}
                </span>{" "}
                {insightCount === 1 ? "insight" : "insights"} matched to
                your profile{" "}
                <span className="italic text-brand-plum group-hover:underline">
                  Read them →
                </span>
              </div>
            </LoadingLink>
          )}

          {policies.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-10">
              {/* Fleet aggregation — editorial already (Phase 7e). */}
              {!isUnverified && (
                <FleetSummary policies={policies} active={active} />
              )}
              <Section
                title="Active policies"
                subtitle="Currently in force. Renewal reminders fire from these."
                tone="sage"
                emptyHint="No active policies — upload your current policy below to add one."
                policies={active}
              />
              {quotes.length > 0 && (
                <Section
                  title="Quotes & renewal notices"
                  subtitle="Not yet bound. No reminders fire from these — once you receive the bound policy, upload that and it'll move to Active."
                  tone="plum"
                  policies={quotes}
                />
              )}
              {/* Comparator CTA — surfaces with at least one quote.
                  Phase 1 segregation: hidden in production until the
                  marketplace flow ships in V2. The whole pull-quote
                  block goes (kicker + copy + button) so customers don't
                  see "Compare your quotes" promises we don't fulfil yet. */}
              {quotes.length > 0 && isMarketplaceEnabled() && (
                <ComparisonLauncher
                  quoteIds={quotes.map((q) => q.parsed.id)}
                  policyId={active[0]?.parsed.id}
                />
              )}
              {expired.length > 0 && (
                <>
                  <Section
                    title="Expired"
                    subtitle="Past policies, kept here for reference. Reports remain viewable."
                    tone="slate"
                    policies={expired}
                  />
                  {/* Caring nudge — anchored to the Expired section
                      because that's where it semantically belongs.
                      Fires when the customer has at least one expired
                      policy (regardless of whether they also have
                      active ones — a multi-car household can have
                      both). */}
                  <LapsedHandback
                    referencePolicyId={expired[0]?.parsed.id}
                  />
                </>
              )}
            </div>
          )}

          {/* Footer renewal CTA — context-aware:
              · Customer with active policies → "Up for renewal soon?"
                framing, primary action is uploading a renewal QUOTE,
                secondary is uploading a fresh policy.
              · Customer with only expired (or only quotes / nothing
                active) → the Lapsed handback above already handles
                the messaging; the footer goes quiet with just a small
                "Upload something new" link. */}
          {active.length > 0 ? (
            <RenewalFooterCta renewalSeed={renewalSeed} />
          ) : (
            <QuietUploadCta />
          )}

          {/* PWA install nudge — self-hiding if not installable or
              already installed. Slots between the renewal CTA and the
              account controls so it's discoverable on every visit
              without dominating above-the-fold. */}
          {!isUnverified && (
            <div className="mt-14">
              <PwaInstallCta />
            </div>
          )}

          {/* Account controls — quiet, separate from the policy list */}
          {!isUnverified && (
            <div className="mt-14 pt-8 border-t border-brand-charcoal/15">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold text-brand-slate mb-5">
                · Account ·
              </div>
              <div className="space-y-6">
                <DataConsentCard
                  email={sessionEmail}
                  consentGivenAt={userRow?.dpdpConsentGivenAt ?? null}
                />
                <DeleteAccountCard email={sessionEmail} />
              </div>
            </div>
          )}
        </article>
    </main>
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

  const mine = policies.filter((p) => {
    const ownerMatch = (p.owner?.email ?? "").toLowerCase() === target;
    const subMatch = subByPolicy.has(p.id);
    return ownerMatch || subMatch;
  });

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

    const groupSubs = group
      .map((p) => subByPolicy.get(p.id))
      .filter((s): s is RenewalSubscription => !!s);
    const exposedSub =
      groupSubs.find((s) => s.status === "active") ?? groupSubs[0] ?? null;

    const expiryMs = new Date(canonical.odPeriodEnd).getTime();
    const daysUntilExpiry = Math.ceil(
      (expiryMs - now) / (24 * 60 * 60 * 1000)
    );

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

  cards.sort((a, b) => {
    if (a.bucket !== b.bucket) return 0;
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
    <div className="pl-4 py-2 border-l-2 border-brand-plum/60">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] font-bold text-brand-plum">
        · No policies yet ·
      </div>
      <p className="mt-2 font-serif italic text-[16px] md:text-[17px] text-brand-slate leading-relaxed max-w-md">
        We couldn&rsquo;t find any policies linked to this email.
        Upload one to get your first free review — it takes under
        2 minutes.
      </p>
      <LoadingLink
        href="/upload"
        spinnerPosition="right"
        className="mt-5 inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3.5 rounded-full font-serif italic font-medium text-[16px] min-h-[48px] hover:opacity-90 transition-opacity"
      >
        <Upload className="w-4 h-4" />
        Upload a policy <span aria-hidden>→</span>
      </LoadingLink>
    </div>
  );
}

function Section({
  title,
  subtitle,
  tone,
  emptyHint,
  policies,
}: {
  title: string;
  subtitle: string;
  tone: "sage" | "plum" | "slate";
  emptyHint?: string;
  policies: PortalPolicy[];
}) {
  const kickerCls =
    tone === "sage"
      ? "text-brand-sage"
      : tone === "plum"
        ? "text-brand-plum"
        : "text-brand-slate";

  return (
    <section>
      <div
        className={`font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold ${kickerCls}`}
      >
        · {title} ·{" "}
        <span className="text-brand-slate tabular-nums">
          {policies.length}
        </span>
        {" ·"}
      </div>
      <p className="mt-1.5 font-serif italic text-[13.5px] md:text-[14px] text-brand-slate leading-relaxed max-w-xl">
        {subtitle}
      </p>
      <div className="mt-4 border-t border-brand-charcoal/15">
        {policies.length === 0 && emptyHint ? (
          <p className="py-4 font-serif italic text-[13.5px] text-brand-slate leading-relaxed">
            {emptyHint}
          </p>
        ) : (
          policies.map((p) => <PolicyCard key={p.parsed.id} policy={p} />)
        )}
      </div>
    </section>
  );
}

/**
 * "Run Right Offer comparison" CTA. Editorial pull-quote section,
 * not a gradient card. Visible when the customer has at least one
 * quote uploaded; picks the latest-parse active policy (if any) as
 * the anchor so the comparator uses the richest profile for RCP.
 */
function ComparisonLauncher({
  quoteIds,
  policyId,
}: {
  quoteIds: string[];
  policyId?: string;
}) {
  return (
    <section className="pl-5 border-l-2 border-brand-plum">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold text-brand-plum">
        · Compare your quotes ·
      </div>
      <h3 className="mt-2 font-serif font-medium text-[22px] md:text-[26px] leading-[1.1] tracking-[-0.015em] text-brand-charcoal m-0">
        Score them against the{" "}
        <span className="italic text-brand-plum">Right Offer</span>{" "}
        profile.
      </h3>
      <p className="mt-3 font-serif text-[14.5px] md:text-[15.5px] leading-[1.6] text-brand-charcoal max-w-xl">
        {policyId
          ? "We'll score every quote against what your car actually needs — and tell you straight if one of them is already the Right Offer for you."
          : "We'll infer your car's profile from the quotes and surface which one is genuinely best — or tell you what's missing across all of them."}
      </p>
      <div className="mt-5">
        <RunComparisonButton quoteIds={quoteIds} policyId={policyId} />
      </div>
    </section>
  );
}

function PolicyCard({ policy }: { policy: PortalPolicy }) {
  const { parsed, report, subscription, daysUntilExpiry, bucket, groupRecords } =
    policy;
  const vehicleLabel = `${parsed.vehicle.make} ${parsed.vehicle.model}`.trim();
  const isQuote = bucket === "quote";

  const lifecycle = isQuote
    ? null
    : computeLifecycleState({
        startDate: parsed.odPeriodStart,
        endDate: parsed.odPeriodEnd,
      });

  // Editorial status kicker — replaces the rounded-full pill with a
  // mono-uppercase line in the functional palette.
  const status = isQuote
    ? { label: "Quote", tone: "slate" as const }
    : lifecycle?.state === "D"
      ? {
          label:
            typeof lifecycle.daysUntilExpiry === "number"
              ? `Lapsed · ${Math.abs(lifecycle.daysUntilExpiry)}d ago`
              : "Lapsed",
          tone: "alert" as const,
        }
      : lifecycle?.state === "A"
        ? {
            label: `Renewal · ${daysUntilExpiry}d to go`,
            tone: "plum" as const,
          }
        : lifecycle?.state === "C"
          ? { label: "Just bought", tone: "plum" as const }
          : { label: "Active", tone: "sage" as const };

  const statusCls =
    status.tone === "alert"
      ? "text-brand-alert"
      : status.tone === "plum"
        ? "text-brand-plum"
        : status.tone === "sage"
          ? "text-brand-sage"
          : "text-brand-slate";

  const dateFactLabel = isQuote ? "Period ends" : "Expires";

  return (
    <div className="py-6 md:py-7 border-b border-brand-charcoal/10 last:border-b-0">
      {/* Top row — vehicle + status kicker */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-serif font-semibold text-[20px] md:text-[22px] tracking-[-0.01em] text-brand-charcoal leading-tight">
            {vehicleLabel}
          </div>
          <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate tabular-nums">
            {parsed.vehicle.yearOfManufacture
              ? `${parsed.vehicle.yearOfManufacture}`
              : ""}
            {parsed.vehicle.registrationNumber
              ? ` · ${parsed.vehicle.registrationNumber}`
              : ""}
          </div>
        </div>
        <div
          className={`font-mono text-[10px] uppercase tracking-[0.16em] font-bold ${statusCls}`}
        >
          · {status.label} ·
        </div>
      </div>

      {/* Fact row */}
      <div className="mt-5 grid grid-cols-3 gap-x-4 gap-y-3">
        <Fact label={dateFactLabel} value={formatDateShort(parsed.odPeriodEnd)} />
        <Fact label="IDV" value={formatINR(parsed.idv)} />
        <Fact
          label="Insurer"
          value={parsed.insurerName.split(" ").slice(0, 2).join(" ")}
        />
      </div>

      {/* Reminder status row */}
      <div className="mt-5 pt-5 border-t border-brand-charcoal/10 space-y-4">
        <ReminderStatusLine
          isQuote={isQuote}
          lifecycleState={lifecycle?.state}
          subscription={subscription}
        />

        {/* Schedule summary + inline editor — only ACTIVE policies */}
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
        <div className="flex items-center justify-end gap-2 flex-wrap pt-1">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-plum hover:text-brand-plum text-brand-charcoal font-serif italic font-medium text-[13px] md:text-[14px] min-h-[36px] transition-colors"
            >
              View report <span aria-hidden>→</span>
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
  );
}

function ReminderStatusLine({
  isQuote,
  lifecycleState,
  subscription,
}: {
  isQuote: boolean;
  lifecycleState?: "A" | "B" | "C" | "D";
  subscription: RenewalSubscription | null;
}) {
  if (isQuote) {
    return (
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
        · Reminders don&rsquo;t apply to quotes ·
      </p>
    );
  }
  if (lifecycleState === "D") {
    return (
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
        · Policy lapsed · Reminders not active ·
      </p>
    );
  }
  if (!subscription) {
    return (
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
        · No reminders set ·
      </p>
    );
  }
  if (subscription.status === "active") {
    return (
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-success">
        · Renewal reminders on ·
      </p>
    );
  }
  return (
    <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
      · Reminders paused ·
    </p>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] font-bold text-brand-slate">
        · {label} ·
      </div>
      <div className="mt-0.5 font-serif font-semibold text-[15px] md:text-[16px] tabular-nums text-brand-charcoal truncate">
        {value}
      </div>
    </div>
  );
}

/**
 * LapsedHandback — caring nudge anchored to the Expired section.
 * Fires when the customer has at least one expired policy. Two soft
 * paths: (a) "you renewed elsewhere → bring it in", (b) "you
 * haven't renewed → please get cover first; legally required".
 * Primary action is filled plum (upload renewal); secondary is a
 * quiet outlined plum (help me get covered).
 */
function LapsedHandback({
  referencePolicyId,
}: {
  referencePolicyId?: string;
}) {
  const renewHref = referencePolicyId
    ? `/upload?renewal=${referencePolicyId}`
    : "/upload";
  return (
    <section className="mt-2 pl-5 border-l-2 border-brand-alert">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold text-brand-alert">
        · Heads up ·
      </div>
      <h3 className="mt-2 font-serif font-medium text-[22px] md:text-[26px] leading-[1.1] tracking-[-0.015em] text-brand-charcoal m-0">
        We hope your car&rsquo;s{" "}
        <span className="italic text-brand-plum">still covered.</span>
      </h3>
      <p className="mt-3 font-serif text-[14.5px] md:text-[15px] leading-[1.6] text-brand-charcoal max-w-xl">
        If you&rsquo;ve renewed elsewhere — welcome, that&rsquo;s fine
        — upload the new policy here and we&rsquo;ll review it. If you
        haven&rsquo;t renewed yet, please get cover first;
        third-party insurance is mandatory by law.
      </p>
      <div className="mt-5 flex items-center gap-3 flex-wrap">
        <LoadingLink
          href={renewHref}
          spinnerPosition="right"
          className="inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3.5 rounded-full font-serif italic font-medium text-[15px] min-h-[44px] hover:opacity-90 transition-opacity"
        >
          <Upload className="w-4 h-4" />
          Upload my new policy <span aria-hidden>→</span>
        </LoadingLink>
        <LoadingLink
          href="/upload"
          spinnerPosition="right"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-plum hover:text-brand-plum text-brand-charcoal font-serif italic font-medium text-[13px] md:text-[14px] min-h-[36px] transition-colors"
        >
          Help me get covered <span aria-hidden>→</span>
        </LoadingLink>
      </div>
    </section>
  );
}

/**
 * RenewalFooterCta — shown when the customer has at least one active
 * policy. Frames the upload as a renewal-quote action with a clear
 * primary/secondary split:
 *   Primary  (filled plum)  — Audit my renewal quote
 *   Secondary (quiet link)  — Or upload a new policy you've already bought
 * Both link to /upload?renewal=<id>; the same upload flow handles
 * "this is a quote" vs "this is a bound policy" via document-type
 * classification on parse.
 */
function RenewalFooterCta({ renewalSeed }: { renewalSeed: string | null }) {
  const href = renewalSeed ? `/upload?renewal=${renewalSeed}` : "/upload";
  return (
    <section className="mt-12 pl-5 border-l-2 border-brand-plum">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold text-brand-plum">
        · Up for renewal soon? ·
      </div>
      <h2 className="mt-2 font-serif font-medium text-[26px] md:text-[32px] leading-[1.1] tracking-[-0.015em] text-brand-charcoal m-0">
        Bring your latest{" "}
        <span className="italic text-brand-plum">renewal quote</span>{" "}
        and we&rsquo;ll review this year&rsquo;s cover.
      </h2>
      <p className="mt-3 font-serif italic text-[15px] md:text-[16px] text-brand-slate leading-relaxed max-w-md">
        Under 2 minutes. Completely free. No sales calls.
      </p>
      <div className="mt-5 flex items-center gap-4 flex-wrap">
        <LoadingLink
          href={href}
          spinnerPosition="right"
          className="inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3.5 rounded-full font-serif italic font-medium text-[16px] min-h-[48px] hover:opacity-90 transition-opacity"
        >
          <Upload className="w-4 h-4" />
          Audit my renewal quote <span aria-hidden>→</span>
        </LoadingLink>
        <LoadingLink
          href={href}
          spinnerPosition="right"
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-plum hover:underline"
        >
          · Or upload a new policy →
        </LoadingLink>
      </div>
      <p className="mt-4 font-serif italic text-[13.5px] text-brand-slate max-w-md">
        Or just forward the insurer email to{" "}
        <a
          href="mailto:review@rightoffer.in?subject=My%20renewal%20quote"
          className="not-italic text-brand-plum hover:underline"
        >
          review@rightoffer.in
        </a>{" "}
        — we&rsquo;ll read it and reply with the audit.
      </p>
    </section>
  );
}

/**
 * QuietUploadCta — shown to customers with no active policies (only
 * expired or quotes). The LapsedHandback above already carries the
 * caring framing + primary CTAs, so the footer here goes quiet — just
 * a small "Got something new to upload?" link to avoid duplicating
 * the message.
 */
function QuietUploadCta() {
  return (
    <section className="mt-12 pl-5 border-l-2 border-brand-charcoal/15">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] font-bold text-brand-slate">
        · Anything else to upload? ·
      </div>
      <p className="mt-2 font-serif italic text-[14px] text-brand-slate leading-relaxed max-w-md">
        A new policy, a renewal quote, an older policy worth keeping
        on file — drop it in and we&rsquo;ll review it.{" "}
        <LoadingLink
          href="/upload"
          className="not-italic text-brand-plum hover:underline"
        >
          Upload →
        </LoadingLink>
      </p>
      <p className="mt-2 font-serif italic text-[13.5px] text-brand-slate max-w-md">
        Or forward straight from your inbox to{" "}
        <a
          href="mailto:review@rightoffer.in"
          className="not-italic text-brand-plum hover:underline"
        >
          review@rightoffer.in
        </a>
        .
      </p>
    </section>
  );
}
