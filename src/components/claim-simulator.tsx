"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronDown, PlayCircle, AlertTriangle, Shield } from "lucide-react";
import { formatINR } from "@/lib/format";
import {
  getClaimScenario,
  matchCanonicalAddOn,
} from "@/lib/claim-scenarios";

interface Props {
  gapTitle: string;
  idv: number;
  vehicleAge: number;
}

/**
 * Inline expandable claim simulator on each gap card.
 * Click "See what this could cost you" → expands into a side-by-side
 * "without vs with" claim payout comparison with concrete numbers.
 */
export function ClaimSimulator({ gapTitle, idv, vehicleAge }: Props) {
  const [open, setOpen] = useState(false);
  const canonical = matchCanonicalAddOn(gapTitle);
  if (!canonical) return null;
  const scenario = getClaimScenario(canonical, idv, vehicleAge);
  if (!scenario) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-deepblue hover:text-brand-orange transition-colors"
      >
        <PlayCircle className="w-3.5 h-3.5" />
        See what this could cost you
        <ChevronDown
          className={clsx(
            "w-3.5 h-3.5 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="mt-3 rounded-2xl border border-brand-light-gray bg-white p-4 space-y-3">
          {/* Scenario narrative */}
          <div className="text-xs text-brand-charcoal italic leading-relaxed">
            <span className="font-semibold not-italic">Scenario: </span>
            {scenario.scenario}
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-2">
            <SideCard
              title="Without"
              subtitle="Your current policy"
              insurerPays={scenario.withoutAddOn.insurerPays}
              youPay={scenario.withoutAddOn.youPay}
              variant="danger"
            />
            <SideCard
              title="With"
              subtitle={`Add ${canonical}`}
              insurerPays={scenario.withAddOn.insurerPays}
              youPay={scenario.withAddOn.youPay}
              variant="success"
            />
          </div>

          {/* Net delta */}
          <div className="text-[11px] text-center text-brand-slate pt-1">
            Out-of-pocket difference:{" "}
            <span className="font-bold text-brand-orange">
              {formatINR(
                scenario.withoutAddOn.youPay - scenario.withAddOn.youPay
              )}
            </span>{" "}
            in a single incident
          </div>
        </div>
      )}
    </div>
  );
}

function SideCard({
  title,
  subtitle,
  insurerPays,
  youPay,
  variant,
}: {
  title: string;
  subtitle: string;
  insurerPays: number;
  youPay: number;
  variant: "danger" | "success";
}) {
  const themed = variant === "danger";
  return (
    <div
      className={clsx(
        "rounded-xl border p-3",
        themed
          ? "border-red-200 bg-red-50/60"
          : "border-emerald-200 bg-emerald-50/60"
      )}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {themed ? (
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
        ) : (
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
        )}
        <span
          className={clsx(
            "text-[10px] font-bold uppercase tracking-[0.12em]",
            themed ? "text-red-700" : "text-emerald-700"
          )}
        >
          {title}
        </span>
      </div>
      <div className="text-[10px] text-brand-slate mb-2">{subtitle}</div>
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between text-brand-slate">
          <span>Insurer pays</span>
          <span className="tabular-nums font-medium text-brand-charcoal">
            {formatINR(insurerPays)}
          </span>
        </div>
        <div
          className={clsx(
            "flex justify-between font-bold pt-1 border-t",
            themed
              ? "border-red-200 text-red-700"
              : "border-emerald-200 text-emerald-700"
          )}
        >
          <span>You pay</span>
          <span className="tabular-nums">{formatINR(youPay)}</span>
        </div>
      </div>
    </div>
  );
}
