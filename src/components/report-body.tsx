/**
 * Report body — the four editorial sections of /report/[id] that
 * sit below the Phase 6.0 cover.
 *
 *   01 · What's Working
 *   02 · What's Missing
 *   03 · At Renewal
 *   04 · Bottom Line
 *
 * Replaces the legacy SectionCard / IdvCheckCard / PricingSnapshotCard /
 * KeyTakeawayCard / VehicleHero combo with a single editorial vocabulary:
 * mono kickers, serif headings with italic-plum accents, frameless lists,
 * left-border pull quotes, and one ink-line brand sketch per section.
 *
 * Color discipline:
 *   · charcoal     — body text + headings
 *   · plum         — italic accents + CTAs
 *   · sage         — kickers + "working" indicators
 *   · coral        — true alerts only, used sparingly
 *   · slate        — muted body + mono captions
 *
 * NO gradient cards. NO rounded boxes as the default. NO emerald/rose/
 * amber/sky leakage from the old SaaS palette.
 */

import { LoadingLink } from "@/components/loading-link";
import {
  ReportSection,
  SectionItem,
  SectionPullQuote,
} from "@/components/report-section";
import {
  SketchOpenRoad,
  SketchExitSign,
  SketchPetrolPump,
} from "@/components/sketches-scenes";
import { SketchVerdict } from "@/components/sketches";
import { formatINR } from "@/lib/format";
import { totalMoneyAtRisk } from "@/lib/claim-scenarios";
import type { ParsedPolicy, PolicyReport } from "@/lib/types";

/* ─── 01 · What's Working ───────────────────────────────────────────── */

export function WhatsWorkingSection({
  report,
}: {
  report: PolicyReport;
}) {
  const items = report.whatCoversWell.items;
  return (
    <ReportSection
      number="01"
      kicker="What's Working"
      heading="Strong on the essentials."
      intro="The pieces of your current policy that are pulling their weight."
      sketch={<SketchOpenRoad width={140} color="currentColor" />}
      anchor="working"
    >
      <div className="-mt-2">
        {items.length === 0 ? (
          <p className="font-serif italic text-[15px] text-brand-slate py-3">
            We couldn&apos;t spot anything notable on the strengths
            side — the gaps section below explains why.
          </p>
        ) : (
          items.map((item, i) => (
            <SectionItem
              key={i}
              status="good"
              title={item.title}
              body={item.description}
            />
          ))
        )}
      </div>
    </ReportSection>
  );
}

/* ─── 02 · What's Missing ───────────────────────────────────────────── */

export function WhatsMissingSection({
  parsedPolicy,
  report,
}: {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
}) {
  const gaps = report.keyGaps.items;
  const idv = report.idvCheck;
  const vehicleAge =
    new Date().getFullYear() - parsedPolicy.vehicle.yearOfManufacture;

  // Money-at-risk callout — surfaces the bill the customer's exposed
  // to if a claim happened today, summed across all the gaps.
  const moneyAtRisk = totalMoneyAtRisk(
    gaps.map((g) => g.title),
    parsedPolicy.idv,
    vehicleAge
  );

  const idvAssessmentLabel: Record<typeof idv.assessment, string> = {
    appropriate: "Looks appropriate",
    low: "Reads low",
    high: "Reads high",
  };
  const idvAssessmentCls =
    idv.assessment === "appropriate"
      ? "text-brand-success"
      : "text-brand-alert";

  return (
    <ReportSection
      number="02"
      kicker="What's Missing"
      heading="Gaps to watch."
      intro="The pieces a claim would expose. We've ranked them by what they'd actually cost you."
      sketch={<SketchExitSign width={130} color="currentColor" />}
      anchor="gaps"
    >
      {/* Money-at-risk callout — editorial pull quote, not a gradient card */}
      {moneyAtRisk.total > 0 && (
        <SectionPullQuote
          label="At risk today, if a claim happens"
          tone={moneyAtRisk.total >= 100_000 ? "alert" : "plum"}
        >
          <span className="not-italic font-serif font-semibold text-[28px] md:text-[34px] tabular-nums text-brand-charcoal">
            {formatINR(moneyAtRisk.total)}
          </span>
          <span className="ml-2 font-serif italic text-[14px] md:text-[15px] text-brand-slate">
            estimated out-of-pocket across {moneyAtRisk.count}{" "}
            {moneyAtRisk.count === 1 ? "gap" : "gaps"}.
          </span>
        </SectionPullQuote>
      )}

      {/* Gap list */}
      <div className="mt-2">
        {gaps.length === 0 ? (
          <p className="font-serif italic text-[15px] text-brand-slate py-3">
            No critical gaps detected. The renewal section below
            covers what to ask for.
          </p>
        ) : (
          gaps.map((gap, i) => (
            <SectionItem
              key={i}
              status={i < 2 ? "alert" : "watch"}
              title={gap.title}
              body={gap.description}
            />
          ))
        )}
      </div>

      {/* IDV check — folded into the same section as an editorial sub-block */}
      <div className="mt-8 md:mt-10 border-t border-brand-charcoal/15 pt-6 md:pt-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-sage font-bold">
          · IDV Check ·
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <div className="font-serif font-semibold text-[26px] md:text-[32px] tabular-nums text-brand-charcoal leading-none">
            {formatINR(idv.currentIdv)}
          </div>
          <div
            className={`font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold ${idvAssessmentCls}`}
          >
            · {idvAssessmentLabel[idv.assessment]} ·
          </div>
        </div>

        {idv.whatToDo.length > 0 && (
          <ul className="mt-4 space-y-2">
            {idv.whatToDo.map((item, i) => (
              <li
                key={i}
                className="flex gap-2.5 font-serif text-[14px] md:text-[15px] text-brand-charcoal leading-snug"
              >
                <span
                  className="text-brand-plum font-mono leading-snug"
                  aria-hidden
                >
                  →
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {idv.tip && (
          <p className="mt-4 font-serif italic text-[14px] md:text-[15px] text-brand-slate leading-snug">
            <span className="not-italic font-mono text-[10px] uppercase tracking-[0.14em] text-brand-plum font-bold">
              · Tip ·
            </span>{" "}
            {idv.tip}
          </p>
        )}
      </div>
    </ReportSection>
  );
}

/* ─── 03 · At Renewal ───────────────────────────────────────────────── */

export function AtRenewalSection({
  report,
}: {
  report: PolicyReport;
}) {
  const tips = report.renewalTips.items;
  const pricing = report.pricingSnapshot;

  return (
    <ReportSection
      number="03"
      kicker="At Renewal"
      heading="What to ask for."
      intro="The single moment of leverage you have on your insurer is right here. Use it."
      sketch={<SketchPetrolPump width={130} color="currentColor" />}
      anchor="renewal"
    >
      {/* Tips list */}
      <div className="-mt-2">
        {tips.map((tip, i) => (
          <SectionItem
            key={i}
            status="watch"
            title={tip.title}
            body={tip.description}
          />
        ))}
      </div>

      {/* Pricing snapshot — folded inline */}
      {pricing && (
        <div className="mt-8 md:mt-10 border-t border-brand-charcoal/15 pt-6 md:pt-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-sage font-bold">
            · Pricing Snapshot ·
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 max-w-md">
            <PricingFigure
              label="You're paying"
              value={formatINR(pricing.currentPremium)}
              tone="charcoal"
            />
            <PricingFigure
              label="Recommended range"
              value={`${formatINR(pricing.recommendedRangeMin)} – ${formatINR(
                pricing.recommendedRangeMax
              )}`}
              tone="plum"
            />
          </div>

          <p className="mt-5 font-serif text-[15px] md:text-[16px] leading-[1.55] text-brand-charcoal max-w-xl">
            {pricing.narrative}
          </p>

          {pricing.claimTimeExample && (
            <SectionPullQuote label="Claim-time example" tone="plum">
              {pricing.claimTimeExample}
            </SectionPullQuote>
          )}
        </div>
      )}
    </ReportSection>
  );
}

function PricingFigure({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "charcoal" | "plum";
}) {
  return (
    <div>
      <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-slate">
        {label}
      </div>
      <div
        className={`mt-0.5 font-serif font-semibold text-[20px] md:text-[24px] tabular-nums leading-snug ${
          tone === "plum" ? "text-brand-plum" : "text-brand-charcoal"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/* ─── 04 · Bottom Line ──────────────────────────────────────────────── */

export function BottomLineSection({
  parsedPolicy,
  report,
  printMode = false,
}: {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
  /** When true, hide the renewal CTA pill so the PDF reads as a
   *  pure printable document with no interactive chrome. */
  printMode?: boolean;
}) {
  const takeaway = report.keyTakeaway;
  const renewHref = `/upload?fresh=1&renewal=${parsedPolicy.id}`;

  return (
    <ReportSection
      number="04"
      kicker="Bottom Line"
      heading="So — what now?"
      sketch={<SketchVerdict width={130} color="currentColor" />}
      anchor="bottom-line"
    >
      <div className="-mt-1 font-serif text-[17px] md:text-[20px] leading-[1.55] text-brand-charcoal max-w-xl">
        {takeaway.body}
      </div>

      {!printMode && (
        <div className="mt-6 md:mt-8 print:hidden">
          <LoadingLink
            href={renewHref}
            className="inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3.5 rounded-full font-serif italic font-medium text-[16px] min-h-[48px] hover:opacity-90 transition-opacity"
          >
            {takeaway.cta || "Get my renewal quotes"}{" "}
            <span aria-hidden>→</span>
          </LoadingLink>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
            · Free to see · Insurers compete for your renewal · No spam ·
          </div>
        </div>
      )}
    </ReportSection>
  );
}
