"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Trophy,
  Settings2,
  Plus,
  Minus,
  Loader2,
  Sparkles,
  Shield,
  Wrench,
  Truck,
  Award,
  Key,
  Briefcase,
  ShieldCheck,
  FileText,
  Info,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import type {
  ParsedPolicy,
  Bid,
  RFQ,
  PolicyReport,
} from "@/lib/types";
import { formatINR } from "@/lib/format";
import { estimateAddOnPremium } from "@/lib/insurer-personas";
import { NumberPlate } from "@/components/number-plate";

interface Props {
  parsedPolicy: ParsedPolicy;
  bid: Bid;
  rfq: RFQ;
  report?: PolicyReport;
}

// Canonical add-on catalogue with icons + descriptions (mirrors bundle-builder)
const ADD_ON_CATALOG: { name: string; description: string; icon: LucideIcon }[] = [
  { name: "Zero Depreciation", description: "Full claim payout without depreciation deductions.", icon: ShieldCheck },
  { name: "Engine Protector", description: "Covers water ingress, hydrostatic lock & engine damage.", icon: Wrench },
  { name: "Return to Invoice", description: "Pays invoice value (not just IDV) in total loss/theft.", icon: FileText },
  { name: "Roadside Assistance", description: "24×7 towing, flat tyre, jump-start, fuel, lockout.", icon: Truck },
  { name: "NCB Protection", description: "Protects your No-Claim Bonus discount even after a claim.", icon: Award },
  { name: "Consumables", description: "Covers oil, nuts, bolts, coolant, AC gas — usually deducted.", icon: Briefcase },
  { name: "Key Replacement", description: "Lost/stolen keys covered up to ₹50,000.", icon: Key },
  { name: "Loss of Personal Belongings", description: "Reimburses items lost from a damaged vehicle.", icon: Briefcase },
];

// PA owner + PA unnamed + LL driver. Derived dynamically per-bid below from
// `bid.totalPackage - basicOd - basicTp - addOnPremium` so the breakdown
// reconciles to bid.grandTotal exactly; this constant is the fallback when
// the math comes out non-positive for an unusually-shaped bid.
const MANDATORY_FALLBACK = 625;

export function OfferDetail({
  parsedPolicy,
  bid,
  rfq,
  report,
}: Props) {
  const router = useRouter();
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(
    () => new Set(bid.tierIncludedAddOns)
  );
  const [updating, setUpdating] = useState(false);

  const recommendationsByName = useMemo(() => {
    const map = new Map<
      string,
      "essential" | "optional" | "drop" | undefined
    >();
    for (const r of report?.addOnRecommendations ?? []) {
      map.set(r.name, r.recommendation);
    }
    return map;
  }, [report]);

  // Derive the bid's actual mandatory amount from the bid itself so the
  // breakdown reconciles to bid.grandTotal. Falls back to the constant if
  // the math doesn't land on a positive number.
  const mandatoryAmount = useMemo(() => {
    const m = bid.totalPackage - bid.basicOd - bid.basicTp - bid.addOnPremium;
    return m > 0 ? m : MANDATORY_FALLBACK;
  }, [bid]);

  // Scale per-add-on `estimateAddOnPremium()` values so the sum across the
  // bid's originally-included add-ons equals the insurer's actual
  // `bid.addOnPremium`. Without this, the customize toggles display prices
  // that don't add up to the tier total the customer saw on the previous
  // screen ("Pick your coverage level"), which reads as broken arithmetic.
  // The same scale factor is used for add-ons toggled ON that weren't in
  // the original tier (best approximation we have client-side until the
  // re-quote endpoint runs).
  const addOnScale = useMemo(() => {
    const sumRawEstimates = bid.tierIncludedAddOns.reduce(
      (s, n) => s + estimateAddOnPremium(n, rfq.desiredIdv),
      0,
    );
    if (sumRawEstimates === 0) return 1;
    return bid.addOnPremium / sumRawEstimates;
  }, [bid, rfq]);

  // Per-add-on display price (pre-GST). For tier-included add-ons these
  // sum exactly to bid.addOnPremium. For add-ons not in the tier we apply
  // the same scale factor — close enough that the live estimate stays
  // close to what a re-quote would actually return.
  const scaledAddOnEstimate = (name: string) =>
    Math.round(estimateAddOnPremium(name, rfq.desiredIdv) * addOnScale);

  // Compute live price estimate using the scaled per-add-on values + the
  // bid's actual base components. With the customer's original selection,
  // this resolves to bid.grandTotal exactly (rounded to 10). As toggles
  // change, the total moves by the GST-inclusive value of each delta.
  const liveEstimate = useMemo(() => {
    const addOnsTotal = [...selectedAddOns].reduce(
      (sum, name) => sum + scaledAddOnEstimate(name),
      0,
    );
    const subtotal = bid.basicOd + bid.basicTp + mandatoryAmount + addOnsTotal;
    const gst = subtotal * 0.18;
    return Math.round((subtotal + gst) / 10) * 10;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddOns, bid, rfq, mandatoryAmount, addOnScale]);

  // Detect whether the customer has changed the selection from the bid's original
  const originalSet = useMemo(
    () => new Set(bid.tierIncludedAddOns),
    [bid.tierIncludedAddOns]
  );
  const hasChanges = useMemo(() => {
    if (selectedAddOns.size !== originalSet.size) return true;
    for (const name of selectedAddOns) {
      if (!originalSet.has(name)) return true;
    }
    return false;
  }, [selectedAddOns, originalSet]);

  const toggle = (name: string) => {
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const resetToOriginal = () => setSelectedAddOns(new Set(originalSet));

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await fetch("/api/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parsedPolicyId: parsedPolicy.id,
          selectedAddOns: [...selectedAddOns],
          desiredIdv: rfq.desiredIdv,
          hasPreExistingClaim: rfq.hasPreExistingClaim,
          preExistingClaimDetails: rfq.preExistingClaimDetails,
        }),
      });
      if (!res.ok) throw new Error("Failed to re-quote");
      const data = await res.json();
      router.push(`/bid/${parsedPolicy.id}/results?rfq=${data.rfqId}`);
    } catch (err) {
      setUpdating(false);
      alert(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const currentPremium = parsedPolicy.premium.grandTotal;
  const tierTheme = getTierTheme(bid.tier);

  if (updating) return <UpdatingState insurerName={bid.insurerName} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top nav */}
      <header className="sticky top-0 z-20 backdrop-blur-lg bg-white/70 border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <Link
            href={`/bid/${parsedPolicy.id}/results`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All offers
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {parsedPolicy.vehicle.make} {parsedPolicy.vehicle.model}
            </span>
            <NumberPlate
              value={parsedPolicy.vehicle.registrationNumber}
              size="sm"
            />
          </div>
          <Link
            href={`/bid/${parsedPolicy.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Full bundle editor
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero — full-width gradient panel */}
        <section
          className={clsx(
            "relative overflow-hidden rounded-3xl p-8 md:p-10 text-white shadow-2xl mb-8",
            "bg-gradient-to-br",
            tierTheme.heroGradient
          )}
        >
          {/* Decorative orb */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {bid.isWinner && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 bg-emerald-400 text-emerald-950 rounded-full">
                  <Trophy className="w-3 h-3" />
                  Tier Winner
                </span>
              )}
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full">
                Tier {bid.tier} · {bid.tierLabel}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-end">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 opacity-80" />
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {bid.insurerName}
                  </h1>
                </div>
                <p className="text-sm opacity-80 italic mb-4">
                  {bid.insurerTagline}
                </p>
                <p className="text-base opacity-95 leading-relaxed max-w-md">
                  &ldquo;{bid.uniqueSellingPoint}&rdquo;
                </p>
              </div>

              <div className="md:text-right">
                <div className="text-[10px] uppercase tracking-[0.15em] opacity-70 mb-1">
                  Total Annual Premium
                </div>
                <div className="text-5xl md:text-6xl font-bold tracking-tight tabular-nums">
                  {formatINR(bid.grandTotal).replace("₹", "")}
                </div>
                <div className="text-sm opacity-80 mt-1">
                  ₹ INR &middot; per year
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/15 flex items-center gap-6 flex-wrap text-xs opacity-90">
              <Stat label="Garage Network" value={bid.garageNetworkSize} />
              <Stat label="Claim Settlement" value={bid.claimSettlementRatio} />
              <Stat
                label="Tier"
                value={`Tier ${bid.tier} of 3`}
              />
            </div>
          </div>
        </section>

        {/* Two-column layout: left = details, right = sticky live summary */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column — details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customize this offer (TOGGLES) */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-navy" />
                    Customize this offer
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Toggle any add-on to see live price impact. Then update to get a fresh quote.
                  </p>
                </div>
                {hasChanges && (
                  <button
                    onClick={resetToOriginal}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    Reset to original
                  </button>
                )}
              </div>

              <div className="space-y-2 mt-5">
                {ADD_ON_CATALOG.map((cat) => {
                  const isSelected = selectedAddOns.has(cat.name);
                  const isInOriginal = originalSet.has(cat.name);
                  const rec = recommendationsByName.get(cat.name);
                  // Scaled price so the sum of tier-included add-ons equals
                  // bid.addOnPremium — matches what the customer saw on the
                  // "Pick your coverage level" screen.
                  const price = scaledAddOnEstimate(cat.name);
                  return (
                    <AddOnToggle
                      key={cat.name}
                      icon={cat.icon}
                      name={cat.name}
                      description={cat.description}
                      price={price}
                      isSelected={isSelected}
                      isInOriginal={isInOriginal}
                      recommendation={rec}
                      onToggle={() => toggle(cat.name)}
                    />
                  );
                })}
              </div>

              {hasChanges && (
                <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm text-amber-900">
                    <div className="font-semibold mb-0.5">
                      You&apos;ve modified the offer
                    </div>
                    <p className="text-xs text-amber-800">
                      Live estimate shown. Click &ldquo;Update offer&rdquo; below to run a
                      fresh 3-insurer auction with your changes.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Premium breakdown */}
            <PremiumBreakdownCard
              bid={bid}
              parsedPolicy={parsedPolicy}
              rfq={rfq}
              mandatoryAmount={mandatoryAmount}
              addOnScale={addOnScale}
            />

            {/* Comparison vs current */}
            <ComparisonCard
              bid={bid}
              parsedPolicy={parsedPolicy}
              rfq={rfq}
              addOnScale={addOnScale}
            />

            {/* What's covered */}
            <WhatsCoveredCard tierIncludedAddOns={bid.tierIncludedAddOns} />
          </div>

          {/* Right column — sticky price summary */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden">
                {/* Live price */}
                <div className="p-6 bg-gradient-to-br from-slate-50 to-white">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-1">
                    {hasChanges ? "Estimated New Total" : "Total Premium"}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-slate-900 tabular-nums tracking-tight">
                      {formatINR(hasChanges ? liveEstimate : bid.grandTotal)}
                    </span>
                  </div>
                  <DeltaBadge
                    delta={
                      (hasChanges ? liveEstimate : bid.grandTotal) -
                      currentPremium
                    }
                    currentPremium={currentPremium}
                  />

                  {/* 5-year projection — anchors customer to long-term value */}
                  {!hasChanges && (
                    <FiveYearProjection
                      annualPremium={bid.grandTotal}
                      currentPremium={currentPremium}
                    />
                  )}

                  {hasChanges && (
                    <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                      Live estimate · final price confirmed when you click
                      &ldquo;Update offer&rdquo;
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 space-y-2 bg-brand-offwhite/50 border-t border-brand-light-gray">
                  {hasChanges ? (
                    <button
                      onClick={handleUpdate}
                      className="block w-full py-3.5 text-center font-bold rounded-2xl bg-brand-deepblue hover:brightness-110 text-white shadow-soft transition-all hover:scale-[1.01]"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        Update offer
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
                  ) : (
                    <Link
                      href={`/checkout/${bid.id}`}
                      className="block w-full py-3.5 text-center font-bold rounded-2xl bg-brand-orange hover:brightness-110 text-white shadow-glow transition-all hover:scale-[1.01]"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        Buy this offer
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </Link>
                  )}
                  <Link
                    href={`/bid/${parsedPolicy.id}/results`}
                    className="block w-full py-2.5 text-center text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Back to all offers
                  </Link>
                </div>
              </div>

              {/* Trust strip */}
              <div className="px-2 text-center text-xs text-slate-500">
                <Shield className="w-4 h-4 mx-auto mb-1.5 text-slate-400" />
                Policy issued in &lt; 5 minutes &middot; KYC + Payment in-app
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function getTierTheme(tier: number) {
  if (tier === 1) {
    return {
      heroGradient: "from-brand-charcoal via-brand-charcoal to-brand-slate",
    };
  }
  if (tier === 2) {
    return {
      heroGradient: "from-brand-deepblue via-brand-deepblue to-brand-electricblue",
    };
  }
  return {
    heroGradient: "from-brand-purple via-brand-purple to-brand-orange",
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="opacity-70 mb-0.5">{label}</div>
      <div className="font-semibold opacity-100">{value}</div>
    </div>
  );
}

function AddOnToggle({
  icon: Icon,
  name,
  description,
  price,
  isSelected,
  isInOriginal,
  recommendation,
  onToggle,
}: {
  icon: LucideIcon;
  name: string;
  description: string;
  price: number;
  isSelected: boolean;
  isInOriginal: boolean;
  recommendation?: "essential" | "optional" | "drop";
  onToggle: () => void;
}) {
  const changedFromOriginal = isSelected !== isInOriginal;

  return (
    <div
      className={clsx(
        "flex items-center gap-4 p-4 rounded-2xl border transition-all",
        isSelected
          ? "border-brand-navy/30 bg-blue-50/40"
          : "border-slate-200 bg-white",
        changedFromOriginal && "ring-2 ring-amber-200 ring-offset-1"
      )}
    >
      <div
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          isSelected ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-500"
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-semibold text-slate-900 text-sm">{name}</span>
          {recommendation === "essential" && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 rounded">
              Essential
            </span>
          )}
          {recommendation === "drop" && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 rounded">
              Drop
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 leading-snug">{description}</p>
      </div>

      <div className="text-right shrink-0">
        <div
          className={clsx(
            "text-sm font-bold tabular-nums mb-1.5",
            isSelected ? "text-slate-900" : "text-slate-400"
          )}
        >
          +{formatINR(price)}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isSelected}
          onClick={onToggle}
          className={clsx(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
            isSelected ? "bg-brand-navy" : "bg-slate-300"
          )}
        >
          <span
            className={clsx(
              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
              isSelected ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>
    </div>
  );
}

function PremiumBreakdownCard({
  bid,
  parsedPolicy,
  rfq,
  mandatoryAmount,
  addOnScale,
}: {
  bid: Bid;
  parsedPolicy: ParsedPolicy;
  rfq: RFQ;
  mandatoryAmount: number;
  addOnScale: number;
}) {
  // Per-add-on cost = raw estimate * scale, so the row totals add up
  // exactly to bid.addOnPremium — no more "Sum of estimates vs Insurer's
  // actual" mismatch in the breakdown.
  const addOnRows = bid.tierIncludedAddOns.map((name) => ({
    name,
    cost: Math.round(estimateAddOnPremium(name, rfq.desiredIdv) * addOnScale),
    isNew: !parsedPolicy.addOns.some((a) => a.name === name),
  }));
  const subtotal = bid.basicOd + bid.basicTp + mandatoryAmount + bid.addOnPremium;
  const gst = bid.cgst + bid.sgst;

  return (
    <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Premium breakdown</h2>
      <p className="text-sm text-slate-500 mt-1 mb-5">
        Full transparency on what you&apos;re paying for.
      </p>

      <div className="space-y-0.5">
        <BreakdownLine
          label="Base Own Damage"
          sub={`after ${parsedPolicy.ncbPercent}% NCB discount`}
          amount={bid.basicOd}
        />
        <BreakdownLine
          label="Third Party Liability"
          sub="IRDAI-mandated · fixed by law"
          amount={bid.basicTp}
        />
        <BreakdownLine
          label="Mandatory PA + LL"
          sub="Owner driver & paid driver protection"
          amount={mandatoryAmount}
        />

        {addOnRows.length > 0 && (
          <div className="pt-4 mt-3 border-t border-dashed border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2">
              Add-ons in this offer
            </div>
            {addOnRows.map((a) => (
              <BreakdownLine
                key={a.name}
                label={a.name}
                amount={a.cost}
                badge={a.isNew ? "NEW" : undefined}
              />
            ))}
          </div>
        )}

        <div className="pt-4 mt-3 border-t border-slate-200">
          <BreakdownLine
            label="Subtotal"
            sub="Before GST"
            amount={subtotal}
            bold
          />
          <BreakdownLine
            label="GST 18%"
            sub="9% CGST + 9% SGST"
            amount={gst}
          />
        </div>

        <div className="mt-3 -mx-6 md:-mx-8 px-6 md:px-8 py-4 bg-gradient-to-r from-emerald-50 to-emerald-50/40 border-t-2 border-emerald-200">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="font-bold text-slate-900">TOTAL PREMIUM</div>
              <div className="text-xs text-slate-500">For 1-year policy</div>
            </div>
            <div className="text-3xl font-bold tabular-nums text-emerald-700">
              {formatINR(bid.grandTotal)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonCard({
  bid,
  parsedPolicy,
  rfq,
  addOnScale,
}: {
  bid: Bid;
  parsedPolicy: ParsedPolicy;
  rfq: RFQ;
  addOnScale: number;
}) {
  // Scaled per-add-on cost so the comparison rows reconcile with the
  // breakdown card above (same scaled values, sum to bid.addOnPremium).
  const scaledCost = (name: string) =>
    Math.round(estimateAddOnPremium(name, rfq.desiredIdv) * addOnScale);
  const currentPremium = parsedPolicy.premium.grandTotal;
  const currentOdAfterNcb = parsedPolicy.premium.totalOd;
  const currentTp = parsedPolicy.premium.totalTp;
  const currentAddOnNames = new Set(parsedPolicy.addOns.map((a) => a.name));

  const odDelta = bid.basicOd - currentOdAfterNcb;
  const tpDelta = bid.basicTp - currentTp;

  // New add-ons: in offer but not in current policy
  const newAddOns = bid.tierIncludedAddOns.filter(
    (n) => !currentAddOnNames.has(n)
  );

  // Removed add-ons: in current policy but not in this offer (savings)
  const removedAddOns = parsedPolicy.addOns.filter(
    (a) => !bid.tierIncludedAddOns.includes(a.name)
  );

  // Carried-over add-ons: in BOTH current policy and this offer.
  // These get re-priced at market rate by the new insurer — this is where most
  // of the change usually hides (especially for new-car bundle policies whose
  // Year-1 promo rates are unusually low).
  const carriedOver = parsedPolicy.addOns
    .filter((a) => bid.tierIncludedAddOns.includes(a.name))
    .map((a) => ({
      name: a.name,
      currentPrice: a.premium,
      newPrice: scaledCost(a.name),
    }))
    // Only show items with a meaningful price change (>= ₹100 either way)
    .filter((a) => Math.abs(a.newPrice - a.currentPrice) >= 100);
  const repricingTotal = carriedOver.reduce(
    (sum, a) => sum + (a.newPrice - a.currentPrice),
    0
  );
  const repricingWithGst = Math.round(repricingTotal * 1.18);

  const isBundlePolicy = parsedPolicy.policyType
    .toLowerCase()
    .includes("bundle");

  const totalDelta = bid.grandTotal - currentPremium;
  const totalDeltaPct = Math.round((totalDelta / currentPremium) * 100);

  return (
    <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">
        What changed vs your current premium
      </h2>
      <p className="text-sm text-slate-500 mt-1 mb-5">
        Your current premium with{" "}
        <span className="font-semibold text-slate-700">
          {parsedPolicy.insurerName.split(" ").slice(0, 2).join(" ")}
        </span>
        : {formatINR(currentPremium)}
      </p>

      <div className="space-y-0.5">
        {Math.abs(odDelta) >= 50 && (
          <DeltaLine
            label={
              odDelta < 0
                ? `OD discount from ${bid.insurerName.split(" ")[0]}`
                : `OD adjustment by ${bid.insurerName.split(" ")[0]}`
            }
            sub={`${formatINR(bid.basicOd)} (theirs) vs ${formatINR(currentOdAfterNcb)} (current)`}
            amount={odDelta}
          />
        )}

        {Math.abs(tpDelta) >= 50 && (
          <DeltaLine
            label="Third Party adjustment"
            sub="TP is rate-controlled; minor variation possible"
            amount={tpDelta}
          />
        )}

        {/* Re-priced add-ons (carried over from current policy at new market rates) */}
        {carriedOver.length > 0 && (
          <div className="pt-4 mt-3 border-t border-dashed border-slate-200">
            <div className="text-[10px] font-bold text-brand-deepblue uppercase tracking-[0.12em] mb-2 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Re-priced at market rate (carried from current policy)
            </div>
            {carriedOver.map((a) => {
              const delta = a.newPrice - a.currentPrice;
              return (
                <DeltaLine
                  key={a.name}
                  label={a.name}
                  sub={`${formatINR(a.currentPrice)} → ${formatINR(a.newPrice)}`}
                  amount={delta}
                />
              );
            })}
            <div className="text-[11px] text-brand-slate italic mt-2 pl-1">
              Re-pricing subtotal (excl. GST):{" "}
              <span className="font-semibold text-brand-charcoal tabular-nums">
                {repricingTotal >= 0 ? "+" : "−"}
                {formatINR(Math.abs(repricingTotal))}
              </span>
              <span className="text-brand-slate/70">
                {" "}
                · with GST{" "}
                {repricingWithGst >= 0 ? "+" : "−"}
                {formatINR(Math.abs(repricingWithGst))}
              </span>
            </div>
          </div>
        )}

        {newAddOns.length > 0 && (
          <div className="pt-4 mt-3 border-t border-dashed border-slate-200">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.12em] mb-2 flex items-center gap-1">
              <Plus className="w-3 h-3" />
              Newly added in this offer
            </div>
            {newAddOns.map((name) => {
              const cost = scaledCost(name);
              const withGst = Math.round(cost * 1.18);
              return (
                <DeltaLine
                  key={name}
                  label={name}
                  sub={`${formatINR(cost)} + GST = ${formatINR(withGst)}`}
                  amount={withGst}
                />
              );
            })}
          </div>
        )}

        {removedAddOns.length > 0 && (
          <div className="pt-4 mt-3 border-t border-dashed border-slate-200">
            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-[0.12em] mb-2 flex items-center gap-1">
              <Minus className="w-3 h-3" />
              Dropped from this offer (savings)
            </div>
            {removedAddOns.map((a) => {
              const withGst = Math.round(a.premium * 1.18);
              return (
                <DeltaLine
                  key={a.name}
                  label={a.name}
                  sub={`Was ${formatINR(a.premium)} (excl. GST) in current policy`}
                  amount={-withGst}
                />
              );
            })}
          </div>
        )}

        {rfq.desiredIdv !== parsedPolicy.idv && (
          <div className="pt-4 mt-3 border-t border-dashed border-slate-200">
            <DeltaLine
              label="IDV change"
              sub={`${formatINR(parsedPolicy.idv)} → ${formatINR(rfq.desiredIdv)}`}
              amount={Math.round(
                (rfq.desiredIdv - parsedPolicy.idv) * 0.018
              )}
            />
          </div>
        )}

        <div className="pt-4 mt-3 border-t-2 border-slate-300">
          <DeltaLine
            label="Net change"
            sub={`${totalDeltaPct > 0 ? "+" : ""}${totalDeltaPct}% vs current`}
            amount={totalDelta}
            bold
          />
        </div>
      </div>

      {/* Bundle-policy contextual explanation — shown when the customer's
          current premium was unusually low due to new-car bundle promo rates */}
      {isBundlePolicy && totalDelta > 5000 && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold mb-1.5">
                Why is this so much more than your current premium?
              </p>
              <p>
                Your current policy is a{" "}
                <strong>new-car bundle</strong> with Year-1 promotional pricing
                on add-ons (Zero Depreciation at ~0.22% of IDV vs market 1.5%,
                Return to Invoice at ~0.25% vs market 1.0%, etc). A 1-year
                renewal quote from any insurer — including your current one —
                will be at fair-market rates. From next renewal onwards,
                premium stays stable.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function WhatsCoveredCard({
  tierIncludedAddOns,
}: {
  tierIncludedAddOns: string[];
}) {
  return (
    <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">
        What you&apos;re covered for
      </h2>
      <p className="text-sm text-slate-500 mt-1 mb-5">
        Everything included in this offer.
      </p>

      <div className="space-y-2">
        <CoverageRow
          label="Own Damage cover"
          sub="Accident, fire, theft, natural calamity, malicious damage"
        />
        <CoverageRow
          label="Third Party Liability"
          sub="Injury, death, property damage to others — legal mandate"
        />
        <CoverageRow
          label="Personal Accident — Owner Driver"
          sub="₹15L coverage in case of injury/death while driving"
        />
        {tierIncludedAddOns.map((addon) => (
          <CoverageRow
            key={addon}
            label={addon}
            sub="Add-on coverage in this offer"
            highlight
          />
        ))}
      </div>
    </section>
  );
}

function BreakdownLine({
  label,
  sub,
  amount,
  bold = false,
  badge,
}: {
  label: string;
  sub?: string;
  amount: number;
  bold?: boolean;
  badge?: string;
}) {
  return (
    <div className="flex items-baseline justify-between py-2">
      <div className="min-w-0">
        <div
          className={clsx(
            "text-sm flex items-center gap-2",
            bold ? "font-bold text-slate-900" : "text-slate-700"
          )}
        >
          {label}
          {badge && (
            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
              {badge}
            </span>
          )}
        </div>
        {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
      </div>
      <div
        className={clsx(
          "shrink-0 ml-3 tabular-nums text-sm",
          bold ? "font-bold text-slate-900" : "text-slate-800"
        )}
      >
        {formatINR(amount)}
      </div>
    </div>
  );
}

function DeltaLine({
  label,
  sub,
  amount,
  bold = false,
}: {
  label: string;
  sub?: string;
  amount: number;
  bold?: boolean;
}) {
  const isPositive = amount > 0;
  const isZero = amount === 0;
  return (
    <div className="flex items-baseline justify-between py-2">
      <div className="min-w-0">
        <div
          className={clsx(
            "text-sm",
            bold ? "font-bold text-slate-900" : "text-slate-700"
          )}
        >
          {label}
        </div>
        {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
      </div>
      <div
        className={clsx(
          "shrink-0 ml-3 tabular-nums text-sm",
          bold ? "font-bold" : "",
          isZero
            ? "text-slate-500"
            : isPositive
              ? "text-amber-700"
              : "text-emerald-700"
        )}
      >
        {isPositive ? "+ " : amount < 0 ? "− " : ""}
        {formatINR(Math.abs(amount))}
      </div>
    </div>
  );
}

function CoverageRow({
  label,
  sub,
  highlight = false,
}: {
  label: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex items-start gap-3 p-3 rounded-2xl border",
        highlight
          ? "bg-emerald-50/40 border-emerald-100"
          : "bg-slate-50/40 border-slate-100"
      )}
    >
      <CheckCircle2
        className={clsx(
          "w-5 h-5 shrink-0 mt-0.5",
          highlight ? "text-emerald-600" : "text-slate-500"
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="text-xs text-slate-600 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function FiveYearProjection({
  annualPremium,
  currentPremium,
}: {
  annualPremium: number;
  currentPremium: number;
}) {
  // Assume 4% annual premium inflation (industry average for motor)
  const inflate = (base: number, years: number) => base * Math.pow(1.04, years);
  const total5yr = Array.from({ length: 5 }).reduce<number>(
    (sum, _, i) => sum + inflate(annualPremium, i),
    0
  );
  const currentTotal5yr = Array.from({ length: 5 }).reduce<number>(
    (sum, _, i) => sum + inflate(currentPremium, i),
    0
  );
  const savings5yr = currentTotal5yr - total5yr;

  return (
    <div className="mt-3 pt-3 border-t border-brand-light-gray space-y-1">
      <div className="text-[10px] uppercase tracking-[0.12em] font-bold text-brand-slate">
        Over 5 years (with ~4% annual rise)
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-brand-slate">Total premium paid</span>
        <span className="text-sm font-bold text-brand-charcoal tabular-nums">
          ~{formatINR(Math.round(total5yr))}
        </span>
      </div>
      {Math.abs(savings5yr) > 1000 && (
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-brand-slate">
            {savings5yr > 0 ? "Vs current — save" : "Vs current — invest"}
          </span>
          <span
            className={clsx(
              "text-sm font-bold tabular-nums",
              savings5yr > 0 ? "text-brand-success" : "text-brand-orange"
            )}
          >
            {savings5yr > 0 ? "−" : "+"}
            {formatINR(Math.abs(Math.round(savings5yr)))}
          </span>
        </div>
      )}
    </div>
  );
}

function DeltaBadge({
  delta,
  currentPremium,
}: {
  delta: number;
  currentPremium: number;
}) {
  const pct = Math.round((delta / currentPremium) * 100);
  if (delta === 0) {
    return (
      <span className="text-xs font-medium text-slate-600">
        Same as your current premium
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold animate-coin-pop">
          ₹
        </span>
        Save {formatINR(-delta)} · {Math.abs(pct)}% less
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
      +{formatINR(delta)} · {pct}% more than current
    </span>
  );
}

function UpdatingState({ insurerName }: { insurerName: string }) {
  void insurerName;
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative inline-block">
          <Loader2 className="w-16 h-16 text-brand-navy animate-spin" />
          <Sparkles className="w-6 h-6 text-brand-gold absolute top-0 right-0 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Running a fresh auction
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            BharatSure, Vahana & Suraksha are re-pricing all 3 tiers with your
            updated add-ons...
          </p>
        </div>
      </div>
    </div>
  );
}
