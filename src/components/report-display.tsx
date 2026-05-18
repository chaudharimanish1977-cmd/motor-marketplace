import { ReportGate } from "@/components/report-gate";
import clsx from "clsx";
import type { ParsedPolicy, PolicyReport } from "@/lib/types";
import { ScrollProgress } from "@/components/scroll-progress";
import { ReportGuard } from "@/components/report-guard";
import type { DrivingProfile } from "@/components/driving-profile-card";
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
  // Everything customer-facing flows into the editorial body
  // sections via the full `report` object. The legacy investor
  // admin toggles (pricing snapshot + ideal insurer profile) used
  // to peel destructured fields out here; both retired in 6.1.1.

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
          drivingProfile={drivingProfile}
          printMode={printMode}
        />

        {/* THE GATE — sits between What's Missing (gaps + IDV) and
         *  At Renewal. Below this point is hidden for non-verified
         *  customers. Investors + print-mode see everything. The gate
         *  owns its own editorial framing (hairline section breaks,
         *  serif headline, mono kicker) so we don't double-frame here. */}
        {showGate && view === "customer" && !printMode && (
          <div className="mt-14 md:mt-20 max-w-2xl mx-auto px-5 md:px-6">
            <ReportGate
              reportId={parsedPolicy.id}
              vehiclePlate={
                parsedPolicy.vehicle.registrationNumber || undefined
              }
              vehicleLabel={`${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}`.trim()}
            />
          </div>
        )}

        {(!showGate || view === "investor" || printMode) && (
          <>
            <AtRenewalSection
              parsedPolicy={parsedPolicy}
              report={report}
              drivingProfile={drivingProfile}
              printMode={printMode}
            />
            <BottomLineSection
              parsedPolicy={parsedPolicy}
              report={report}
              drivingProfile={drivingProfile}
              printMode={printMode}
            />

            {/* "Behind the Scenes: Ideal Insurer Profile" admin toggle
             *  and the legacy "Pricing & Savings Snapshot" card have
             *  both been retired here — the IIP belongs in an admin
             *  surface, not the customer-facing report, and the
             *  pricing snapshot data is already folded inline into
             *  AtRenewalSection so the card was redundant. */}

            {/* The driving-profile chips used to live here at the
             *  bottom as decorative chrome. As of Phase 7b they sit
             *  inside §02 What's Missing (right under the heading)
             *  so the customer sees the personalization context
             *  immediately alongside the gaps it shaped. */}

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

