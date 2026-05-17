import { ReportGate } from "@/components/report-gate";
import {
  CheckCircle2,
  IndianRupee,
  Lightbulb,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";
import type { ParsedPolicy, PolicyReport } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { ReportDownloadGate } from "@/components/report-download-gate";
import { ScrollProgress } from "@/components/scroll-progress";
import { ReportGuard } from "@/components/report-guard";
import {
  DrivingProfileCard,
  type DrivingProfile,
} from "@/components/driving-profile-card";
import { SimplifyToggle } from "@/components/simplify-toggle";
import { ReportCover } from "@/components/report-cover";
import { ReportSummary } from "@/components/report-summary";
import {
  WhatsWorkingSection,
  WhatsMissingSection,
  AtRenewalSection,
  BottomLineSection,
} from "@/components/report-body";

interface Props {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
  /** Drives CTA behaviour. Customer view ends here (no bid link). Investor sees full flow. */
  view?: "customer" | "investor";
  /**
   * When true, the customer has NOT verified their email at the gate
   * yet. We render the gate after the "what's missing" section and
   * hide everything below it. Server-resolved by /report/[id].
   */
  showGate?: boolean;
  /** Optional answers captured during the mid-load survey on /upload. */
  drivingProfile?: DrivingProfile;
  /** When true, hide all interactive chrome (CTAs, toggles, guard) so the
   *  page renders cleanly for PDF generation via puppeteer. */
  printMode?: boolean;
}

export function ReportDisplay({
  parsedPolicy,
  report,
  view = "customer",
  showGate = false,
  drivingProfile,
  printMode = false,
}: Props) {
  // Pull only the bits the investor-only admin views still use —
  // everything else flows into the editorial body sections via the
  // full `report` object.
  const { pricingSnapshot, idealInsurerProfile } = report;

  return (
    <div className="min-h-screen bg-brand-offwhite pb-12">
      {!printMode && <ScrollProgress />}
      {view === "customer" && !printMode && <ReportGuard />}
      {/* Phase 6.0 — The Garage cover page. Replaces the old gradient
       *  header bar + at-a-glance strip + VehicleHero card with a
       *  single editorial cover (masthead, headline, smiley rating,
       *  verdict, vehicle factbox). The legacy header + watermark are
       *  intentionally retired here — print-mode keeps the cover too,
       *  so the PDF leads with the same editorial first impression. */}
      <ReportCover parsedPolicy={parsedPolicy} report={report} />

      {/* Summary — Phase 6.1.1 one-page TL;DR. Sits between the
       *  Garage cover and the four detailed body sections so the
       *  customer who wants only the headline + an action button
       *  never has to scroll into the full review. */}
      <ReportSummary
        parsedPolicy={parsedPolicy}
        report={report}
        printMode={printMode}
      />

      {/* Desktop-only controls strip — moved out of the header so the
       *  cover stays clean. Hidden on mobile + in print to keep the
       *  cover composition untouched. */}
      {!printMode && (
        <div className="hidden md:flex items-center justify-end gap-3 max-w-5xl mx-auto px-4 pt-2 pb-1 print:hidden">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
            Generated{" "}
            {new Date(report.generatedAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Kolkata",
            })}{" "}
            IST
          </div>
          <SimplifyToggle />
        </div>
      )}

      {/* Body — Phase 6.1 editorial sections.
       *
       *  01 · What's Working
       *  02 · What's Missing  (gate sits inside this section for
       *                        non-verified customers; we cut the
       *                        article off before the IDV-check
       *                        sub-block and replace with the gate)
       *  03 · At Renewal
       *  04 · Bottom Line
       *
       *  Investor view still gets the legacy admin toggles (Pricing
       *  Snapshot + Ideal Insurer Profile) below the body — they're
       *  not customer-facing and a redesign of those is parked for
       *  Phase 6.2. Same with the Driving Profile + RCP details. */}
      <main
        className={clsx(
          "max-w-5xl mx-auto py-2 md:py-6",
          view === "customer" && !printMode && "report-protected"
        )}
      >
        <WhatsWorkingSection report={report} />

        <WhatsMissingSection
          parsedPolicy={parsedPolicy}
          report={report}
        />

        {/* THE GATE — sits between What's Missing (gaps + IDV) and
         *  At Renewal. Below this point is hidden for non-verified
         *  customers. Investors + print-mode see everything. */}
        {showGate && view === "customer" && !printMode && (
          <div className="mt-14 md:mt-20 max-w-2xl mx-auto px-5 md:px-6">
            <ReportGate reportId={parsedPolicy.id} />
            <p className="mt-4 text-center font-serif italic text-[14px] text-brand-slate">
              The renewal advice, pricing snapshot, and the bottom-line
              unlock once you verify your email above.
            </p>
          </div>
        )}

        {(!showGate || view === "investor" || printMode) && (
          <>
            <AtRenewalSection report={report} />
            <BottomLineSection
              parsedPolicy={parsedPolicy}
              report={report}
              printMode={printMode}
            />

            {/* Investor-only admin toggles — Phase 6.2 will redesign
             *  these properly. For now, kept in place but visually
             *  pushed to the bottom + slightly muted. */}
            {view === "investor" && (
              <div className="mt-16 md:mt-24 max-w-2xl mx-auto px-5 md:px-6 space-y-4">
                <PricingSnapshotCard snapshot={pricingSnapshot} />
                <IdealInsurerProfileToggle profile={idealInsurerProfile} />
              </div>
            )}

            {/* Optional driving profile chips — only when the user
             *  answered the mid-load survey. Visually demoted to a
             *  small editorial footnote pending the Phase 6.2
             *  embed-into-body work. */}
            {drivingProfile && (
              <div className="mt-12 md:mt-16 max-w-2xl mx-auto px-5 md:px-6">
                <DrivingProfileCard
                  initialProfile={drivingProfile}
                  reportId={parsedPolicy.id}
                />
              </div>
            )}

            {/* Disclaimer — editorial mono footnote */}
            <div className="mt-12 md:mt-16 max-w-2xl mx-auto px-5 md:px-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate text-center">
                · General information guide · Please refer to policy wordings for exact terms ·
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function PricingSnapshotCard({
  snapshot,
}: {
  snapshot: PolicyReport["pricingSnapshot"];
}) {
  return (
    <div className="rounded-2xl border-2 border-brand-navy/40 bg-white shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-brand-navy to-brand-navy text-white font-bold px-5 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
          5.5
        </div>
        <span className="text-sm md:text-base uppercase tracking-wide">
          Pricing &amp; Savings Snapshot
        </span>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 bg-brand-olive text-brand-ink rounded">
          NEW
        </span>
      </div>
      <div className="bg-gradient-to-br from-white to-brand-navy/10 p-6 space-y-5">
        <div className="grid md:grid-cols-3 gap-4">
          <PricingCell
            label="Your Current Premium"
            value={formatINR(snapshot.currentPremium)}
            sub="What you paid"
          />
          <PricingCell
            label="Recommended Range"
            value={`${formatINR(snapshot.recommendedRangeMin)} – ${formatINR(snapshot.recommendedRangeMax)}`}
            sub="Optimal coverage estimate"
            highlight
          />
          {snapshot.hasPremiumSavings && snapshot.estimatedSavings ? (
            <PricingCell
              label="Estimated Savings"
              value={formatINR(snapshot.estimatedSavings)}
              sub="If you switch with curation"
              positive
            />
          ) : (
            <PricingCell
              label="Better Value"
              value="Right Cover"
              sub="At the right price"
              positive
            />
          )}
        </div>

        <p className="report-detail text-brand-charcoal leading-relaxed">{snapshot.narrative}</p>

        <div className="report-detail bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="font-semibold text-amber-900 text-sm mb-1">
              Real-world example
            </div>
            <p className="text-sm text-amber-900">{snapshot.claimTimeExample}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCell({
  label,
  value,
  sub,
  highlight = false,
  positive = false,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border p-4",
        highlight
          ? "border-brand-navy/40 bg-brand-navy/10"
          : positive
            ? "border-emerald-300 bg-emerald-50"
            : "border-brand-light-gray bg-white"
      )}
    >
      <div className="text-[10px] text-brand-slate uppercase tracking-wider font-semibold mb-1">
        {label}
      </div>
      <div
        className={clsx(
          "font-bold",
          positive ? "text-emerald-700" : "text-brand-charcoal",
          value.length > 12 ? "text-lg" : "text-2xl"
        )}
      >
        {value}
      </div>
      <div className="text-xs text-brand-slate mt-1">{sub}</div>
    </div>
  );
}

function IdealInsurerProfileToggle({
  profile,
}: {
  profile: PolicyReport["idealInsurerProfile"];
}) {
  return (
    <details className="rounded-2xl border-2 border-dashed border-brand-plum/40 bg-brand-plum/10 p-6 group">
      <summary className="cursor-pointer flex items-center gap-3 list-none">
        <div className="w-9 h-9 rounded-lg bg-brand-plum/20 flex items-center justify-center">
          <Lock className="w-5 h-5 text-brand-plum" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-brand-plum flex items-center gap-2">
            Behind the Scenes: Ideal Insurer Profile
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-brand-plum/20 text-brand-plum rounded">
              Admin View
            </span>
          </div>
          <div className="text-xs text-brand-plum mt-0.5">
            Customer never sees this. Reveals the platform&apos;s matching logic
            for the pitch demo.
          </div>
        </div>
        <Eye className="w-5 h-5 text-brand-plum group-open:hidden" />
        <EyeOff className="w-5 h-5 text-brand-plum hidden group-open:block" />
      </summary>

      <div className="mt-5 space-y-4">
        <div className="text-sm text-brand-plum bg-white border border-brand-plum/30 rounded-lg p-3">
          The platform&apos;s matching engine pre-selects insurers most likely
          to bid competitively for this customer. The actual{" "}
          <strong>winning bid</strong> is determined by the marketplace&apos;s
          3-tier reverse auction (insurer preferences → real-time API → manual
          underwriter pool), not by these recommendations.
        </div>

        <div>
          <div className="text-xs font-semibold text-brand-plum uppercase mb-2">
            Recommended insurers for this customer profile
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {profile.recommendedInsurers.map((ins) => (
              <div
                key={ins.name}
                className="bg-white border border-brand-plum/30 rounded-lg p-3"
              >
                <div className="font-semibold text-brand-charcoal text-sm">
                  {ins.name}
                </div>
                <div className="text-xs text-brand-slate mt-0.5">
                  {ins.reasoning}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-brand-plum uppercase mb-2">
            Selection criteria
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.selectionCriteria.map((c) => (
              <span
                key={c}
                className="text-xs bg-white border border-brand-plum/30 px-2.5 py-1 rounded-full text-brand-plum"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}

