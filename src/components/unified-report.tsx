/**
 * UnifiedReport — the master single-doc report layout (Phase 2a).
 *
 * Composition order, top → bottom:
 *   1. Owner + Vehicle anchor (always above the fold)
 *   2. Aryan's bottom line (verdict)
 *   3. Coverage Snapshot table (the scannable proof)
 *   4. Per-feature insights (anchored to table rows)
 *   5. Things to ask (quotes only)
 *   6. Detailed report (the existing editorial sections — sits below
 *      as the "deep read" for customers who want it)
 *   7. Glossary (terms used in this report)
 *   8. How we read this (trust footer)
 *
 * For multi-doc /reports (Phase 2b) the same layout repeats, with the
 * "Detailed report" section becoming an Annexure containing each doc's
 * full editorial in sequence.
 */

import type { ParsedPolicy, PolicyReport } from "@/lib/types";
import { BottomLineBanner } from "@/components/report-bottom-line";
import { CoverageSnapshotTable } from "@/components/report-coverage-snapshot";
import { FeatureInsightList } from "@/components/report-feature-insights";
import { ThingsToAskBlock } from "@/components/report-things-to-ask";
import { GlossarySection } from "@/components/report-glossary-section";
import { HowWeReadThisFooter } from "@/components/report-how-we-read";
import { ReportDisplay } from "@/components/report-display";

interface Props {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
  view: "investor" | "customer";
  showGate: boolean;
  drivingProfile?: {
    annualKm?: string;
    drivenBy?: string;
    otherCars?: string;
    priority?: string;
    pastClaims?: string;
  };
  printMode?: boolean;
}

export function UnifiedReport({
  parsedPolicy,
  report,
  view,
  showGate,
  drivingProfile,
  printMode,
}: Props) {
  const vehicleLabel =
    `${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}`.trim() ||
    "your car";
  const yearLabel = parsedPolicy.vehicle.yearOfManufacture
    ? ` (${parsedPolicy.vehicle.yearOfManufacture})`
    : "";

  // Glossary detection blob — concatenate the text that's actually
  // shown to the customer so we only surface terms they encountered.
  const glossaryBlob = buildGlossaryBlob(parsedPolicy, report);

  return (
    <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      {/* ── 1. Owner + Vehicle anchor ─────────────────────────────── */}
      <header className="mb-8 pb-6 border-b border-brand-charcoal/15">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
          · Policy review ·
        </div>
        <h1 className="font-serif font-medium text-3xl md:text-[40px] leading-[1.08] tracking-[-0.02em] text-brand-charcoal m-0">
          {vehicleLabel}
          <span className="italic text-brand-plum">{yearLabel}</span>
        </h1>
        <div className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate space-y-0.5">
          {parsedPolicy.owner?.name && (
            <div>Owner · {parsedPolicy.owner.name}</div>
          )}
          <div>
            {parsedPolicy.insurerName} · Policy{" "}
            {parsedPolicy.policyNumber || "—"}
          </div>
          {parsedPolicy.odPeriodStart && parsedPolicy.odPeriodEnd && (
            <div>
              Cover {formatShortDate(parsedPolicy.odPeriodStart)} –{" "}
              {formatShortDate(parsedPolicy.odPeriodEnd)}
            </div>
          )}
        </div>
      </header>

      {/* ── 2. Aryan's bottom line ─────────────────────────────────── */}
      <BottomLineBanner report={report} />

      {/* ── 3. Coverage Snapshot table ─────────────────────────────── */}
      <CoverageSnapshotTable
        mode="single"
        rows={report.coverageSnapshot ?? []}
        vehicleLabel={vehicleLabel}
      />

      {/* ── 4. Feature Insights ────────────────────────────────────── */}
      <FeatureInsightList insights={report.featureInsights} />

      {/* ── 5. Things to ask (quotes only — empty for policies) ──── */}
      <ThingsToAskBlock items={report.thingsToAsk} />

      {/* ── 6. Detailed editorial report ───────────────────────────── */}
      <section className="mt-12 pt-8 border-t border-brand-charcoal/15">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
          · Detailed report ·
        </div>
        <p className="font-serif italic text-[14.5px] text-brand-slate max-w-xl mb-6">
          Everything above, expanded. Read this if you want the long version
          — strengths and gaps section by section, with the specifics
          behind each line of the table.
        </p>
        <ReportDisplay
          parsedPolicy={parsedPolicy}
          report={report}
          view={view}
          showGate={showGate}
          drivingProfile={drivingProfile}
          printMode={printMode}
        />
      </section>

      {/* ── 7. Glossary ────────────────────────────────────────────── */}
      <GlossarySection contentBlob={glossaryBlob} />

      {/* ── 8. How we read this ────────────────────────────────────── */}
      <HowWeReadThisFooter parsedPolicy={parsedPolicy} report={report} />
    </article>
  );
}

/** Build the text blob used for glossary term detection. We concatenate
 *  the user-visible strings — bottom line, snapshot rows, insight bodies,
 *  the existing section descriptions — so the detector only matches
 *  terms the customer can actually encounter on this page. */
function buildGlossaryBlob(
  parsedPolicy: ParsedPolicy,
  report: PolicyReport
): string {
  const parts: string[] = [];
  if (report.bottomLine) parts.push(report.bottomLine);
  if (report.coverageSnapshot) {
    for (const row of report.coverageSnapshot) {
      parts.push(row.feature, row.whatThisMeans);
    }
  }
  if (report.featureInsights) {
    for (const i of report.featureInsights) {
      parts.push(i.feature, i.body);
    }
  }
  if (report.whatCoversWell?.items) {
    for (const item of report.whatCoversWell.items) {
      parts.push(item.title, item.description);
    }
  }
  if (report.keyGaps?.items) {
    for (const item of report.keyGaps.items) {
      parts.push(item.title, item.description);
    }
  }
  if (report.renewalTips?.items) {
    for (const item of report.renewalTips.items) {
      parts.push(item.title, item.description);
    }
  }
  // Always include the policy type since it determines glossary relevance.
  parts.push(parsedPolicy.policyType);
  return parts.filter(Boolean).join(" \n ");
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
