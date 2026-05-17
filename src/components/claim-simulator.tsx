"use client";

/**
 * ClaimSimulator — the inline money-grounding card on each gap in
 * §02 What's Missing (Phase 7a).
 *
 * Turns each abstract gap ("Engine Protection missing") into a
 * tangible bill split: "If a claim like this happened today, you'd
 * pay ₹X out of pocket without this cover; ₹Y with it." For
 * scenarios that scale linearly with claim size (Engine Protect,
 * Zero Dep, Consumables, Key Replacement, LoPB), a snap-slider
 * lets the customer dial through realistic claim sizes and watch
 * the out-of-pocket number move in real time. For scenarios that
 * don't scale meaningfully (RSA, RTI, NCB Protection), the slider
 * is hidden and only the baseline reading shows.
 *
 * Editorial discipline (replaces the legacy SaaS-styled version):
 *   - No card frame / shadow / gradient. Hairline left-rule + serif body.
 *   - Bill split sits in a 2-column figure block, tabular-nums.
 *   - "Without this cover" is brand-alert (coral); "With this cover"
 *     is brand-success (teal). The two colours already encode "loss"
 *     vs "covered" everywhere else in the report.
 *   - Slider chrome is quiet — small mono kicker, native input
 *     styled to match the editorial palette (plum thumb).
 *
 * Print mode: render the baseline scenario only, no slider, no
 * interactive chrome — the saved PDF reads as a static document.
 */

import { useState } from "react";
import {
  getClaimScenario,
  getAnnualPremiumEstimate,
  rescaleClaimScenario,
} from "@/lib/claim-scenarios";
import { formatINR } from "@/lib/format";
import type { ParsedPolicy } from "@/lib/types";

export function ClaimSimulator({
  canonical,
  parsedPolicy,
  printMode = false,
}: {
  canonical: string;
  parsedPolicy: ParsedPolicy;
  printMode?: boolean;
}) {
  const vehicleAge =
    new Date().getFullYear() -
    (parsedPolicy.vehicle.yearOfManufacture || new Date().getFullYear());
  const baseline = getClaimScenario(canonical, parsedPolicy.idv, vehicleAge);
  // Bail gracefully if we don't have a scenario for this canonical
  // — the wider gap card still renders; we just don't show a sim.
  if (!baseline) return null;

  const annualPremium = getAnnualPremiumEstimate(canonical, parsedPolicy.idv);
  const sliderAvailable =
    !printMode &&
    !!baseline.scalesWithClaimSize &&
    !!baseline.sliderSnapPoints?.length;

  return (
    <ClaimSimulatorInner
      canonical={canonical}
      vehicleAge={vehicleAge}
      baselineScenario={baseline.scenario}
      baselineClaim={baseline.claimSize}
      baselineSplit={{
        withoutAddOn: baseline.withoutAddOn,
        withAddOn: baseline.withAddOn,
      }}
      annualPremium={annualPremium}
      sliderSnapPoints={baseline.sliderSnapPoints}
      sliderAvailable={sliderAvailable}
    />
  );
}

function ClaimSimulatorInner({
  canonical,
  vehicleAge,
  baselineScenario,
  baselineClaim,
  baselineSplit,
  annualPremium,
  sliderSnapPoints,
  sliderAvailable,
}: {
  canonical: string;
  vehicleAge: number;
  baselineScenario: string;
  baselineClaim: number;
  baselineSplit: {
    withoutAddOn: { insurerPays: number; youPay: number };
    withAddOn: { insurerPays: number; youPay: number };
  };
  annualPremium: number;
  sliderSnapPoints?: number[];
  sliderAvailable: boolean;
}) {
  // The slider's index into snap points; starts on the baseline.
  const snapPoints = sliderSnapPoints ?? [];
  const baselineSnapIdx = snapPoints.findIndex((p) => p === baselineClaim);
  const defaultIdx =
    baselineSnapIdx >= 0
      ? baselineSnapIdx
      : Math.max(0, Math.floor(snapPoints.length / 2));
  const [snapIdx, setSnapIdx] = useState(defaultIdx);

  // Pick the bill split to display: slider position when interactive,
  // baseline otherwise. We compute on each render — it's cheap.
  const activeClaim = sliderAvailable
    ? snapPoints[snapIdx] ?? baselineClaim
    : baselineClaim;
  const rescaled = sliderAvailable
    ? rescaleClaimScenario(canonical, vehicleAge, activeClaim)
    : null;
  const split = rescaled ?? baselineSplit;

  return (
    <div className="mt-2 pl-4 border-l-2 border-brand-alert/30">
      {/* Kicker */}
      <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] font-bold text-brand-alert">
        · If a claim happens ·
      </div>

      {/* Scenario narrative */}
      <p className="mt-1.5 font-serif italic text-[13.5px] md:text-[14px] leading-[1.55] text-brand-charcoal">
        {baselineScenario}
      </p>

      {/* Bill split — two columns. Tabular nums so the numbers line up. */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 max-w-md">
        <BillColumn
          label="Without this cover"
          amount={split.withoutAddOn.youPay}
          tone="alert"
        />
        <BillColumn
          label="With this cover"
          amount={split.withAddOn.youPay}
          tone="success"
        />
      </div>

      {/* Slider — only for scaling scenarios + when not print */}
      {sliderAvailable && snapPoints.length > 1 && (
        <div className="mt-4 print:hidden">
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] font-bold text-brand-plum">
              · Claim size · {formatINR(activeClaim)} ·
            </div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-slate">
              Drag to explore
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={snapPoints.length - 1}
            step={1}
            value={snapIdx}
            onChange={(e) => setSnapIdx(Number(e.target.value))}
            aria-label="Adjust claim size to see how out-of-pocket scales"
            className="mt-1.5 w-full claim-simulator-slider"
          />
          <div className="mt-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-brand-slate">
            <span>{formatINR(snapPoints[0])}</span>
            <span>{formatINR(snapPoints[snapPoints.length - 1])}</span>
          </div>
        </div>
      )}

      {/* Annual premium footnote — what the cover would cost */}
      {annualPremium > 0 && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
          · Cover costs ~{formatINR(annualPremium)}/year ·
        </p>
      )}

      {/* Local slider styling — keeps thumbs editorial (plum, slim).
          Scoped via the descendant class so it doesn't leak. */}
      <style jsx global>{`
        .claim-simulator-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: rgba(60, 50, 90, 0.15);
          border-radius: 999px;
          outline: none;
          cursor: pointer;
        }
        .claim-simulator-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: #6b4f8a; /* brand-plum */
          border: 2px solid #fdfbf6; /* brand-offwhite */
          cursor: grab;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        }
        .claim-simulator-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: #6b4f8a;
          border: 2px solid #fdfbf6;
          cursor: grab;
        }
      `}</style>
    </div>
  );
}

function BillColumn({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: "alert" | "success";
}) {
  const labelCls =
    tone === "alert" ? "text-brand-alert" : "text-brand-success";
  const amountCls =
    tone === "alert" ? "text-brand-alert" : "text-brand-success";
  return (
    <div>
      <div
        className={`font-mono text-[9.5px] uppercase tracking-[0.14em] font-bold ${labelCls}`}
      >
        · {label} ·
      </div>
      <div
        className={`mt-0.5 font-serif font-semibold text-[20px] md:text-[24px] tabular-nums leading-snug ${amountCls}`}
      >
        {formatINR(amount)}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-brand-slate">
        out of pocket
      </div>
    </div>
  );
}
