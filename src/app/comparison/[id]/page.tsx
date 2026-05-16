import { notFound, redirect } from "next/navigation";
import {
  ShieldCheck,
  Sparkles,
  X as XIcon,
  Car,
  AlertCircle,
  CheckCircle2,
  Trophy,
  ArrowRight,
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
 * Section order (locked with user):
 *   1. Vehicle / context header
 *   2. RCP (what we recommend)
 *   3. Your uploaded quotes — side-by-side, scored against RCP
 *   4. RightOffer auction (M4 — placeholder for now)
 *   5. Verdict
 *   6. CTA (reserve / download)
 *
 * Auth-gated by session ownership of the ComparisonReport. The auction
 * placeholder doubles as honest signal — "the live partner-network
 * auction lands next; the comparison and verdict are real today."
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

          {/* 3. Auction placeholder (M4) */}
          <AuctionPlaceholder />

          {/* 4. Verdict */}
          <VerdictBlock comparison={comparison} quoteDocs={quoteDocs} />

          {/* 5. CTA row */}
          <CtaRow comparison={comparison} />
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
      <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy bg-blue-50 border border-blue-100 rounded-full">
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
// Auction placeholder (M4 will replace)
// ----------------------------------------------------------------------------
function AuctionPlaceholder() {
  return (
    <section className="rounded-2xl border-2 border-dashed border-brand-light-gray bg-brand-offwhite/40 p-6 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-slate bg-white border border-brand-light-gray rounded-full">
        <Sparkles className="w-3 h-3" />
        Coming next
      </div>
      <h3 className="mt-3 text-base md:text-lg font-bold text-brand-charcoal">
        RightOffer auction
      </h3>
      <p className="mt-1 text-xs text-brand-slate max-w-md mx-auto leading-relaxed">
        Our partner insurers will compete to fill the gaps in your
        quotes — the auction goes live shortly. The verdict below
        compares only your uploaded quotes for now.
      </p>
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
        ? "border-brand-navy/30 bg-blue-50/40"
        : "border-amber-200 bg-amber-50/40";
  const iconCls =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : tone === "deepblue"
        ? "bg-blue-100 text-brand-navy border-blue-200"
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
// CTA row
// ----------------------------------------------------------------------------
function CtaRow({ comparison }: { comparison: ComparisonReport }) {
  const hasRecommendedQuote = !!comparison.verdict.recommendedQuoteId;

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <LoadingLink
        href="/me"
        spinnerPosition="right"
        className="text-xs font-semibold text-brand-slate hover:text-brand-charcoal px-3 py-1.5 rounded-xl border border-brand-light-gray hover:bg-white transition-colors"
      >
        Back to my portal
      </LoadingLink>
      {hasRecommendedQuote && comparison.verdict.type === "take_existing" ? (
        <div className="text-xs text-brand-slate italic">
          Take this quote directly from your insurer — you&rsquo;ve done
          your homework.
        </div>
      ) : (
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-olive/60 text-white font-semibold text-sm rounded-xl cursor-not-allowed opacity-80"
          title="Reservation goes live once the RightOffer auction ships"
        >
          Reserve a RightOffer pick
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
