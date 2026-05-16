"use client";

import Link from "next/link";
import { LoadingLink } from "@/components/loading-link";
import clsx from "clsx";
import {
  CheckCircle2,
  Minus,
  Trophy,
  ArrowRight,
  Building2,
} from "lucide-react";
import type { ParsedPolicy, TierSummary } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { InsurerLogo } from "@/components/insurer-logos";

interface Props {
  parsedPolicy: ParsedPolicy;
  tiers: TierSummary[];
}

const ALL_CANONICAL_ADDONS = [
  "Engine Protector",
  "Roadside Assistance",
  "NCB Protection",
  "Consumables",
  "Zero Depreciation",
  "Return to Invoice",
  "Key Replacement",
  "Loss of Personal Belongings",
];

const TIER_BEST_FOR: Record<number, string> = {
  1: "Tight budget — save money but minimal coverage",
  2: "Most customers — balanced cover at modest premium",
  3: "Maximum protection — peace of mind with all add-ons",
};

export function TierComparisonMatrix({ parsedPolicy, tiers }: Props) {
  const currentPremium = parsedPolicy.premium.grandTotal;
  const availableTiers = tiers.filter((t) => t.available && t.bids.length > 0);

  // Only show add-ons that appear in at least one tier (cleaner matrix)
  const usedAddOns = ALL_CANONICAL_ADDONS.filter((addOn) =>
    availableTiers.some((t) => t.includedAddOns.includes(addOn))
  );

  return (
    <div className="bg-white rounded-3xl border border-brand-light-gray shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header — tier names */}
          <thead>
            <tr className="border-b-2 border-brand-light-gray bg-brand-offwhite">
              <th className="text-left p-4 font-semibold text-brand-slate text-xs uppercase tracking-[0.1em] min-w-[140px]">
                Feature
              </th>
              {availableTiers.map((tier) => {
                const themeBg =
                  tier.tier === 1
                    ? "from-brand-charcoal to-brand-slate"
                    : tier.tier === 2
                      ? "from-brand-navy to-brand-plum"
                      : "from-brand-plum to-brand-coral";
                return (
                  <th
                    key={tier.tier}
                    className="p-4 min-w-[180px] text-center"
                  >
                    <div
                      className={clsx(
                        "rounded-2xl bg-gradient-to-br text-white p-3",
                        themeBg
                      )}
                    >
                      <div className="text-[9px] uppercase tracking-[0.12em] opacity-80">
                        Tier {tier.tier}
                      </div>
                      <div className="text-base font-bold">{tier.label}</div>
                      {tier.tier === 2 && (
                        <div className="text-[10px] mt-1 inline-block px-1.5 py-0.5 bg-white text-brand-navy rounded-full font-bold uppercase tracking-wide">
                          Recommended
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {/* Price row */}
            <tr className="border-b border-brand-light-gray">
              <td className="p-4 font-semibold text-brand-charcoal text-xs uppercase tracking-[0.1em]">
                Annual Premium
              </td>
              {availableTiers.map((tier) => {
                const win = tier.bids[0];
                const delta = win.grandTotal - currentPremium;
                return (
                  <td key={tier.tier} className="p-4 text-center">
                    <div className="text-2xl font-bold text-brand-charcoal tabular-nums">
                      {formatINR(win.grandTotal)}
                    </div>
                    <div
                      className={clsx(
                        "text-[10px] mt-1 font-medium",
                        delta < 0
                          ? "text-brand-success"
                          : delta < 5000
                            ? "text-brand-slate"
                            : "text-brand-coral"
                      )}
                    >
                      {delta < 0
                        ? `Save ${formatINR(-delta)}`
                        : delta === 0
                          ? "Same as current"
                          : `+ ${formatINR(delta)} vs current`}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Winning insurer */}
            <tr className="border-b border-brand-light-gray bg-brand-offwhite/40">
              <td className="p-4 font-semibold text-brand-charcoal text-xs uppercase tracking-[0.1em]">
                Winning Insurer
              </td>
              {availableTiers.map((tier) => {
                const win = tier.bids[0];
                return (
                  <td key={tier.tier} className="p-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <InsurerLogo
                        insurerName={win.insurerName}
                        size={18}
                      />
                      <span className="font-semibold text-xs text-brand-charcoal">
                        {win.insurerName.split(" ").slice(0, 2).join(" ")}
                      </span>
                    </div>
                    <div className="text-[10px] text-brand-slate mt-1">
                      CSR {win.claimSettlementRatio.split(" ")[0]}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Coverage rows */}
            <tr className="border-b border-brand-light-gray">
              <td colSpan={availableTiers.length + 1} className="p-3 bg-brand-navy/10">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-navy">
                  Coverage
                </div>
              </td>
            </tr>
            {/* Base coverage (always included) */}
            <CoverageRow label="Own Damage" tiers={availableTiers} always />
            <CoverageRow label="Third Party Liability" tiers={availableTiers} always />
            <CoverageRow label="Personal Accident (₹15L)" tiers={availableTiers} always />

            {/* Add-on rows */}
            {usedAddOns.map((addOn) => (
              <AddOnRow
                key={addOn}
                addOn={addOn}
                tiers={availableTiers}
              />
            ))}

            {/* Best for row */}
            <tr className="border-b-2 border-brand-light-gray bg-brand-offwhite/40">
              <td className="p-4 font-semibold text-brand-charcoal text-xs uppercase tracking-[0.1em]">
                Best for
              </td>
              {availableTiers.map((tier) => (
                <td
                  key={tier.tier}
                  className="p-4 text-center text-xs text-brand-slate italic"
                >
                  {TIER_BEST_FOR[tier.tier]}
                </td>
              ))}
            </tr>

            {/* CTAs */}
            <tr>
              <td className="p-4"></td>
              {availableTiers.map((tier) => {
                const win = tier.bids[0];
                const themeCta =
                  tier.tier === 1
                    ? "bg-brand-charcoal hover:brightness-110"
                    : tier.tier === 2
                      ? "bg-brand-olive hover:brightness-110 shadow-glow"
                      : "bg-gradient-to-r from-brand-plum to-brand-coral hover:brightness-110";
                return (
                  <td key={tier.tier} className="p-4 space-y-2">
                    <LoadingLink
                      href={`/offer/${win.id}`}
                      className="block w-full text-center text-xs font-semibold py-2 rounded-xl border-2 border-brand-navy text-brand-navy hover:bg-brand-navy/10"
                      spinnerPosition="right"
                    >
                      See breakdown
                    </LoadingLink>
                    <LoadingLink
                      href={`/checkout/${win.id}`}
                      className={clsx(
                        "block w-full text-center text-xs font-bold py-2.5 rounded-xl text-white transition-all hover:scale-[1.01]",
                        themeCta
                      )}
                      spinnerPosition="right"
                    >
                      <span className="inline-flex items-center gap-1">
                        Buy
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </LoadingLink>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CoverageRow({
  label,
  tiers,
  always = false,
}: {
  label: string;
  tiers: TierSummary[];
  always?: boolean;
}) {
  return (
    <tr className="border-b border-brand-light-gray">
      <td className="p-3.5 text-sm text-brand-charcoal">{label}</td>
      {tiers.map((tier) => (
        <td key={tier.tier} className="p-3.5 text-center">
          {always ? (
            <CheckCircle2 className="w-5 h-5 text-brand-success mx-auto" />
          ) : (
            <Minus className="w-5 h-5 text-brand-light-gray mx-auto" />
          )}
        </td>
      ))}
    </tr>
  );
}

function AddOnRow({
  addOn,
  tiers,
}: {
  addOn: string;
  tiers: TierSummary[];
}) {
  return (
    <tr className="border-b border-brand-light-gray hover:bg-brand-offwhite/30 transition-colors">
      <td className="p-3.5 text-sm text-brand-charcoal">{addOn}</td>
      {tiers.map((tier) => {
        const included = tier.includedAddOns.includes(addOn);
        return (
          <td key={tier.tier} className="p-3.5 text-center">
            {included ? (
              <CheckCircle2 className="w-5 h-5 text-brand-success mx-auto" />
            ) : (
              <Minus className="w-4 h-4 text-brand-light-gray mx-auto" />
            )}
          </td>
        );
      })}
    </tr>
  );
}

// Reserved for future tier-specific badges
void Trophy;
void Building2;
