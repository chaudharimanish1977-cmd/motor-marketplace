/**
 * ReportSummary — Phase 6.1.1 one-page TL;DR.
 *
 * Sits between the Garage cover (the magazine front page) and the
 * four detailed editorial sections. The customer who doesn't want
 * to read the long review should be able to ACT from this block
 * alone: see the at-risk number, the headline gap, the headline
 * strength, and tap the primary renewal CTA.
 *
 * Mental model: a magazine's "Editor's Note" — a tight summary
 * up front with a pointer to the full feature below.
 *
 * Layout:
 *
 *     · SUMMARY ·
 *
 *     ₹ AT RISK     !  TOP GAP        ✓  TOP STRENGTH
 *     ₹3,22,393        Zero Dep          25% NCB
 *     across 7 gaps    cover missing     retained
 *
 *     [ Get my renewal quotes → ]
 *
 *     · Or read the full review below ·
 *
 * Three chips, no card frames. Mobile stacks vertically; desktop
 * lays them out in a single horizontal band.
 */

import { LoadingLink } from "@/components/loading-link";
import { formatINR } from "@/lib/format";
import { totalMoneyAtRisk } from "@/lib/claim-scenarios";
import type { ParsedPolicy, PolicyReport } from "@/lib/types";

interface ReportSummaryProps {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
  /** When true, hide the CTA + scroll-prompt so the PDF reads as a
   *  pure printable summary. */
  printMode?: boolean;
}

export function ReportSummary({
  parsedPolicy,
  report,
  printMode = false,
}: ReportSummaryProps) {
  const vehicleAge =
    new Date().getFullYear() - parsedPolicy.vehicle.yearOfManufacture;

  // At-risk amount — total out-of-pocket the customer's exposed to
  // across all the gaps the report flagged.
  const moneyAtRisk = totalMoneyAtRisk(
    report.keyGaps.items.map((g) => g.title),
    parsedPolicy.idv,
    vehicleAge
  );
  const hasRisk = moneyAtRisk.total > 0 && moneyAtRisk.count > 0;
  // Real alert tint kicks in when the exposure is meaningful (≥ ₹50k).
  // Below that we stay in editorial plum.
  const riskAlert = moneyAtRisk.total >= 50_000;

  // Headline gap — first gap from the keyGaps section.
  const topGap = report.keyGaps.items[0];

  // Headline strength — first strength from whatCoversWell. If empty,
  // fall back to NCB if the customer has retained any.
  const topStrength =
    report.whatCoversWell.items[0] ??
    (parsedPolicy.ncbPercent > 0
      ? {
          title: `${parsedPolicy.ncbPercent}% NCB retained`,
          description: "Strong claim-free track record.",
        }
      : null);

  const renewHref = `/upload?fresh=1&renewal=${parsedPolicy.id}`;

  return (
    <section
      className="max-w-2xl mx-auto px-5 md:px-6 mt-6 md:mt-8 print:mt-4"
      aria-label="Report summary"
    >
      {/* Kicker */}
      <div className="text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold">
        · Summary ·
      </div>

      {/* Three chips — mobile stacks (1 col), desktop side-by-side (3 col) */}
      <div className="mt-5 md:mt-6 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {/* At Risk */}
        <SummaryChip
          kicker="At risk"
          kickerCls={
            riskAlert ? "text-brand-alert" : "text-brand-plum"
          }
          value={
            hasRisk ? formatINR(moneyAtRisk.total) : "₹0"
          }
          valueCls={
            riskAlert ? "text-brand-alert" : "text-brand-charcoal"
          }
          caption={
            hasRisk
              ? `across ${moneyAtRisk.count} ${moneyAtRisk.count === 1 ? "gap" : "gaps"}`
              : "no critical exposure"
          }
        />

        {/* Top Gap */}
        <SummaryChip
          kicker="Top gap"
          kickerCls="text-brand-alert"
          value={topGap?.title || "None flagged"}
          valueCls="text-brand-charcoal"
          caption={topGap ? "the one to fix first" : "all essentials covered"}
          glyph="!"
          glyphCls="text-brand-alert font-black"
        />

        {/* Top Strength */}
        <SummaryChip
          kicker="Top strength"
          kickerCls="text-brand-success"
          value={topStrength?.title || "—"}
          valueCls="text-brand-charcoal"
          caption={topStrength?.description?.split(".")[0] || "—"}
          glyph="✓"
          glyphCls="text-brand-success"
        />
      </div>

      {/* CTA + scroll prompt — hidden in print so the PDF reads as a
       *  clean static document. */}
      {!printMode && (
        <div className="mt-7 md:mt-9 flex flex-col items-center text-center">
          <LoadingLink
            href={renewHref}
            className="inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3.5 rounded-full font-serif italic font-medium text-[16px] min-h-[48px] hover:opacity-90 transition-opacity"
          >
            Get my renewal quotes <span aria-hidden>→</span>
          </LoadingLink>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
            · Or read the full review below ·
          </div>
        </div>
      )}

      {/* Closing hairline — visually separates the summary from the
       *  start of the detailed body sections below. */}
      <div className="mt-9 md:mt-12 border-t border-brand-charcoal/15" />
    </section>
  );
}

/* ─── Single editorial chip ─────────────────────────────────────────── */

interface SummaryChipProps {
  kicker: string;
  kickerCls: string;
  value: string;
  valueCls: string;
  caption?: string;
  /** Optional status glyph (✓ / ! / ⚠) shown next to the value. */
  glyph?: string;
  glyphCls?: string;
}

function SummaryChip({
  kicker,
  kickerCls,
  value,
  valueCls,
  caption,
  glyph,
  glyphCls = "",
}: SummaryChipProps) {
  return (
    <div className="text-center md:text-left">
      <div
        className={`font-mono text-[10px] uppercase tracking-[0.14em] font-bold ${kickerCls}`}
      >
        · {kicker} ·
      </div>
      <div className="mt-1.5 flex items-baseline justify-center md:justify-start gap-2">
        {glyph && (
          <span
            className={`font-mono text-[20px] md:text-[24px] leading-none ${glyphCls}`}
            aria-hidden
          >
            {glyph}
          </span>
        )}
        <div
          className={`font-serif font-semibold text-[20px] md:text-[24px] tracking-[-0.012em] leading-[1.15] ${valueCls}`}
        >
          {value}
        </div>
      </div>
      {caption && (
        <div className="mt-1 font-serif italic text-[13px] md:text-[14px] text-brand-slate leading-snug">
          {caption}
        </div>
      )}
    </div>
  );
}
