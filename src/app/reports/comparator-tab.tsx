"use client";

import {
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Trophy,
  Gauge,
  X as XIcon,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import { ReportGate } from "@/components/report-gate";
import type { ComparatorView } from "./page";
import type { ComparisonReport } from "@/lib/types";

interface Props {
  comparator: ComparatorView;
  /** When true, render only the RCP section + the inline gate; hide
   *  the verdict + per-quote scoring + reservation CTA until the
   *  customer verifies their email via OTP. */
  showGate: boolean;
}

/**
 * Comparator tab — the multi-doc verdict view.
 *
 * Mirror of the visual structure from /comparison/[id] but rendered
 * inline as a tab. Composition is the same: header → RCP → quotes
 * scored side-by-side → verdict. The gate sits between the RCP and
 * the quote-scoring sections so the customer sees what we recommend
 * for free (high-value preview), then verifies email to see how their
 * specific quotes stack up (the personalised payoff).
 */
export function ComparatorTab({ comparator, showGate }: Props) {
  const { vehicleLabel, rcp, quoteScores, verdict, docs } = comparator;
  const docById = new Map(docs.map((d) => [d.id, d]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-deepblue bg-blue-50 border border-blue-100 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          Right Offer comparator
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-charcoal flex items-center gap-2">
          {vehicleLabel}
        </h1>
        <p className="text-sm text-brand-slate">
          {quoteScores.length}{" "}
          {quoteScores.length === 1 ? "document" : "documents"} compared
          against the Right Offer profile for this car
        </p>
      </header>

      {/* RCP — always visible (the prescription). */}
      <RcpBlock rcp={rcp} vehicleLabel={vehicleLabel} />

      {/* Gate — sits between RCP (the framework) and the personalised
       *  payoff (verdict + scoring + reservation). */}
      {showGate && <ReportGate />}

      {/* Everything below requires verification. */}
      {!showGate && (
        <>
          <QuotesBlock
            quoteScores={quoteScores}
            docById={docById}
          />
          <VerdictBlock verdict={verdict} docs={docs} />
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// RCP block (always visible, before the gate)
// ----------------------------------------------------------------------------
function RcpBlock({
  rcp,
  vehicleLabel,
}: {
  rcp: ComparatorView["rcp"];
  vehicleLabel: string;
}) {
  return (
    <section className="bg-white rounded-2xl border border-brand-light-gray shadow-soft overflow-hidden">
      <header className="px-5 md:px-6 pt-5 pb-3 border-b border-brand-light-gray">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-deepblue">
          <ShieldCheck className="w-3.5 h-3.5" />
          What we recommend
        </div>
        <h2 className="mt-1.5 text-lg md:text-xl font-bold text-brand-charcoal tracking-tight">
          The Right Offer profile for your {vehicleLabel}
        </h2>
        <p className="mt-1.5 text-xs text-brand-slate leading-relaxed">
          The coverage we believe is right for your car &amp; profile.
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
          <Gauge className="w-3.5 h-3.5 text-brand-deepblue shrink-0 mt-0.5" />
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
// Quotes block (post-gate)
// ----------------------------------------------------------------------------
function QuotesBlock({
  quoteScores,
  docById,
}: {
  quoteScores: ComparisonReport["quoteScores"];
  docById: Map<string, ComparatorView["docs"][number]>;
}) {
  return (
    <section className="bg-white rounded-2xl border border-brand-light-gray shadow-soft overflow-hidden">
      <header className="px-5 md:px-6 pt-5 pb-3 border-b border-brand-light-gray">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-deepblue">
          <Trophy className="w-3.5 h-3.5" />
          Your documents
        </div>
        <h2 className="mt-1.5 text-lg md:text-xl font-bold text-brand-charcoal tracking-tight">
          {quoteScores.length}{" "}
          {quoteScores.length === 1 ? "document" : "documents"} scored
          against the profile
        </h2>
      </header>

      <div className="p-4 md:p-5 space-y-3">
        {quoteScores.map((score) => (
          <QuoteCard
            key={score.quoteId}
            score={score}
            doc={docById.get(score.quoteId) ?? null}
          />
        ))}
      </div>
    </section>
  );
}

function QuoteCard({
  score,
  doc,
}: {
  score: ComparisonReport["quoteScores"][number];
  doc: ComparatorView["docs"][number] | null;
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

  const docType: "policy" | "quote" = doc?.documentType ?? "quote";

  return (
    <article className="rounded-2xl border border-brand-light-gray bg-white p-4 md:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-bold text-brand-charcoal text-lg leading-tight">
            {score.insurerName}
          </div>
          <div className="text-[11px] text-brand-slate mt-0.5">
            {docType === "policy" ? "Your current policy" : "Renewal quote"}
            {doc?.policyNumber ? ` · ${doc.policyNumber}` : ""}
          </div>
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

      {score.isExactlyRcp && (
        <div className="mt-3 pt-3 border-t border-brand-light-gray text-xs text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Covers every Right Offer essential &mdash; no missing items, no
          padding.
        </div>
      )}
    </article>
  );
}

// ----------------------------------------------------------------------------
// Verdict block (post-gate)
// ----------------------------------------------------------------------------
function VerdictBlock({
  verdict,
  docs,
}: {
  verdict: ComparatorView["verdict"];
  docs: ComparatorView["docs"];
}) {
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
        ? "border-brand-deepblue/30 bg-blue-50/40"
        : "border-amber-200 bg-amber-50/40";
  const iconCls =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : tone === "deepblue"
        ? "bg-blue-100 text-brand-deepblue border-blue-200"
        : "bg-amber-100 text-amber-700 border-amber-200";

  const recommended = verdict.recommendedQuoteId
    ? docs.find((d) => d.id === verdict.recommendedQuoteId)
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
          <h3 className="mt-1 text-lg md:text-xl font-bold text-brand-charcoal leading-tight">
            {verdict.headline}
          </h3>
          <p className="mt-2 text-sm text-brand-charcoal leading-relaxed">
            {verdict.body}
          </p>
          {recommended && (
            <div className="mt-3 text-[11px] text-brand-slate">
              Recommended option: {recommended.insurerName}
              {recommended.policyNumber
                ? ` · ${recommended.policyNumber}`
                : ""}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
