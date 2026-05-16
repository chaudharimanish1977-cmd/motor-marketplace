"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronDown, AlertTriangle, Shield, Wallet } from "lucide-react";
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
 * Inline claim simulator on each gap card. Visible by default —
 * "what this could cost you" is the reason the gap matters, so showing it
 * up front (instead of hiding behind a click) is the whole point.
 *
 * The side-by-side detail can be collapsed for users who want to skim, but
 * the headline out-of-pocket number stays visible always.
 */
export function ClaimSimulator({ gapTitle, idv, vehicleAge }: Props) {
  const [showDetail, setShowDetail] = useState(true);
  const canonical = matchCanonicalAddOn(gapTitle);
  if (!canonical) return null;
  const scenario = getClaimScenario(canonical, idv, vehicleAge);
  if (!scenario) return null;

  const outOfPocketDelta =
    scenario.withoutAddOn.youPay - scenario.withAddOn.youPay;

  return (
    <div className="mt-3">
      {/* Always-visible headline: the cost story in one line */}
      <div className="rounded-xl border-2 border-brand-coral/30 bg-gradient-to-br from-brand-coral/10 to-white p-3.5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-olive/15 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-brand-coral" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-coral mb-0.5">
              What this could cost you
            </div>
            <div className="text-sm text-brand-charcoal leading-snug">
              <span className="font-bold tabular-nums text-brand-coral text-base">
                {formatINR(outOfPocketDelta)}
              </span>{" "}
              out of your pocket if{" "}
              <span className="text-brand-charcoal/80">
                {scenario.scenario.toLowerCase()}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDetail((s) => !s)}
            aria-label={
              showDetail ? "Hide breakdown" : "Show breakdown"
            }
            className="text-brand-slate hover:text-brand-charcoal transition-colors shrink-0 p-1"
          >
            <ChevronDown
              className={clsx(
                "w-4 h-4 transition-transform",
                !showDetail && "-rotate-90"
              )}
            />
          </button>
        </div>

        {showDetail && (
          <div className="mt-3 pt-3 border-t border-brand-coral/20 grid grid-cols-2 gap-2">
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
        )}
      </div>
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
