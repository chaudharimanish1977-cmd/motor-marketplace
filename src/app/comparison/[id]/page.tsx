import { notFound, redirect } from "next/navigation";
import {
  ShieldCheck,
  Sparkles,
  X as XIcon,
  Car,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Gauge,
  ChevronRight,
} from "lucide-react";
import { findById, Tables } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import type {
  ComparisonReport,
  ParsedPolicy,
} from "@/lib/types";
import { formatINR } from "@/lib/format";
import { BrandBlobs } from "@/components/brand-blobs";
import { LoadingLink } from "@/components/loading-link";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Comparison — RightOffer",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Comparison report page — Right Offer comparator output.
 *
 * Section order:
 *   1. Vehicle / context header
 *   2. RCP (what we recommend)
 *   3. Your uploaded quotes — side-by-side, scored against RCP
 *   4. Lapsed-policy caring nudge (only when the anchor policy has
 *      expired — encourages the customer to upload a fresh one or
 *      get covered if they haven't yet)
 *   5. Verdict
 *   6. CTA row — back-to-portal link
 *
 * Auth-gated by session ownership of the ComparisonReport.
 *
 * The "RightOffer auction" placeholder + the "Reserve a RightOffer
 * pick" CTA were both retired here — marketplace isn't V1 and we
 * don't pre-announce features.
 */
export default async function ComparisonPage({ params }: PageProps) {
  const { id } = await params;

  // Accept either full session OR upload session — comparator is a
  // legitimate same-session action after upload. Upload session is
  // additionally scoped to docs the customer actually uploaded in
  // this browser, so cross-customer access via guessed ID still fails.
  const fullSessionEmail = await getSession();
  const uploadSession = fullSessionEmail ? null : await getUploadSession();
  const sessionEmail = fullSessionEmail ?? uploadSession?.email ?? null;
  if (!sessionEmail) {
    redirect(
      `/me/login?next=${encodeURIComponent(`/comparison/${id}`)}`
    );
  }

  const comparison = await findById<ComparisonReport>(
    Tables.COMPARISONS,
    id
  );
  if (!comparison) notFound();
  if (
    (comparison.customerEmail ?? "").toLowerCase() !==
    sessionEmail.toLowerCase()
  ) {
    notFound();
  }
  // Extra scoping for upload session: every quote in the comparison
  // must be in the upload-session's doc list. Otherwise this is
  // someone trying to access a comparison whose docs were uploaded
  // in a different browser (full magic-link verification required
  // for that).
  if (uploadSession) {
    const allowedDocs = new Set(uploadSession.docs);
    const allInScope = comparison.quoteIds.every((q) => allowedDocs.has(q));
    if (!allInScope) notFound();
  }

  // Hydrate the linked quote records so the side-by-side table has the
  // full add-on lists + premium breakdown to render.
  const quoteDocs: ParsedPolicy[] = [];
  for (const qid of comparison.quoteIds) {
    const q = await findById<ParsedPolicy>(Tables.PARSED_POLICIES, qid);
    if (q) quoteDocs.push(q);
  }

  // Anchor policy — when the comparison was launched with a specific
  // "current policy" attached, we load it so we can detect whether
  // that policy has lapsed. A lapsed anchor surfaces a caring nudge
  // below the quotes (upload your new policy / get covered if you
  // haven't yet).
  const anchorPolicy = comparison.policyId
    ? await findById<ParsedPolicy>(
        Tables.PARSED_POLICIES,
        comparison.policyId
      )
    : null;
  const anchorLapsed =
    !!anchorPolicy &&
    new Date(anchorPolicy.odPeriodEnd).getTime() < Date.now();

  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-screen px-4 py-10 md:py-14">
        <div className="max-w-4xl mx-auto space-y-7">
          <Header comparison={comparison} />

          {/* 1. RCP */}
          <RcpBlock comparison={comparison} />

          {/* 2. Customer's quotes */}
          <QuotesBlock
            comparison={comparison}
            quoteDocs={quoteDocs}
          />

          {/* 3. Lapsed-policy caring nudge — only fires when the
              anchor policy is past its expiry date. */}
          {anchorLapsed && anchorPolicy && (
            <LapsedPolicyNudge anchorPolicy={anchorPolicy} />
          )}

          {/* 4. Verdict */}
          <VerdictBlock comparison={comparison} quoteDocs={quoteDocs} />

          {/* 5. CTA row */}
          <CtaRow />
        </div>
      </main>
    </>
  );
}

// ----------------------------------------------------------------------------
// Header
// ----------------------------------------------------------------------------
function Header({ comparison }: { comparison: ComparisonReport }) {
  return (
    <header className="space-y-2">
      <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy bg-brand-navy/10 border border-brand-navy/20 rounded-full">
        <Sparkles className="w-3.5 h-3.5" />
        Right Offer comparison
      </div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-charcoal flex items-center gap-2">
        <Car className="w-7 h-7 text-brand-navy" />
        {comparison.vehicleLabel}
      </h1>
      <p className="text-sm text-brand-slate">
        {comparison.quoteIds.length}{" "}
        {comparison.quoteIds.length === 1 ? "quote" : "quotes"} compared
        against the Right Offer profile for this car
        {comparison.policyId ? " · anchored on your current policy" : ""}
      </p>
    </header>
  );
}

// ----------------------------------------------------------------------------
// RCP block
// ----------------------------------------------------------------------------
function RcpBlock({ comparison }: { comparison: ComparisonReport }) {
  const { rcp } = comparison;
  return (
    <section className="bg-white rounded-2xl border border-brand-light-gray shadow-soft overflow-hidden">
      <header className="px-5 md:px-6 pt-5 pb-3 border-b border-brand-light-gray">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy">
          <ShieldCheck className="w-3.5 h-3.5" />
          What we recommend
        </div>
        <h2 className="mt-1.5 text-xl md:text-2xl font-bold text-brand-charcoal tracking-tight">
          The Right Offer profile for your {comparison.vehicleLabel}
        </h2>
        <p className="mt-1.5 text-xs text-brand-slate leading-relaxed">
          The coverage we believe is right for your car &amp; profile —
          every quote below is scored against this.
        </p>
      </header>

      <div className="px-5 md:px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-charcoal">
            Required add-ons
          </div>
          <div className="text-[10px] text-brand-slate tabular-nums">
            ~ {formatINR(rcp.requiredAddOnsPremiumTotal)}/yr together
          </div>
        </div>
        {rcp.requiredAddOns.length === 0 ? (
          <p className="text-xs text-brand-slate">
            No specific add-ons strictly required for your profile.
          </p>
        ) : (
          <ul className="space-y-2">
            {rcp.requiredAddOns.map((a) => (
              <li
                key={a.name}
                className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/40 border border-emerald-100"
              >
                <div className="w-6 h-6 shrink-0 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-semibold text-brand-charcoal text-sm">
                      {a.name}
                    </div>
                    <div className="text-[11px] tabular-nums text-brand-slate">
                      ~ {formatINR(a.estimatedAnnualPremium)}/yr
                    </div>
                  </div>
                  <div className="text-xs text-brand-slate leading-snug mt-0.5">
                    {a.why}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rcp.idv.note && (
        <div className="px-5 md:px-6 py-3 border-t border-brand-light-gray bg-brand-offwhite/40 text-xs text-brand-slate flex items-start gap-2">
          <Gauge className="w-3.5 h-3.5 text-brand-navy shrink-0 mt-0.5" />
          <span>
            <strong className="text-brand-charcoal">
              IDV {formatINR(rcp.idv.current)}
            </strong>{" "}
            · {rcp.idv.note}
          </span>
        </div>
      )}
    </section>
  );
}

// ----------------------------------------------------------------------------
// Quotes block
// ----------------------------------------------------------------------------
function QuotesBlock({
  comparison,
  quoteDocs,
}: {
  comparison: ComparisonReport;
  quoteDocs: ParsedPolicy[];
}) {
  const quoteById = new Map(quoteDocs.map((q) => [q.id, q]));

  return (
    <section className="bg-white rounded-2xl border border-brand-light-gray shadow-soft overflow-hidden">
      <header className="px-5 md:px-6 pt-5 pb-3 border-b border-brand-light-gray">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy">
          <Trophy className="w-3.5 h-3.5" />
          Your quotes
        </div>
        <h2 className="mt-1.5 text-xl md:text-2xl font-bold text-brand-charcoal tracking-tight">
          {comparison.quoteIds.length}{" "}
          {comparison.quoteIds.length === 1 ? "quote" : "quotes"} scored against
          the profile
        </h2>
      </header>

      <div className="p-4 md:p-5 space-y-3">
        {comparison.quoteScores.map((score) => {
          const doc = quoteById.get(score.quoteId);
          return (
            <QuoteCard
              key={score.quoteId}
              score={score}
              doc={doc ?? null}
            />
          );
        })}
      </div>
    </section>
  );
}

function QuoteCard({
  score,
  doc,
}: {
  score: ComparisonReport["quoteScores"][number];
  doc: ParsedPolicy | null;
}) {
  const verdictBadge = score.isExactlyRcp
    ? {
        label: "Exactly Right",
        cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
      }
    : score.isRcpComplete
      ? {
          label: "Covers + extras",
          cls: "bg-amber-50 text-amber-700 border-amber-100",
        }
      : {
          label: "Missing essentials",
          cls: "bg-rose-50 text-rose-700 border-rose-100",
        };

  return (
    <article className="rounded-2xl border border-brand-light-gray bg-white p-4 md:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-bold text-brand-charcoal text-lg leading-tight">
            {score.insurerName}
          </div>
          {doc?.policyNumber && (
            <div className="text-[11px] text-brand-slate mt-0.5 font-mono">
              {doc.policyNumber}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] rounded-full border ${verdictBadge.cls}`}
          >
            {verdictBadge.label}
          </span>
          <div className="text-right">
            <div className="font-bold text-brand-charcoal text-base tabular-nums">
              {formatINR(score.grandTotal)}
            </div>
            <div className="text-[10px] text-brand-slate">premium</div>
          </div>
        </div>
      </div>

      {/* Missing required */}
      {score.missingRequired.length > 0 && (
        <div className="mt-3 pt-3 border-t border-brand-light-gray">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-rose-700 mb-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Missing essentials
          </div>
          <ul className="space-y-0.5">
            {score.missingRequired.map((m) => (
              <li
                key={m}
                className="text-xs text-brand-charcoal flex items-center gap-1.5"
              >
                <XIcon className="w-3 h-3 text-rose-600 shrink-0" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extras / over-coverage */}
      {score.extraNonRcp.length > 0 && (
        <div className="mt-3 pt-3 border-t border-brand-light-gray">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-700 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Extras you didn&rsquo;t need to buy
          </div>
          <ul className="space-y-0.5">
            {score.extraNonRcp.map((e) => (
              <li
                key={e}
                className="text-xs text-brand-slate flex items-center gap-1.5"
              >
                <ChevronRight className="w-3 h-3 text-amber-600 shrink-0" />
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* RCP-complete cheer */}
      {score.isExactlyRcp && (
        <div className="mt-3 pt-3 border-t border-brand-light-gray text-xs text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Covers every Right Offer essential — no missing items, no
          padding.
        </div>
      )}
    </article>
  );
}

// ----------------------------------------------------------------------------
// Lapsed-policy caring nudge — only fires when the comparison's anchor
// ParsedPolicy has expired. Editorial vocab (coral left-rule, mono
// kicker, serif body) matching the design language elsewhere. Two
// soft paths: (a) "you renewed elsewhere — bring it here so we can
// review the new one", (b) "you haven't renewed — please get cover
// first; legally required."
// ----------------------------------------------------------------------------
function LapsedPolicyNudge({ anchorPolicy }: { anchorPolicy: ParsedPolicy }) {
  const vehicleLabel =
    `${anchorPolicy.vehicle.make} ${anchorPolicy.vehicle.model}`.trim() ||
    "your car";
  const expiry = new Date(anchorPolicy.odPeriodEnd);
  const daysSinceExpiry = Math.max(
    1,
    Math.floor((Date.now() - expiry.getTime()) / (24 * 60 * 60 * 1000))
  );
  return (
    <section className="pl-5 border-l-2 border-brand-alert">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold text-brand-alert">
        · A gentle nudge ·
      </div>
      <h3 className="mt-2 font-serif font-medium text-[24px] md:text-[28px] leading-[1.1] tracking-[-0.015em] text-brand-charcoal m-0">
        We hope your{" "}
        <span className="italic text-brand-plum">{vehicleLabel}</span>{" "}
        is still covered.
      </h3>
      <p className="mt-3 font-serif text-[14.5px] md:text-[15.5px] leading-[1.6] text-brand-charcoal max-w-xl">
        Your last policy with us shows as lapsed{" "}
        <span className="font-mono text-[12px] text-brand-slate tabular-nums">
          ({daysSinceExpiry} {daysSinceExpiry === 1 ? "day" : "days"} ago)
        </span>
        . If you&rsquo;ve renewed elsewhere — welcome, that&rsquo;s
        fine — drop the new policy here and we&rsquo;ll review it.
        If you haven&rsquo;t renewed yet, please get cover first;
        third-party insurance is mandatory by law.
      </p>
      <div className="mt-5 flex items-center gap-3 flex-wrap">
        <LoadingLink
          href={`/upload?renewal=${anchorPolicy.id}`}
          spinnerPosition="right"
          className="inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3.5 rounded-full font-serif italic font-medium text-[15px] min-h-[44px] hover:opacity-90 transition-opacity"
        >
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

// ----------------------------------------------------------------------------
// Verdict
// ----------------------------------------------------------------------------
function VerdictBlock({
  comparison,
  quoteDocs,
}: {
  comparison: ComparisonReport;
  quoteDocs: ParsedPolicy[];
}) {
  const { verdict } = comparison;
  const tone =
    verdict.type === "take_existing"
      ? "emerald"
      : verdict.type === "rightoffer_pitch"
        ? "deepblue"
        : "amber";
  const toneCls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50/40"
      : tone === "deepblue"
        ? "border-brand-navy/30 bg-brand-navy/10"
        : "border-amber-200 bg-amber-50/40";
  const iconCls =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : tone === "deepblue"
        ? "bg-brand-navy/15 text-brand-navy border-brand-navy/30"
        : "bg-amber-100 text-amber-700 border-amber-200";

  const recommendedQuote = verdict.recommendedQuoteId
    ? quoteDocs.find((q) => q.id === verdict.recommendedQuoteId)
    : null;

  return (
    <section
      className={`rounded-2xl border-2 ${toneCls} p-5 md:p-6 shadow-soft`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center ${iconCls}`}
        >
          {verdict.type === "take_existing" ? (
            <Trophy className="w-5 h-5" />
          ) : verdict.type === "rightoffer_pitch" ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-slate">
            Right Offer verdict
          </div>
          <h3 className="mt-1 text-xl md:text-2xl font-bold text-brand-charcoal leading-tight">
            {verdict.headline}
          </h3>
          <p className="mt-2 text-sm text-brand-charcoal leading-relaxed">
            {verdict.body}
          </p>
          {recommendedQuote && (
            <div className="mt-3 text-[11px] text-brand-slate">
              Recommended option: {recommendedQuote.insurerName}
              {recommendedQuote.policyNumber
                ? ` · ${recommendedQuote.policyNumber}`
                : ""}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// CTA row — quiet. The "Reserve a RightOffer pick" button was retired
// because the underlying marketplace isn't live in V1 and a disabled
// button is worse than no button. The back-to-portal link is enough.
// ----------------------------------------------------------------------------
function CtaRow() {
  return (
    <div className="flex items-center justify-center pt-2">
      <LoadingLink
        href="/me"
        spinnerPosition="right"
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-plum hover:text-brand-plum text-brand-charcoal font-serif italic font-medium text-[13px] md:text-[14px] min-h-[36px] transition-colors"
      >
        Back to my portal <span aria-hidden>→</span>
      </LoadingLink>
    </div>
  );
}
