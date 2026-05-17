/**
 * FleetSummary — the editorial "your fleet at a glance" card shown
 * at the top of /me when the customer has 2+ distinct vehicles
 * (Phase 7e).
 *
 * Surfaces three fleet-level facts the per-policy cards underneath
 * don't make obvious in isolation:
 *
 *   1. How many cars + how many policies sit on the account
 *   2. Which renewal is up first (and how soon)
 *   3. The total claim-time out-of-pocket exposure summed across
 *      every active policy in the fleet — the "spend X to close
 *      ₹Y" framing the audit hammers on per-policy, lifted to a
 *      household level
 *
 * Hidden when the customer has only one vehicle — the existing
 * per-policy card already says everything this would. Hidden in
 * the upload-session view too: that mode can only see docs from
 * one browser, so the "fleet" framing is misleading there.
 */

import type { ParsedPolicy, PolicyReport } from "@/lib/types";
import { totalMoneyAtRisk } from "@/lib/claim-scenarios";
import { formatINR } from "@/lib/format";

interface PortalPolicy {
  parsed: ParsedPolicy;
  report: PolicyReport | null;
  daysUntilExpiry: number;
  bucket: "active" | "quote" | "expired";
}

interface Props {
  /** All policies the portal is showing the customer, after dedup
   *  by policyGroupKey but before bucket filtering. Used to derive
   *  fleet-wide counts. */
  policies: PortalPolicy[];
  /** Active-bucket policies, soonest-to-expire first (the same order
   *  /me renders them in). The first element is the "next renewal". */
  active: PortalPolicy[];
}

/**
 * Normalise a vehicle into a stable "this is one car" key for fleet
 * dedup. Strips registration whitespace, falls back to make+model
 * when reg is missing — mirrors policyGroupKey's approach.
 */
function vehicleKey(p: ParsedPolicy): string {
  const reg = (p.vehicle.registrationNumber ?? "")
    .replace(/[\s-]+/g, "")
    .toUpperCase()
    .trim();
  if (reg) return `reg:${reg}`;
  const make = (p.vehicle.make ?? "").toLowerCase().trim();
  const model = (p.vehicle.model ?? "").toLowerCase().trim();
  return `mm:${make}|${model}`;
}

export function FleetSummary({ policies, active }: Props) {
  // Dedup down to distinct physical cars.
  const distinctVehicleKeys = new Set(
    policies.map((p) => vehicleKey(p.parsed))
  );
  const vehicleCount = distinctVehicleKeys.size;
  // Less than 2 cars → existing per-policy card already says it all.
  if (vehicleCount < 2) return null;

  const policyCount = policies.length;

  // Next renewal — first item in the active array (already sorted
  // soonest-first by the loader). For the headline we report only
  // when active.length > 0; otherwise just skip the renewal line.
  const next = active[0];
  const nextLabel = next
    ? `${next.parsed.vehicle.make} ${next.parsed.vehicle.model}`.trim()
    : null;
  const nextYearLabel = next?.parsed.vehicle.yearOfManufacture
    ? `(${next.parsed.vehicle.yearOfManufacture})`
    : "";
  const nextWindow = next
    ? next.daysUntilExpiry > 0
      ? `in ${next.daysUntilExpiry} ${next.daysUntilExpiry === 1 ? "day" : "days"}`
      : next.daysUntilExpiry === 0
        ? "today"
        : `${Math.abs(next.daysUntilExpiry)} days ago`
    : "";

  // Total at-risk — sum the per-policy out-of-pocket exposure across
  // every active policy that has a report. Expired policies have no
  // live exposure (cover lapsed); quotes aren't bound yet.
  let totalAtRisk = 0;
  let activeWithReportCount = 0;
  for (const a of active) {
    if (!a.report) continue;
    const vehicleAge =
      new Date().getFullYear() -
      (a.parsed.vehicle.yearOfManufacture || new Date().getFullYear());
    const m = totalMoneyAtRisk(
      a.report.keyGaps.items.map((g) => g.title),
      a.parsed.idv,
      vehicleAge
    );
    totalAtRisk += m.total;
    activeWithReportCount += 1;
  }

  return (
    <section
      aria-label="Fleet summary"
      className="mb-8 pl-5 border-l-4 border-brand-plum"
    >
      {/* Kicker + counts */}
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold">
          · Your fleet ·
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate tabular-nums">
          {vehicleCount} {vehicleCount === 1 ? "car" : "cars"} ·{" "}
          {policyCount} {policyCount === 1 ? "policy" : "policies"}
        </div>
      </div>

      {/* Two-column figure block: next renewal + at-risk total.
          Stacks on mobile, side-by-side on desktop. */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {next && (
          <div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-slate font-bold">
              · Next renewal ·
            </div>
            <div className="mt-1 font-serif font-semibold text-[20px] md:text-[22px] tracking-[-0.01em] text-brand-charcoal leading-snug">
              {nextLabel}
              {nextYearLabel && (
                <span className="ml-2 font-serif italic text-brand-plum font-medium text-[16px] md:text-[18px]">
                  {nextYearLabel}
                </span>
              )}
            </div>
            <div className="mt-0.5 font-serif italic text-[14px] text-brand-slate">
              {nextWindow}
            </div>
          </div>
        )}

        {totalAtRisk > 0 && (
          <div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-alert font-bold">
              · At risk across the fleet ·
            </div>
            <div className="mt-1 font-serif font-semibold text-[24px] md:text-[28px] tabular-nums text-brand-charcoal leading-snug">
              {formatINR(totalAtRisk)}
            </div>
            <div className="mt-0.5 font-serif italic text-[14px] text-brand-slate">
              summed across {activeWithReportCount}{" "}
              {activeWithReportCount === 1
                ? "active policy"
                : "active policies"}
              {" · today"}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
