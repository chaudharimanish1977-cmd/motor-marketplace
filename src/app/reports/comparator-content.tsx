import {
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Trophy,
  Gauge,
  X as XIcon,
  ChevronRight,
  CheckCircle2,
  Award,
  Building2,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import { ReportGate } from "@/components/report-gate";
import type {
  ComparisonQuoteScore,
  ComparisonRcpSnapshot,
  ComparisonVerdict,
  ParsedPolicy,
} from "@/lib/types";
import type { RightOfferPick } from "@/lib/rightoffer-pick";

/**
 * Comparator content — server component. Renders the multi-doc verdict
 * inline inside /reports?tab=comparator. Same visual structure as
 * /comparison/[id] but always rendered fresh on the server when the
 * comparator tab is active.
 *
 * Layout: header → RCP → quotes scored side-by-side → verdict. The
 * gate (a client component) sits between RCP and the quote scoring so
 * the customer sees the recommendation framework for free, then
 * verifies email to see the personalised payoff.
 */

interface Props {
  vehicleLabel: string;
  rcp: ComparisonRcpSnapshot;
  quoteScores: ComparisonQuoteScore[];
  verdict: ComparisonVerdict;
  docs: ParsedPolicy[];
  rightOfferPick: RightOfferPick;
  showGate: boolean;
}

export function ComparatorContent({
  vehicleLabel,
  rcp,
  quoteScores,
  verdict,
  docs,
  rightOfferPick,
  showGate,
}: Props) {
  const docById = new Map(docs.map((d) => [d.id, d]));

  return (
    <div className="space-y-6">
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

      <RcpBlock rcp={rcp} vehicleLabel={vehicleLabel} />

      {showGate && <ReportGate />}

      {!showGate && (
        <>
          <QuotesBlock quoteScores={quoteScores} docById={docById} />
          <RightOfferPickCard pick={rightOfferPick} />
          <VerdictBlock verdict={verdict} docs={docs} />
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
function RcpBlock({
  rcp,
  vehicleLabel,
}: {
  rcp: ComparisonRcpSnapshot;
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

function QuotesBlock({
  quoteScores,
  docById,
}: {
  quoteScores: ComparisonQuoteScore[];
  docById: Map<string, ParsedPolicy>;
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
  score: ComparisonQuoteScore;
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
// Right Offer pick — our indicative offer, between Quotes and Verdict
// ----------------------------------------------------------------------------
function RightOfferPickCard({ pick }: { pick: RightOfferPick }) {
  const beatBadge =
    pick.beatsCustomerOn === "price"
      ? { label: "Beats your best price", tone: "emerald" }
      : pick.beatsCustomerOn === "missing_essentials"
        ? { label: "Covers what's missing", tone: "deepblue" }
        : pick.beatsCustomerOn === "features"
          ? { label: "Equal coverage", tone: "amber" }
          : { label: "Your quote wins", tone: "slate" };

  const badgeCls =
    beatBadge.tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : beatBadge.tone === "deepblue"
        ? "bg-blue-50 text-brand-deepblue border-blue-100"
        : beatBadge.tone === "amber"
          ? "bg-amber-50 text-amber-700 border-amber-100"
          : "bg-slate-50 text-brand-slate border-brand-light-gray";

  return (
    <section className="rounded-2xl border-2 border-brand-orange/30 bg-gradient-to-br from-orange-50/40 to-white shadow-elevated overflow-hidden">
      <header className="px-5 md:px-6 pt-5 pb-3 border-b border-brand-light-gray flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-orange">
            <Award className="w-3.5 h-3.5" />
            Our pick · Right Offer
          </div>
          <h2 className="mt-1.5 text-xl md:text-2xl font-bold text-brand-charcoal tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-orange" />
            {pick.insurerName}
          </h2>
          {pick.tagline && (
            <p className="text-xs text-brand-slate mt-0.5">{pick.tagline}</p>
          )}
        </div>
        <div className="text-right">
          <div className="font-bold text-brand-charcoal text-xl tabular-nums">
            ₹{formatINR(pick.grandTotal).replace("₹", "")}
          </div>
          <div className="text-[10px] text-brand-slate">total premium</div>
        </div>
      </header>

      <div className="px-5 md:px-6 py-4 space-y-3">
        {/* Why this is the Right Offer */}
        <div className="flex items-start gap-2 text-sm text-brand-charcoal leading-relaxed">
          <CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
          <span>{pick.beatSummary}</span>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] rounded-full border ${badgeCls}`}
          >
            {beatBadge.label}
          </span>
          {pick.priceVsCustomerBest < 0 && (
            <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              Save ₹
              {formatINR(Math.abs(pick.priceVsCustomerBest)).replace(
                "₹",
                ""
              )}
            </span>
          )}
        </div>

        {/* What's included */}
        {pick.includedAddOns.length > 0 && (
          <div className="pt-2 border-t border-brand-light-gray">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-charcoal mb-1.5">
              Included add-ons
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {pick.includedAddOns.map((name) => (
                <li
                  key={name}
                  className="flex items-center gap-1.5 text-xs text-brand-slate"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Premium breakdown */}
        <div className="pt-2 border-t border-brand-light-gray grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div>
            <div className="text-brand-slate uppercase tracking-[0.08em] text-[9px] font-semibold">
              Basic OD
            </div>
            <div className="text-brand-charcoal font-semibold tabular-nums">
              {formatINR(pick.basicOd)}
            </div>
          </div>
          <div>
            <div className="text-brand-slate uppercase tracking-[0.08em] text-[9px] font-semibold">
              Basic TP
            </div>
            <div className="text-brand-charcoal font-semibold tabular-nums">
              {formatINR(pick.basicTp)}
            </div>
          </div>
          <div>
            <div className="text-brand-slate uppercase tracking-[0.08em] text-[9px] font-semibold">
              Add-ons
            </div>
            <div className="text-brand-charcoal font-semibold tabular-nums">
              {formatINR(pick.addOnPremium)}
            </div>
          </div>
          <div>
            <div className="text-brand-slate uppercase tracking-[0.08em] text-[9px] font-semibold">
              GST 18%
            </div>
            <div className="text-brand-charcoal font-semibold tabular-nums">
              {formatINR(pick.cgst + pick.sgst)}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 md:px-6 py-3 border-t border-brand-light-gray bg-brand-offwhite/40 text-[10px] text-brand-slate leading-relaxed">
        <strong className="font-semibold text-brand-charcoal">Indicative offer</strong>{" "}
        arranged by RightOffer Brokers Pvt Ltd. Final terms and binding
        underwriting confirmed at purchase.
      </div>
    </section>
  );
}

function VerdictBlock({
  verdict,
  docs,
}: {
  verdict: ComparisonVerdict;
  docs: ParsedPolicy[];
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
