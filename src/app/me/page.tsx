import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Car,
  Bell,
  BellOff,
  Calendar,
  FileText,
  LogOut,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { getSession } from "@/lib/session";
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
import { SignOutButton } from "./sign-out-button";
import { DeleteAccountCard } from "./delete-account-card";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your policies — RightOffer",
  robots: { index: false, follow: false },
};

interface PortalPolicy {
  parsed: ParsedPolicy;
  report: PolicyReport | null;
  subscription: RenewalSubscription | null;
  daysUntilExpiry: number;
  /**
   * How many earlier parses are silently grouped under this card.
   * Currently hidden from the UI — the count is reserved for a
   * future "show history" expander.
   */
  earlierParsesCount: number;
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
  const sessionEmail = await getSession();
  if (!sessionEmail) redirect("/me/login");

  const policies = await loadPoliciesFor(sessionEmail);

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
                Signed in as{" "}
                <span className="font-semibold text-brand-charcoal">
                  {sessionEmail}
                </span>
              </p>
            </div>
            <SignOutButton />
          </div>

          {policies.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {policies.map((p) => (
                <PolicyCard key={p.parsed.id} policy={p} />
              ))}
            </div>
          )}

          {/* Footer CTA — always visible, encourages renewal upload.
              When the customer has at least one prior policy, we pass it
              as `?renewal=<id>` so the upload page can welcome them by
              vehicle and link the new parse back to their account. */}
          <div className="mt-10 rounded-2xl bg-gradient-to-br from-brand-deepblue to-brand-electricblue text-white p-6 md:p-8 text-center shadow-soft">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Up for renewal soon?
            </h2>
            <p className="mt-2 text-sm md:text-base opacity-90 max-w-md mx-auto leading-relaxed">
              Upload your latest renewal quote and we&rsquo;ll review this
              year&rsquo;s coverage — under 2 minutes, completely free.
            </p>
            <LoadingLink
              href={
                policies.length > 0
                  ? `/upload?renewal=${policies[0].parsed.id}`
                  : "/upload"
              }
              spinnerPosition="right"
              className="mt-5 inline-flex items-center justify-center gap-2 px-7 py-3 bg-brand-orange hover:brightness-110 text-white font-semibold rounded-2xl shadow-glow transition-all"
            >
              <Upload className="w-4 h-4" />
              Get a fresh review
            </LoadingLink>
          </div>

          {/* Account controls — quiet, separate from the policy list */}
          <div className="mt-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-slate mb-3">
              Account
            </div>
            <DeleteAccountCard email={sessionEmail} />
          </div>
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

    return {
      parsed: canonical,
      report: reportByPolicy.get(canonical.id) ?? null,
      subscription: exposedSub,
      daysUntilExpiry,
      earlierParsesCount: group.length - 1,
    };
  });

  // 3. Soonest-to-expire first, expired pushed to the bottom.
  cards.sort((a, b) => {
    const aExpired = a.daysUntilExpiry < 0;
    const bExpired = b.daysUntilExpiry < 0;
    if (aExpired !== bExpired) return aExpired ? 1 : -1;
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

function PolicyCard({ policy }: { policy: PortalPolicy }) {
  const { parsed, report, subscription, daysUntilExpiry } = policy;
  const vehicleLabel = `${parsed.vehicle.make} ${parsed.vehicle.model}`.trim();
  const isExpired = daysUntilExpiry < 0;
  const isSoon = !isExpired && daysUntilExpiry <= 60;

  const statusPill = isExpired
    ? { label: "Expired", cls: "bg-rose-50 text-rose-700 border-rose-100" }
    : isSoon
      ? {
          label: `${daysUntilExpiry}d to expiry`,
          cls: "bg-amber-50 text-amber-700 border-amber-100",
        }
      : {
          label: "Active",
          cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
        };

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
            label="Expires"
            value={formatDateShort(parsed.odPeriodEnd)}
          />
          <Fact icon={ShieldCheck} label="IDV" value={formatINR(parsed.idv)} />
          <Fact
            icon={FileText}
            label="Insurer"
            value={parsed.insurerName.split(" ").slice(0, 2).join(" ")}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-brand-light-gray flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            {subscription ? (
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
          <div className="flex items-center gap-2">
            {subscription && (
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
