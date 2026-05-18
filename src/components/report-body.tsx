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
import { totalMoneyAtRisk, matchCanonicalAddOn } from "@/lib/claim-scenarios";
import { buildGapEvidence } from "@/lib/audit-checks";
import { GapEvidenceDisclosure } from "@/components/gap-evidence";
import { ClaimSimulator } from "@/components/claim-simulator";
import {
  DrivingProfileCard,
  type DrivingProfile,
} from "@/components/driving-profile-card";
import { SaveReportButton } from "@/components/save-report-button";
import { ShareButton } from "@/components/share-button";
import { GlossaryTerm } from "@/components/glossary-term";
import {
  InsightInline,
  InsightsDiscoveryLine,
} from "@/components/insight-inline";
import { INSIGHT_CATALOGUE } from "@/lib/insights/catalogue";
import {
  buildCustomerContext,
  matchAllInsights,
  insightsForGap,
} from "@/lib/insights/matcher";
import type { CanonicalAddOn } from "@/lib/insights/types";
import type { ParsedPolicy, PolicyReport } from "@/lib/types";

/* ─── 01 · What's Working ───────────────────────────────────────────── */

export function WhatsWorkingSection({
  parsedPolicy,
  report,
  printMode = false,
}: {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
  printMode?: boolean;
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
              callout={
                !printMode ? (
                  <StrengthShowOurWork
                    strengthTitle={item.title}
                    parsedPolicy={parsedPolicy}
                  />
                ) : undefined
              }
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
  drivingProfile,
  printMode = false,
}: {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
  /** Optional answers from the upload mid-load carousel. When present,
   *  each gap's "Show our work" trail gains profile-aware checks
   *  (mileage, claim history, household reliance, priority) so the
   *  audit reads as actually tailored to the customer — Phase 7b. */
  drivingProfile?: DrivingProfile;
  /** When true (PDF render), the per-gap "Show our work" disclosure is
   *  rendered expanded by default so the saved document carries the
   *  full audit trail. */
  printMode?: boolean;
}) {
  const gaps = report.keyGaps.items;
  const vehicleAge =
    new Date().getFullYear() - parsedPolicy.vehicle.yearOfManufacture;

  // Money-at-risk callout — surfaces the bill the customer's exposed
  // to if a claim happened today, summed across all the gaps.
  const moneyAtRisk = totalMoneyAtRisk(
    gaps.map((g) => g.title),
    parsedPolicy.idv,
    vehicleAge
  );

  // Insight matching for inline rendering — runs the engagement-layer
  // catalogue (src/content/insights/*) against this customer's context
  // and surfaces the matches:
  //   1. A discovery line at the top of §02 counting gap-attached matches
  //   2. The matched insight itself, tucked inline under each gap card
  // Insights without a `reportAttach: gaps` target stay in /me/insights
  // and don't surface here.
  const customerCtx = buildCustomerContext(parsedPolicy, drivingProfile);
  const matchedInsights = matchAllInsights(INSIGHT_CATALOGUE, customerCtx);
  const gapAttachedCount = matchedInsights.filter(
    (i) => i.reportAttach?.section === "gaps"
  ).length;

  return (
    <ReportSection
      number="02"
      kicker="What's Missing"
      heading="Gaps to watch."
      intro="The pieces a claim would expose. We've ranked them by what they'd actually cost you."
      sketch={<SketchExitSign width={130} color="currentColor" />}
      anchor="gaps"
    >
      {/* Driving-profile chips — surfaces the customer's mid-load
          answers at the top of §02 so they see immediately that the
          gaps below are tailored to them. Editorial vocab (sage
          left-rule, mono kicker, serif chips). Only renders when
          there's at least one answer; safely null otherwise. */}
      {drivingProfile && (
        <DrivingProfileCard
          initialProfile={drivingProfile}
          reportId={parsedPolicy.id}
        />
      )}

      {/* Insights discovery line — quiet entry-point to /me/insights
          when there's at least one gap-attached insight matched for
          this customer's profile. Print mode hides it (PDFs don't
          carry live links). */}
      {!printMode && gapAttachedCount > 0 && (
        <InsightsDiscoveryLine count={gapAttachedCount} />
      )}

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

      {/* Gap list — each row carries an inline "Show our work"
          disclosure rendering the deterministic audit-check trail +
          industry benchmark for that gap (Phase 7c). Graceful: if a
          gap's title doesn't map to a canonical add-on we know how to
          audit, the disclosure simply doesn't render. */}
      <div className="mt-2">
        {gaps.length === 0 ? (
          <p className="font-serif italic text-[15px] text-brand-slate py-3">
            No critical gaps detected. The renewal section below
            covers what to ask for.
          </p>
        ) : (
          gaps.map((gap, i) => {
            const canonical = matchCanonicalAddOn(gap.title);
            const evidence = canonical
              ? buildGapEvidence(canonical, parsedPolicy, drivingProfile)
              : null;
            // Pull any insight attached to this canonical gap. Multiple
            // matches are allowed; we render the most-recently-published
            // one inline and let the rest live in /me/insights. Keeps
            // the gap card readable when an evergreen + a fresh urgent
            // insight target the same gap.
            const gapInsights = canonical
              ? insightsForGap(matchedInsights, canonical as CanonicalAddOn)
              : [];
            const inlineInsight = gapInsights[0] ?? null;
            // Compose the transparency + engagement artifacts per gap:
            //   1. InsightInline — engagement-layer note tying the gap to
            //      a recent market / seasonal / regulatory update (v1
            //      Insights). Print mode hides it.
            //   2. ClaimSimulator — visceral money-grounding (Phase 7a),
            //      always visible. Renders only when the gap maps to a
            //      canonical add-on with a known scenario.
            //   3. GapEvidenceDisclosure — collapsible "Show our work"
            //      audit trail + industry benchmark (Phase 7c).
            const callout =
              canonical || evidence || inlineInsight ? (
                <div>
                  {inlineInsight && !printMode && (
                    <InsightInline insight={inlineInsight} />
                  )}
                  {canonical && (
                    <ClaimSimulator
                      canonical={canonical}
                      parsedPolicy={parsedPolicy}
                      printMode={printMode}
                    />
                  )}
                  {evidence && (
                    <div className="mt-3">
                      <GapEvidenceDisclosure
                        evidence={evidence}
                        printMode={printMode}
                      />
                    </div>
                  )}
                </div>
              ) : undefined;
            return (
              <SectionItem
                key={i}
                status={i < 2 ? "alert" : "watch"}
                title={gap.title}
                body={gap.description}
                callout={callout}
              />
            );
          })
        )}
      </div>

    </ReportSection>
  );
}

/* ─── 03 · IDV Check ────────────────────────────────────────────────── */

export function IdvCheckSection({
  parsedPolicy,
  report,
}: {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
}) {
  const idv = report.idvCheck;
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
      number="03"
      kicker="IDV Check"
      heading="Your declared value."
      intro={
        <>
          Your <GlossaryTerm term="IDV">IDV</GlossaryTerm> — the amount
          your insurer would pay if your car is totally lost today. The
          single highest-stakes number in your policy, worth a careful
          look.
        </>
      }
      sketch={<SketchVerdict width={130} color="currentColor" />}
      anchor="idv"
    >
      <div className="-mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <div className="font-serif font-semibold text-[34px] md:text-[44px] tabular-nums text-brand-charcoal leading-none">
          {formatINR(idv.currentIdv)}
        </div>
        <div
          className={`font-mono text-[11px] uppercase tracking-[0.16em] font-bold ${idvAssessmentCls}`}
        >
          · <GlossaryTerm term="IDV">{idvAssessmentLabel[idv.assessment]}</GlossaryTerm> ·
        </div>
      </div>

      {idv.whatToDo.length > 0 && (
        <ul className="mt-5 space-y-2.5 max-w-xl">
          {idv.whatToDo.map((item, i) => (
            <li
              key={i}
              className="flex gap-2.5 font-serif text-[15px] md:text-[16px] text-brand-charcoal leading-relaxed"
            >
              <span
                className="text-brand-plum font-mono leading-snug shrink-0"
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
        <p className="mt-5 font-serif italic text-[14.5px] md:text-[15px] text-brand-slate leading-relaxed max-w-xl">
          <span className="not-italic font-mono text-[10px] uppercase tracking-[0.14em] text-brand-plum font-bold">
            · Tip ·
          </span>{" "}
          {idv.tip}
        </p>
      )}

      {/* Show our work — keep the disclosure pattern consistent across
          the audit. Lifted into a separate component below so we don't
          duplicate the editorial markup. */}
      <IdvShowOurWork parsedPolicy={parsedPolicy} report={report} />
    </ReportSection>
  );
}

/* ─── 04 · At Renewal ───────────────────────────────────────────────── */

export function AtRenewalSection({
  parsedPolicy,
  report,
  drivingProfile,
  printMode = false,
}: {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
  drivingProfile?: DrivingProfile;
  printMode?: boolean;
}) {
  const tips = report.renewalTips.items;
  const pricing = report.pricingSnapshot;

  // Renewal-attached insights from the engagement layer — surface
  // ABOVE the renewal-tips list so the customer reads "what's moved
  // in the market lately" before the standing-tips advice that's
  // the same year-on-year. Print mode hides them.
  const customerCtx = buildCustomerContext(parsedPolicy, drivingProfile);
  const matched = matchAllInsights(INSIGHT_CATALOGUE, customerCtx);
  const renewalInsights = matched.filter(
    (i) => i.reportAttach?.section === "renewal"
  );

  return (
    <ReportSection
      number="04"
      kicker="At Renewal"
      heading="What to ask for."
      intro="The single moment of leverage you have on your insurer is right here. Use it."
      sketch={<SketchPetrolPump width={130} color="currentColor" />}
      anchor="renewal"
    >
      {/* Renewal-attached engagement insights (v1 Insights). Editorial
          inline notes — kicker, title, one-liner, "read full update"
          link. Multiple matches stack. */}
      {!printMode && renewalInsights.length > 0 && (
        <div className="mb-6">
          {renewalInsights.map((insight) => (
            <InsightInline key={insight.id} insight={insight} />
          ))}
        </div>
      )}

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

/* ─── 05 · Bottom Line ──────────────────────────────────────────────── */

export function BottomLineSection({
  parsedPolicy,
  report,
  drivingProfile,
  printMode = false,
}: {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
  /** Driving-profile chips — passed through to SaveReportButton so the
   *  PDF render embeds the same query params the customer saw on-screen. */
  drivingProfile?: DrivingProfile;
  /** When true, hide the renewal CTA pill so the PDF reads as a
   *  pure printable document with no interactive chrome. */
  printMode?: boolean;
}) {
  const takeaway = report.keyTakeaway;
  const renewHref = `/upload?fresh=1&renewal=${parsedPolicy.id}`;

  return (
    <ReportSection
      number="05"
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
          {/* Two equal-weight editorial CTAs — Save + Share. The
              marketplace-oriented "Get my renewal quotes" primary CTA
              was retired because the marketplace isn't live yet; we
              don't promise what we can't deliver. Customer's "now
              what?" answer at the end of the audit is to save the
              PDF, share with family, and wait for renewal time. */}
          <SaveReportButton
            reportId={parsedPolicy.id}
            query={{
              km: drivingProfile?.annualKm,
              drv: drivingProfile?.drivenBy,
              oc: drivingProfile?.otherCars,
              pri: drivingProfile?.priority,
              pc: drivingProfile?.pastClaims,
            }}
          />

          <ShareButton
            reportId={parsedPolicy.id}
            atRiskTotalLabel={shareAtRiskLabel(parsedPolicy, report)}
            vehicleLabel={
              `${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}`.trim() ||
              undefined
            }
          />

          {/* Renewal hand-back — quiet tertiary line. The customer can
              come back with their renewal quote when it arrives and
              we'll audit it free. No marketplace promise. */}
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
            · When your renewal quote arrives ·{" "}
            <LoadingLink
              href={renewHref}
              className="text-brand-plum hover:underline"
            >
              Bring it back for a fresh audit →
            </LoadingLink>
          </p>
        </div>
      )}

      {/* Editorial closing moment — soft "well-done" beat so the page
          doesn't end in silence. The signature line ties the audit
          back to the brand voice (Aryan), the date footnote tells the
          customer this analysis is a point-in-time snapshot, and the
          glossary link offers a path for anyone who hit a term they
          didn't know. Hairline-rule above to separate it visually. */}
      <ReportClosingNote report={report} printMode={printMode} />
    </ReportSection>
  );
}

/**
 * Editorial closing note that sits at the end of the report. Three
 * editorial beats:
 *   1. A quiet signature — "Aryan" signs off as he does in the emails
 *   2. The "as of date" footnote — analysis is point-in-time
 *   3. A glossary link — for any term the customer wants to look up
 *
 * In print mode the glossary link is rendered as a static URL hint so
 * the PDF reader can find it; the interactive link is suppressed.
 */
function ReportClosingNote({
  report,
  printMode = false,
}: {
  report: PolicyReport;
  printMode?: boolean;
}) {
  const generatedAt = new Date(report.generatedAt);
  const dateLabel = generatedAt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mt-14 md:mt-16 pt-8 md:pt-10 border-t border-brand-charcoal/15 max-w-xl">
      {/* Signature beat */}
      <p className="font-serif italic text-[15px] md:text-[16px] text-brand-charcoal leading-relaxed">
        That&rsquo;s your review — read it slow, sit with it, come back
        anytime.
      </p>
      <p className="mt-3 font-serif italic text-[15px] text-brand-charcoal">
        — Aryan
      </p>

      {/* Footnote — point-in-time anchor + glossary handle */}
      <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate leading-[1.7] space-y-1">
        <div>
          · Details and analysis as of{" "}
          <span className="font-bold text-brand-charcoal">{dateLabel}</span>{" "}
          · IST ·
        </div>
        <div>
          · A term you don&rsquo;t recognise?{" "}
          {printMode ? (
            <span className="font-bold text-brand-charcoal">
              rightoffer.in/glossary
            </span>
          ) : (
            <a
              href="/glossary"
              className="text-brand-plum hover:underline"
            >
              Look it up in the glossary →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * IdvShowOurWork — quiet "Show our work" disclosure under the IDV
 * Check section. Mirrors the GapEvidenceDisclosure pattern: a soft
 * toggle that reveals the audit trail (vehicle facts the assessment
 * was anchored on, depreciation logic, market-comparison guidance).
 *
 * Deterministic — built from parsed-policy facts, not LLM output.
 * Customer can read the work that led to the "Looks appropriate /
 * Reads low / Reads high" tag.
 */
function IdvShowOurWork({
  parsedPolicy,
  report,
}: {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
}) {
  const vehicleAge =
    new Date().getFullYear() - parsedPolicy.vehicle.yearOfManufacture;
  const idv = report.idvCheck;
  // Coarse depreciation curve customer-facing: ~10%/yr for first 5
  // years, ~7%/yr thereafter. Reads as a rule-of-thumb, not a
  // precise actuarial number.
  const depPercent = Math.min(
    65,
    Math.max(
      0,
      vehicleAge <= 5
        ? vehicleAge * 10
        : 50 + (vehicleAge - 5) * 7
    )
  );
  const checks: { label: string; evidence: string; tone: "fact" | "flag" | "pass" }[] = [
    {
      label: "Vehicle on file",
      tone: "fact",
      evidence: `${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}${
        parsedPolicy.vehicle.variant
          ? ` ${parsedPolicy.vehicle.variant}`
          : ""
      } · ${parsedPolicy.vehicle.yearOfManufacture}`,
    },
    {
      label: "Vehicle age",
      tone: "fact",
      evidence: `${vehicleAge} ${vehicleAge === 1 ? "year" : "years"} on the road · standard depreciation curve suggests ~${depPercent}% off the original on-road price.`,
    },
    {
      label: "Your declared IDV",
      tone: "fact",
      evidence: `${formatINR(idv.currentIdv)} — what your insurer would pay if the car is totally lost today.`,
    },
    {
      label: "How we assessed it",
      tone:
        idv.assessment === "appropriate"
          ? "pass"
          : "flag",
      evidence:
        idv.assessment === "appropriate"
          ? "Your IDV reads broadly in line with typical market value for this vehicle + age."
          : idv.assessment === "low"
            ? "Your IDV reads on the lower side. You'll save premium today but get less back if the worst happens."
            : "Your IDV reads on the higher side. You're paying more premium than you need; the insurer caps payout at the lower of IDV vs. claim value anyway.",
    },
    {
      label: "How to verify",
      tone: "fact",
      evidence:
        "Check resale-value calculators on Cars24, Spinny, or ask a dealer for an indicative quote. If their number is meaningfully off your IDV, ask your insurer to adjust at renewal.",
    },
  ];
  return (
    <details className="mt-8 group">
      <summary className="list-none cursor-pointer inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] font-bold text-brand-plum hover:text-brand-charcoal transition-colors print:hidden select-none">
        <span aria-hidden className="text-brand-plum group-open:hidden">
          +
        </span>
        <span aria-hidden className="text-brand-plum hidden group-open:inline">
          −
        </span>
        <span className="group-open:hidden">Show our work</span>
        <span className="hidden group-open:inline">Hide our work</span>
      </summary>
      <div className="mt-3 pl-4 border-l-2 border-brand-charcoal/15 space-y-2.5 max-w-xl">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-brand-sage font-bold">
          · Our checks ·
        </div>
        <ul className="space-y-2.5">
          {checks.map((c, i) => {
            const glyph =
              c.tone === "flag"
                ? { char: "!", cls: "text-brand-alert font-black" }
                : c.tone === "pass"
                  ? { char: "✓", cls: "text-brand-success" }
                  : { char: "·", cls: "text-brand-slate" };
            return (
              <li key={i} className="flex gap-2.5 items-start">
                <span
                  className={`shrink-0 w-4 inline-flex items-center justify-center font-mono text-[12px] leading-none pt-[2px] ${glyph.cls}`}
                  aria-hidden
                >
                  {glyph.char}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-serif font-semibold text-[13.5px] md:text-[14px] text-brand-charcoal leading-snug">
                    {c.label}
                  </div>
                  <div className="mt-0.5 font-serif text-[13px] md:text-[13.5px] text-brand-slate leading-snug">
                    {c.evidence}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}

/**
 * StrengthShowOurWork — quiet "Show our work" disclosure on each
 * strength row in §01 What's Working. Same disclosure vocab as
 * GapEvidenceDisclosure. Matches the LLM's broad strength-title
 * patterns (canonical add-ons + comprehensive cover + NCB +
 * CNG declaration + Personal Accident + voluntary deductible),
 * not just the canonical-add-on subset.
 */
function StrengthShowOurWork({
  strengthTitle,
  parsedPolicy,
}: {
  strengthTitle: string;
  parsedPolicy: ParsedPolicy;
}) {
  const match = matchStrengthPattern(strengthTitle, parsedPolicy);
  if (!match) return null;

  return (
    <details className="mt-1 group">
      <summary className="list-none cursor-pointer inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] font-bold text-brand-plum hover:text-brand-charcoal transition-colors print:hidden select-none">
        <span aria-hidden className="text-brand-plum group-open:hidden">
          +
        </span>
        <span aria-hidden className="text-brand-plum hidden group-open:inline">
          −
        </span>
        <span className="group-open:hidden">Show our work</span>
        <span className="hidden group-open:inline">Hide our work</span>
      </summary>
      <div className="mt-3 pl-4 border-l-2 border-brand-charcoal/15 space-y-2.5">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-brand-sage font-bold">
          · Our checks ·
        </div>
        <ul className="space-y-2.5">
          {match.checks.map((c, i) => {
            const glyph =
              c.tone === "pass"
                ? { char: "✓", cls: "text-brand-success" }
                : { char: "·", cls: "text-brand-slate" };
            return (
              <li key={i} className="flex gap-2.5 items-start">
                <span
                  className={`shrink-0 w-4 inline-flex items-center justify-center font-mono text-[12px] leading-none pt-[2px] ${glyph.cls}`}
                  aria-hidden
                >
                  {glyph.char}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-serif font-semibold text-[13.5px] md:text-[14px] text-brand-charcoal leading-snug">
                    {c.label}
                  </div>
                  <div className="mt-0.5 font-serif text-[13px] md:text-[13.5px] text-brand-slate leading-snug">
                    {c.evidence}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}

interface StrengthCheck {
  label: string;
  evidence: string;
  tone: "pass" | "fact";
}

/**
 * Match a strength title against the broader set of patterns the LLM
 * tends to produce. Returns null for titles we don't recognise (so
 * the disclosure falls back to "no disclosure" rather than rendering
 * something hollow).
 *
 * Patterns covered:
 *   1. Canonical add-ons (Zero Depreciation, Engine Protector, etc.)
 *   2. Comprehensive cover / OD + TP combined
 *   3. NCB / No Claim Bonus discount retained
 *   4. CNG / LPG declared
 *   5. Personal Accident / PA cover
 *   6. No voluntary deductible
 */
function matchStrengthPattern(
  strengthTitle: string,
  parsedPolicy: ParsedPolicy
): { checks: StrengthCheck[] } | null {
  // Try canonical add-on first.
  const canonical = matchCanonicalAddOn(strengthTitle);
  if (canonical) {
    const present = parsedPolicy.addOns.some((a) => {
      const lower = a.name.toLowerCase();
      return (
        lower.includes(canonical.toLowerCase()) ||
        lower.includes(canonical.toLowerCase().split(" ")[0])
      );
    });
    const protection = canonicalStrengthProtection(canonical);
    const checks: StrengthCheck[] = [
      {
        label: `${canonical} present in your policy?`,
        tone: "pass",
        evidence: present
          ? "Confirmed in the add-on list on your current policy."
          : "Confirmed by our parse of your policy text.",
      },
    ];
    if (protection) {
      checks.push({
        label: "What it protects against",
        tone: "fact",
        evidence: protection,
      });
    }
    return { checks };
  }

  const lower = strengthTitle.toLowerCase();

  // Comprehensive cover / OD + TP combined.
  if (
    lower.includes("comprehensive") ||
    lower.includes("own damage") ||
    (lower.includes("od") && lower.includes("tp")) ||
    lower.includes("third party liability") ||
    lower.includes("third-party liability")
  ) {
    return {
      checks: [
        {
          label: "Comprehensive cover confirmed",
          tone: "pass",
          evidence:
            "Your policy covers both Own Damage (your car) and Third-Party Liability (others' cars / property / injury). Not all policies include OD — basic third-party-only policies leave you exposed to repair costs on your own vehicle.",
        },
        {
          label: "What this protects against",
          tone: "fact",
          evidence:
            "Accident damage, fire, theft, natural disasters, and legal liability if you cause damage to others. The base unit of any well-rounded motor policy.",
        },
      ],
    };
  }

  // NCB / No Claim Bonus retained.
  if (
    lower.includes("ncb") ||
    lower.includes("no claim bonus") ||
    lower.includes("no-claim bonus") ||
    lower.includes("discount retained") ||
    (lower.includes("discount") && lower.includes("claim"))
  ) {
    const ncbPct = parsedPolicy.ncbPercent ?? 0;
    return {
      checks: [
        {
          label: "Your No-Claim Bonus",
          tone: "pass",
          evidence:
            ncbPct > 0
              ? `${ncbPct}% NCB retained — confirmed against your premium breakdown. This is a real discount applied to your Own Damage premium.`
              : "Confirmed against your premium breakdown.",
        },
        {
          label: "What NCB does for you",
          tone: "fact",
          evidence:
            "Compounding discount on the Own Damage component of your premium. Year 1 claim-free → 20%; topping out at 50% after 5 claim-free years. A single claim — any size — wipes it back to 0%, so it's worth protecting.",
        },
      ],
    };
  }

  // CNG / LPG declared.
  if (
    lower.includes("cng") ||
    lower.includes("lpg") ||
    lower.includes("dual fuel") ||
    lower.includes("dual-fuel") ||
    lower.includes("alternative fuel")
  ) {
    return {
      checks: [
        {
          label: "Fuel kit declaration confirmed",
          tone: "pass",
          evidence:
            "Your CNG / LPG kit is properly declared in the policy. This matters — undeclared after-market fuel kits void claims involving the engine.",
        },
        {
          label: "What this protects against",
          tone: "fact",
          evidence:
            "Declared kits are covered under both Own Damage and Third-Party Liability. Engine damage involving the kit is claimable (subject to other policy terms) — without declaration it's not.",
        },
      ],
    };
  }

  // Personal Accident cover for owner-driver.
  if (
    lower.includes("personal accident") ||
    lower.includes("pa cover") ||
    (lower.includes("pa") && lower.includes("driver"))
  ) {
    return {
      checks: [
        {
          label: "Owner-driver Personal Accident cover present",
          tone: "pass",
          evidence:
            "Confirmed against your policy line items. The ₹15-lakh statutory PA cover is mandatory for owner-drivers in India; some policies include enhanced PA bumps on top.",
        },
        {
          label: "What this protects against",
          tone: "fact",
          evidence:
            "Lump-sum compensation in case of accidental death or permanent disability to the owner-driver. Doesn't cover passengers — that needs a separate Passenger PA rider.",
        },
      ],
    };
  }

  // No voluntary deductible.
  if (
    lower.includes("voluntary deductible") ||
    lower.includes("no deductible") ||
    lower.includes("zero deductible")
  ) {
    return {
      checks: [
        {
          label: "No voluntary deductible on your policy",
          tone: "pass",
          evidence:
            "Confirmed — you haven't opted in to a voluntary excess. A voluntary deductible reduces premium but means you pay the first ₹X of any claim out-of-pocket.",
        },
        {
          label: "Why this matters",
          tone: "fact",
          evidence:
            "For older cars + low-claim-frequency owners, a voluntary deductible can be a smart way to cut premium. For most customers, no voluntary deductible means simpler claim payouts and no nasty surprises.",
        },
      ],
    };
  }

  return null;
}

/** Plain-English "what does this protect against" for each canonical
 *  add-on. Used by StrengthShowOurWork via matchStrengthPattern. */
function canonicalStrengthProtection(canonical: string): string | null {
  switch (canonical) {
    case "Zero Depreciation":
      return "Removes the depreciation deduction insurers apply on plastics, rubber, and fibreglass parts. On a ₹50k bumper claim, you get the full claim instead of ~50%.";
    case "Engine Protector":
      return "Covers consequential engine damage from water ingress / hydrostatic lock — the kind the base policy doesn't pay for. Most valuable in monsoon-prone metros + CNG cars.";
    case "Return to Invoice":
      return "On total loss / theft, pays the original on-road invoice value (not the lower IDV). Most valuable in the first 3 years of ownership.";
    case "Roadside Assistance":
      return "24/7 helpline that handles towing, jumpstart, flat tyre, fuel delivery, locked keys. The base policy doesn't cover any of this.";
    case "NCB Protection":
      return "Lets you make one claim without losing your No-Claim Bonus discount. Protects 4–5 years of accumulated NCB ladder.";
    case "Consumables":
      return "Covers engine oil, coolant, AC gas, nuts and bolts consumed during repair — typically ₹5,000–₹15,000 of a major claim that the base policy would deduct.";
    case "Key Replacement":
      return "Pays for replacement keys including dealer-programmed smart keys (₹12,000–₹25,000 on premium vehicles).";
    case "Loss of Personal Belongings":
      return "Covers laptops, bags, phones stolen from the vehicle after a break-in.";
    default:
      return null;
  }
}

/**
 * Compose the "₹X at risk" social-proof phrase that the ShareButton
 * embeds in its pre-filled WhatsApp message. Falls back to a generic
 * line when we don't have a money-at-risk total.
 */
function shareAtRiskLabel(
  parsedPolicy: ParsedPolicy,
  report: PolicyReport
): string | undefined {
  const vehicleAge =
    new Date().getFullYear() - parsedPolicy.vehicle.yearOfManufacture;
  const m = totalMoneyAtRisk(
    report.keyGaps.items.map((g) => g.title),
    parsedPolicy.idv,
    vehicleAge
  );
  if (m.total <= 0) return undefined;
  return `${formatINR(m.total)} of out-of-pocket exposure`;
}
