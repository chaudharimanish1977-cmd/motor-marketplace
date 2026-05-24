"use client";

import { useState } from "react";
import Link from "next/link";
import { LoadingLink } from "@/components/loading-link";
import {
  Trophy,
  CheckCircle2,
  ChevronDown,
  Building2,
  ArrowRight,
  Shield,
  Lock,
  AlertCircle,
  Settings2,
  Sparkles,
  LayoutGrid,
  Table2,
} from "lucide-react";
import { TierComparisonMatrix } from "@/components/tier-comparison-matrix";
import { NumberPlate } from "@/components/number-plate";
import clsx from "clsx";
import type {
  ParsedPolicy,
  RFQ,
  PolicyReport,
  TierSummary,
  BidTier,
  Bid,
} from "@/lib/types";
import { formatINR } from "@/lib/format";

interface Props {
  parsedPolicy: ParsedPolicy;
  tiers: TierSummary[];
  rfq: RFQ;
  report?: PolicyReport;
}

export function BidResults({
  parsedPolicy,
  tiers,
  rfq,
  report,
}: Props) {
  void rfq;
  const [viewMode, setViewMode] = useState<"cards" | "matrix">("cards");
  const currentPremium = parsedPolicy.premium.grandTotal;

  // Recommended (Tier 2) winning bid powers the sticky mobile CTA
  const recommendedTier = tiers.find((t) => t.tier === 2);
  const recommendedWinner =
    recommendedTier?.available && recommendedTier.bids.length > 0
      ? recommendedTier.bids[0]
      : null;

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-[calc(100vh-60px)] pb-24 md:pb-0">
      <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700 bg-emerald-100 rounded-full">
            <Trophy className="w-3.5 h-3.5" />
            Step 3 of 3 · Curated Offers
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Pick your coverage level
          </h1>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed">
            Three coverage tiers anchored to your selection. Each has bids from
            3 insurers — winner shown, others below.
          </p>
        </div>

        {/* Current premium + plate + Customize action */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl px-5 py-3.5 shadow-sm max-w-4xl mx-auto">
          <div className="flex items-center gap-3 flex-wrap">
            <NumberPlate
              value={parsedPolicy.vehicle.registrationNumber}
              size="sm"
            />
            <span className="text-sm text-slate-600">
              Current premium with{" "}
              <span className="font-semibold text-slate-900">
                {parsedPolicy.insurerName.split(" ").slice(0, 2).join(" ")}
              </span>
              :{" "}
              <span className="font-bold text-slate-900 tabular-nums">
                {formatINR(currentPremium)}
              </span>
              <span className="text-xs text-slate-400 font-normal ml-1">
                /year
              </span>
            </span>
          </div>
          <Link
            href={`/bid/${parsedPolicy.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Customize selections
          </Link>
        </div>

        {/* View toggle — cards vs comparison matrix */}
        <div className="flex justify-center">
          <div className="inline-flex bg-brand-light-gray/60 rounded-full p-1">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={clsx(
                "inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-all",
                viewMode === "cards"
                  ? "bg-white text-brand-charcoal shadow-soft"
                  : "text-brand-slate hover:text-brand-charcoal"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={clsx(
                "inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-all",
                viewMode === "matrix"
                  ? "bg-white text-brand-charcoal shadow-soft"
                  : "text-brand-slate hover:text-brand-charcoal"
              )}
            >
              <Table2 className="w-3.5 h-3.5" />
              Compare all 3
            </button>
          </div>
        </div>

        {/* 3 tier cards OR matrix view */}
        {viewMode === "cards" ? (
          <div className="grid md:grid-cols-3 gap-5">
            {tiers.map((tier) => (
              <TierCard
                key={tier.tier}
                tier={tier}
                currentPremium={currentPremium}
              />
            ))}
          </div>
        ) : (
          <TierComparisonMatrix parsedPolicy={parsedPolicy} tiers={tiers} />
        )}

        {/* Helpful context */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 max-w-4xl mx-auto shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-brand-charcoal/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-brand-charcoal" />
            </div>
            <div className="text-sm text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900 mb-1">
                How tiers are built
              </p>
              <p>
                <strong>Basic</strong> = essentials only from your selection
                (minimum premium).{" "}
                <strong>Recommended</strong> = exactly what you selected.{" "}
                <strong>Super Cover</strong> = your selection + every other
                relevant add-on for your profile (maximum claim coverage). Use
                &ldquo;Customize selections&rdquo; above to adjust anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Behind-the-curtain reveal */}
        {report && (
          <details className="rounded-3xl border-2 border-dashed border-brand-plum/30 bg-brand-plum/10 p-5 group max-w-4xl mx-auto">
            <summary className="cursor-pointer flex items-center gap-3 list-none">
              <div className="w-9 h-9 rounded-2xl bg-brand-plum/15 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-brand-plum" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-brand-plum flex items-center gap-2 flex-wrap">
                  Admin View · Why these insurers were invited
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-brand-plum/20 text-brand-plum rounded-full">
                    Pitch Reveal
                  </span>
                </div>
                <div className="text-xs text-brand-plum mt-0.5">
                  Customer sees only tier winners + others per tier. Behind the
                  scenes, our engine pre-selects insurers by profile fit.
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-brand-plum transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-4 text-xs text-brand-plum space-y-2">
              <div className="bg-white rounded-2xl p-3 text-slate-700">
                <strong>Selection criteria:</strong>{" "}
                {report.idealInsurerProfile.selectionCriteria.join(" · ")}
              </div>
              <p>
                In production, real insurer integrations (rate-card uploads,
                real-time API auction, underwriter pool) replace these synthetic
                personas. The marketplace mechanic is the same.
              </p>
            </div>
          </details>
        )}

        <div className="text-center pt-2 max-w-4xl mx-auto">
          <Link
            href={`/bid/${parsedPolicy.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <Settings2 className="w-4 h-4" />
            Customize your add-ons and re-quote
          </Link>
        </div>

        {(() => {
          void Sparkles;
          return null;
        })()}
      </main>

      {/* Sticky mobile CTA — recommended tier shortcut */}
      {recommendedWinner && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-elevated print:hidden">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.12em] font-bold text-brand-charcoal">
                Recommended
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900 tabular-nums tracking-tight">
                  {formatINR(recommendedWinner.grandTotal)}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  · {recommendedWinner.insurerName.split(" ")[0]}
                </span>
              </div>
            </div>
            <LoadingLink
              href={`/offer/${recommendedWinner.id}`}
              className="text-xs font-semibold text-brand-charcoal px-3 py-2 rounded-xl border border-brand-charcoal/30"
              spinnerPosition="right"
            >
              Details
            </LoadingLink>
            <LoadingLink
              href={`/checkout/${recommendedWinner.id}`}
              className="text-xs font-bold text-white bg-brand-plum px-4 py-2.5 rounded-xl shadow-glow inline-flex items-center gap-1"
              spinnerPosition="right"
            >
              Buy
              <ArrowRight className="w-3.5 h-3.5" />
            </LoadingLink>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Tier card
// ============================================================================

function TierCard({
  tier,
  currentPremium,
}: {
  tier: TierSummary;
  currentPremium: number;
}) {
  const theme = tierTheme(tier.tier);

  if (!tier.available || tier.bids.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 flex flex-col items-center text-center min-h-[460px] justify-center">
        <AlertCircle className="w-10 h-10 text-slate-400 mb-3" />
        <div className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
          {tier.label}
        </div>
        <div className="font-bold text-slate-700 mt-1 mb-3">Not available</div>
        <p className="text-sm text-slate-600 mb-4 max-w-xs">
          {tier.unavailableReason ||
            "Couldn't generate this tier for your profile."}
        </p>
      </div>
    );
  }

  const winner = tier.bids[0];
  const others = tier.bids.slice(1);
  const delta = winner.grandTotal - currentPremium;
  const deltaPct = Math.round((delta / currentPremium) * 100);

  return (
    <div
      className={clsx(
        "rounded-3xl bg-white shadow-lg overflow-hidden flex flex-col transition-transform hover:shadow-xl",
        tier.tier === 2 &&
          "ring-2 ring-brand-charcoal ring-offset-2 md:scale-[1.02]"
      )}
    >
      {/* Tier header — gradient */}
      <div
        className={clsx(
          "px-6 py-5 text-white relative overflow-hidden",
          theme.headerBg
        )}
      >
        {/* Subtle decorative blob */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] font-bold opacity-75">
              Tier {tier.tier}
            </div>
            <div className="text-2xl font-bold tracking-tight mt-0.5">
              {tier.label}
            </div>
          </div>
          {tier.tier === 2 && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-white text-brand-charcoal rounded-full">
              Recommended
            </span>
          )}
          {tier.tier === 3 && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full">
              Max Coverage
            </span>
          )}
          {tier.tier === 1 && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full">
              Save
            </span>
          )}
        </div>
        <div className="relative text-xs opacity-95 mt-2">{tier.tagline}</div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* Price */}
        <div className="mb-5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
              {formatINR(winner.grandTotal)}
            </span>
            <span className="text-xs text-slate-400">/year</span>
          </div>
          <div
            className={clsx(
              "text-xs mt-1.5 font-medium inline-flex items-center gap-1.5",
              deltaClass(delta)
            )}
          >
            {delta < 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold animate-coin-pop">
                ₹
              </span>
            )}
            {delta > 0 && `+ ${formatINR(delta)} (${deltaPct}%) vs current`}
            {delta < 0 && `Save ${formatINR(-delta)} vs current`}
            {delta === 0 && "Same as current"}
          </div>
        </div>

        {/* Winning insurer */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/40 border border-emerald-200/60 rounded-2xl p-3.5 mb-5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Trophy className="w-3.5 h-3.5 text-emerald-600" />
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
              Tier winner
            </div>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <Building2 className="w-4 h-4 text-slate-700" />
            <div className="font-semibold text-slate-900 text-sm">
              {winner.insurerName}
            </div>
          </div>
          <p className="text-xs text-slate-600 italic leading-snug">
            &ldquo;{winner.uniqueSellingPoint}&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
            <span>{winner.garageNetworkSize.split(" ")[0]} garages</span>
            <span>·</span>
            <span>CSR {winner.claimSettlementRatio.split(" ")[0]}</span>
          </div>
        </div>

        {/* Included add-ons */}
        <div className="mb-5 flex-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2.5">
            What&apos;s included
          </div>
          {tier.includedAddOns.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              Base policy only (no add-ons)
            </p>
          ) : (
            <ul className="space-y-1.5">
              {tier.includedAddOns.map((addon) => (
                <li
                  key={addon}
                  className="flex items-start gap-2 text-sm text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{addon}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* HERO: See full breakdown & customize — prominent, above Buy */}
        <LoadingLink
          href={`/offer/${winner.id}`}
          className="block w-full py-3 text-center font-bold rounded-2xl bg-white border-2 border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal/10 transition-all hover:scale-[1.01] shadow-soft"
          spinnerPosition="right"
        >
          <span className="inline-flex items-center gap-1.5">
            See Full Breakdown & Customize
            <ArrowRight className="w-4 h-4" />
          </span>
        </LoadingLink>

        {/* Direct Buy */}
        <LoadingLink
          href={`/checkout/${winner.id}`}
          className={clsx(
            "block w-full mt-2 py-3.5 text-center font-bold rounded-2xl transition-all hover:scale-[1.01]",
            theme.cta
          )}
          spinnerPosition="right"
        >
          <span className="inline-flex items-center gap-1.5">
            Buy {tier.label}
            <ArrowRight className="w-4 h-4" />
          </span>
        </LoadingLink>

        {/* More options */}
        {others.length > 0 && (
          <details className="mt-3 text-xs group/details">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-800 list-none flex items-center gap-1 py-1.5">
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open/details:rotate-180" />
              More options at this tier ({others.length})
            </summary>
            <div className="mt-2 space-y-2">
              {others.map((b) => (
                <OtherBidRow
                  key={b.id}
                  bid={b}
                  vsWinner={b.grandTotal - winner.grandTotal}
                />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Other bid row
// ============================================================================

function OtherBidRow({ bid, vsWinner }: { bid: Bid; vsWinner: number }) {
  return (
    <LoadingLink
      href={`/offer/${bid.id}`}
      className="block bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-brand-charcoal/30 rounded-2xl p-3 transition-all group/row"
      spinnerPosition="top-right"
    >
      <div className="flex items-start justify-between mb-1 gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
            <Building2 className="w-3 h-3" />
            {bid.insurerName}
          </div>
          <p className="text-[11px] text-slate-600 italic leading-snug mt-1 line-clamp-2">
            {bid.uniqueSellingPoint}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-500">
            <span>{bid.garageNetworkSize.split(" ")[0]} garages</span>
            <span>·</span>
            <span>CSR {bid.claimSettlementRatio.split(" ")[0]}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-slate-900 tabular-nums">
            {formatINR(bid.grandTotal)}
          </div>
          <div className="text-[10px] text-rose-600 font-semibold">
            +{formatINR(vsWinner)}
          </div>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span className="text-slate-500">See full breakdown</span>
        <span className="font-semibold text-brand-charcoal inline-flex items-center gap-1 group-hover/row:translate-x-0.5 transition-transform">
          View offer
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </LoadingLink>
  );
}

// ============================================================================
// Theme + helpers
// ============================================================================

function tierTheme(tier: BidTier) {
  // Three-tier hierarchy mapped onto the brand palette:
  //   Basic        → neutral charcoal (safe, plain, "save")
  //   Recommended  → solid plum (THE brand accent — the pick)
  //   Super Cover  → plum→sage gradient (the editorial duo-tone for premium)
  if (tier === 1) {
    return {
      headerBg: "bg-brand-charcoal",
      cta:
        "bg-brand-charcoal hover:brightness-110 text-white shadow-soft",
    };
  }
  if (tier === 2) {
    return {
      headerBg: "bg-brand-plum",
      cta:
        "bg-brand-plum hover:brightness-110 text-white shadow-glow",
    };
  }
  return {
    headerBg: "bg-gradient-to-br from-brand-plum to-brand-sage",
    cta:
      "bg-gradient-to-r from-brand-plum to-brand-sage hover:brightness-110 text-white shadow-elevated",
  };
}

function deltaClass(delta: number) {
  if (delta < 0) return "text-brand-success";
  if (delta === 0) return "text-brand-slate";
  if (delta < 5000) return "text-brand-slate";
  return "text-brand-sage";
}
