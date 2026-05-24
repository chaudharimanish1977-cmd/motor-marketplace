"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Wrench,
  Truck,
  Award,
  Key,
  Briefcase,
  ShieldCheck,
  FileText,
  AlertCircle,
  Info,
  TrendingDown,
} from "lucide-react";
import { LiveBidFeed } from "@/components/live-bid-feed";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import type {
  ParsedPolicy,
  PolicyReport,
  AddOnRecommendation,
  TierSummary,
} from "@/lib/types";
import { formatINR } from "@/lib/format";

// ============================================================================
// Catalogue — visual + descriptive metadata for each canonical add-on.
// Recommendation-level (essential / optional / drop) comes from the report.
// ============================================================================

interface AddOnCatalogEntry {
  name: string;
  description: string;
  icon: LucideIcon;
}

const ADD_ON_CATALOG: AddOnCatalogEntry[] = [
  {
    name: "Zero Depreciation",
    description: "Full claim payout without depreciation deductions on parts.",
    icon: ShieldCheck,
  },
  {
    name: "Engine Protector",
    description: "Covers water ingress, hydrostatic lock & engine damage.",
    icon: Wrench,
  },
  {
    name: "Return to Invoice",
    description: "Pays full invoice value (not just IDV) in total loss/theft.",
    icon: FileText,
  },
  {
    name: "Roadside Assistance",
    description: "24×7 towing, flat tyre, jump-start, fuel, lockout help.",
    icon: Truck,
  },
  {
    name: "NCB Protection",
    description: "Protects your No-Claim Bonus discount even after a claim.",
    icon: Award,
  },
  {
    name: "Consumables",
    description: "Covers oil, nuts, bolts, coolant, AC gas — usually deducted.",
    icon: Briefcase,
  },
  {
    name: "Key Replacement",
    description: "Lost/stolen keys covered up to ₹50,000.",
    icon: Key,
  },
  {
    name: "Loss of Personal Belongings",
    description: "Reimburses items lost from a damaged/stolen vehicle.",
    icon: Briefcase,
  },
];

// ============================================================================

interface Props {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
  /**
   * When customer returns to customize after seeing tier results, pre-populate
   * with their previous selection instead of the relevance-based defaults.
   */
  initialSelectedAddOns?: string[];
}

export function BundleBuilder({
  parsedPolicy,
  report,
  initialSelectedAddOns,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [apiReturned, setApiReturned] = useState(false);
  const [pendingRedirectRfq, setPendingRedirectRfq] = useState<string | null>(null);
  const [realTiers, setRealTiers] = useState<TierSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Build a lookup of recommendations by canonical add-on name.
  // Falls back to a simple heuristic if the report predates relevance tagging.
  const recommendationsByName = useMemo(() => {
    const map = new Map<string, AddOnRecommendation>();
    if (report.addOnRecommendations) {
      for (const rec of report.addOnRecommendations) {
        map.set(rec.name, rec);
      }
    } else {
      // Legacy fallback — treat current-policy add-ons as essential, others as optional
      const inCurrent = new Set(parsedPolicy.addOns.map((a) => a.name));
      for (const cat of ADD_ON_CATALOG) {
        map.set(cat.name, {
          name: cat.name,
          isInCurrentPolicy: inCurrent.has(cat.name),
          recommendation: inCurrent.has(cat.name) ? "essential" : "optional",
          reasoning: "",
          estimatedAnnualPremium: 0,
        });
      }
    }
    return map;
  }, [parsedPolicy, report]);

  // Default selection rules:
  //  - If customer is returning to customize (initialSelectedAddOns provided),
  //    pre-fill with their previous picks exactly.
  //  - Otherwise apply relevance-based defaults: essential ON, optional ON, drop OFF.
  const initialSelection = useMemo(() => {
    if (initialSelectedAddOns && initialSelectedAddOns.length > 0) {
      return new Set(initialSelectedAddOns);
    }
    const selected = new Set<string>();
    for (const cat of ADD_ON_CATALOG) {
      const rec = recommendationsByName.get(cat.name);
      if (rec && (rec.recommendation === "essential" || rec.recommendation === "optional")) {
        selected.add(cat.name);
      }
    }
    return selected;
  }, [recommendationsByName, initialSelectedAddOns]);

  const [selectedAddOns, setSelectedAddOns] =
    useState<Set<string>>(initialSelection);
  const [desiredIdv, setDesiredIdv] = useState(parsedPolicy.idv);
  const [hasClaim, setHasClaim] = useState<boolean | null>(null);
  const [claimDetails, setClaimDetails] = useState("");

  const toggle = (name: string) => {
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Group add-ons by recommendation level for visual sectioning
  const grouped = useMemo(() => {
    const essential: AddOnCatalogEntry[] = [];
    const optional: AddOnCatalogEntry[] = [];
    const drop: AddOnCatalogEntry[] = [];
    for (const cat of ADD_ON_CATALOG) {
      const rec = recommendationsByName.get(cat.name);
      if (!rec) {
        optional.push(cat);
        continue;
      }
      if (rec.recommendation === "essential") essential.push(cat);
      else if (rec.recommendation === "optional") optional.push(cat);
      else drop.push(cat);
    }
    return { essential, optional, drop };
  }, [recommendationsByName]);

  const submit = async () => {
    if (hasClaim === null) {
      setError("Please answer the claim disclosure question before continuing.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parsedPolicyId: parsedPolicy.id,
          selectedAddOns: Array.from(selectedAddOns),
          desiredIdv,
          hasPreExistingClaim: hasClaim,
          preExistingClaimDetails: hasClaim ? claimDetails : undefined,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.error || "Failed to get bids");
      }

      const data = await res.json();
      // API done — store rfq id + real tier data; the live-bid feed uses
      // the real tier amounts so the auction-reveal numbers match the
      // "Pick your coverage level" page exactly. Redirect happens when
      // the reveal animation finishes.
      setPendingRedirectRfq(data.rfqId);
      setRealTiers(data.tiers ?? null);
      setApiReturned(true);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleAuctionComplete = () => {
    if (pendingRedirectRfq) {
      router.push(`/bid/${parsedPolicy.id}/results?rfq=${pendingRedirectRfq}`);
    }
  };

  if (submitting) {
    return (
      <LiveBidFeed
        currentPremium={parsedPolicy.premium.grandTotal}
        vehicleLabel={`${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}`}
        apiReturned={apiReturned}
        realTiers={realTiers}
        onComplete={handleAuctionComplete}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Vehicle summary */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Icon container uses plum tint — the brand accent reads in
              both themes (deep plum in light, lifted plum in dark) and
              keeps the iconography on-brand without clashing with the
              white card. */}
          <div className="w-12 h-12 rounded-2xl bg-brand-plum/10 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-brand-plum" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.12em] font-semibold">
              You&apos;re bidding for
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {parsedPolicy.vehicle.make} {parsedPolicy.vehicle.model}{" "}
              {parsedPolicy.vehicle.variant} ({parsedPolicy.vehicle.yearOfManufacture})
            </div>
            <div className="text-sm text-slate-600">
              {parsedPolicy.vehicle.registrationNumber} ·{" "}
              {parsedPolicy.vehicle.rto} RTO ·{" "}
              {parsedPolicy.vehicle.fuelType} · Current premium{" "}
              <span className="font-semibold text-slate-800 tabular-nums">
                {formatINR(parsedPolicy.premium.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* IDV slider */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Insured Declared Value (IDV)
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Maximum amount you&apos;ll receive in a total loss or theft.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="range"
              min={Math.floor(parsedPolicy.idv * 0.85)}
              max={Math.ceil(parsedPolicy.idv * 1.15)}
              step={1000}
              value={desiredIdv}
              onChange={(e) => setDesiredIdv(Number(e.target.value))}
              className="w-full accent-brand-plum"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{formatINR(Math.floor(parsedPolicy.idv * 0.85))}</span>
              <span>Current: {formatINR(parsedPolicy.idv)}</span>
              <span>{formatINR(Math.ceil(parsedPolicy.idv * 1.15))}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-bold text-brand-charcoal">
              {formatINR(desiredIdv)}
            </div>
          </div>
        </div>
      </section>

      {/* Add-ons grouped by recommendation level */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Add-ons</h3>
            <p className="text-xs text-slate-600">
              AI-curated for your{" "}
              {new Date().getFullYear() -
                parsedPolicy.vehicle.yearOfManufacture}
              -year-old {parsedPolicy.vehicle.make}.
            </p>
          </div>
          {/* Count badge uses plum so the "selected" state matches the
              toggles + add-on cards beneath. Plum auto-flips lifted in
              dark mode — bright on dark page, deep on light. */}
          <span className="px-3 py-1 text-xs font-bold text-brand-plum bg-brand-plum/15 rounded-full tabular-nums">
            {selectedAddOns.size} selected
          </span>
        </div>

        {grouped.essential.length > 0 && (
          <AddOnGroup
            title="Essential for your profile"
            description="Strongly recommended — included in all coverage tiers."
            badgeColor="emerald"
            entries={grouped.essential}
            selectedAddOns={selectedAddOns}
            recommendations={recommendationsByName}
            onToggle={toggle}
          />
        )}

        {grouped.optional.length > 0 && (
          <AddOnGroup
            title="Optional"
            description="Nice to have. Included in Super Cover tier."
            badgeColor="blue"
            entries={grouped.optional}
            selectedAddOns={selectedAddOns}
            recommendations={recommendationsByName}
            onToggle={toggle}
          />
        )}

        {grouped.drop.length > 0 && (
          <AddOnGroup
            title="Consider dropping"
            description="Not relevant for your profile — turn off to save on premium."
            badgeColor="amber"
            entries={grouped.drop}
            selectedAddOns={selectedAddOns}
            recommendations={recommendationsByName}
            onToggle={toggle}
          />
        )}
      </section>

      {/* Claim disclosure */}
      <section className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-200 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-900">
              Claim Disclosure
            </h3>
            <p className="text-sm text-amber-800 mt-0.5">
              Have you made or is there any pending claim in your CURRENT
              policy year?
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setHasClaim(false)}
            className={clsx(
              "flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all text-sm",
              hasClaim === false
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            )}
          >
            No, no claims this year
          </button>
          <button
            type="button"
            onClick={() => setHasClaim(true)}
            className={clsx(
              "flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all text-sm",
              hasClaim === true
                ? "border-rose-500 bg-rose-50 text-rose-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            )}
          >
            Yes, I had a claim
          </button>
        </div>
        {hasClaim === true && (
          <textarea
            value={claimDetails}
            onChange={(e) => setClaimDetails(e.target.value)}
            placeholder="Brief details (e.g., minor accident, ₹15,000 claim, settled)"
            className="mt-3 w-full p-3 border border-amber-300 rounded-lg text-sm bg-white"
            rows={2}
          />
        )}
      </section>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={hasClaim === null}
        className={clsx(
          "w-full py-4 rounded-2xl text-lg font-bold transition-all",
          hasClaim === null
            ? "bg-brand-light-gray text-brand-slate cursor-not-allowed dark:bg-slate-700 dark:text-slate-500"
            : "bg-brand-plum hover:brightness-110 text-white hover:scale-[1.01] shadow-glow"
        )}
      >
        Get My 3-Tier Curated Offers →
      </button>
      <p className="text-xs text-slate-500 text-center -mt-3">
        We&apos;ll show you Same-Price · Comfort+ · Super Cover · Pick what fits
      </p>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function AddOnGroup({
  title,
  description,
  badgeColor,
  entries,
  selectedAddOns,
  recommendations,
  onToggle,
}: {
  title: string;
  description: string;
  badgeColor: "emerald" | "blue" | "amber";
  entries: AddOnCatalogEntry[];
  selectedAddOns: Set<string>;
  recommendations: Map<string, AddOnRecommendation>;
  onToggle: (name: string) => void;
}) {
  const headerColor = {
    emerald: "text-emerald-700",
    blue: "text-brand-charcoal",
    amber: "text-amber-700",
  }[badgeColor];

  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2.5">
        <div className={clsx("text-xs font-bold uppercase tracking-wider", headerColor)}>
          {title}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
      </div>
      <div className="space-y-2">
        {entries.map((cat) => (
          <AddOnRow
            key={cat.name}
            entry={cat}
            recommendation={recommendations.get(cat.name)}
            isSelected={selectedAddOns.has(cat.name)}
            onToggle={() => onToggle(cat.name)}
          />
        ))}
      </div>
    </div>
  );
}

function AddOnRow({
  entry,
  recommendation,
  isSelected,
  onToggle,
}: {
  entry: AddOnCatalogEntry;
  recommendation?: AddOnRecommendation;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const Icon = entry.icon;
  const isDrop = recommendation?.recommendation === "drop";
  const isInCurrent = recommendation?.isInCurrentPolicy ?? false;

  return (
    <div
      className={clsx(
        "flex items-start gap-3 p-3.5 rounded-2xl border transition-colors",
        // Selected state uses plum tint — matches the Toggle ON state
        // and the editorial brand accent. Plum auto-flips lifted in
        // dark mode so the selected card stays visibly highlighted.
        isSelected
          ? "border-brand-plum/30 bg-brand-plum/10"
          : "border-slate-200 bg-white hover:bg-slate-50/40"
      )}
    >
      <div
        className={clsx(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
          isSelected ? "bg-brand-plum" : "bg-slate-100"
        )}
      >
        <Icon
          className={clsx(
            "w-5 h-5",
            isSelected ? "text-white" : "text-slate-500"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-900 text-sm">
            {entry.name}
          </span>
          {isInCurrent && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-slate-200 text-slate-700 rounded">
              In Current
            </span>
          )}
          {isDrop && isInCurrent && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-amber-200 text-amber-800 rounded inline-flex items-center gap-0.5">
              <TrendingDown className="w-2.5 h-2.5" />
              Save by Dropping
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 mt-0.5 leading-snug">
          {entry.description}
        </p>
        {recommendation?.reasoning && recommendation.reasoning !== "(fallback heuristic)" && (
          <p className="text-[11px] text-slate-500 mt-1 italic leading-snug">
            {recommendation.reasoning}
          </p>
        )}
      </div>

      <Toggle isOn={isSelected} onChange={onToggle} />
    </div>
  );
}

/**
 * iOS-style sliding toggle switch.
 */
function Toggle({
  isOn,
  onChange,
}: {
  isOn: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={onChange}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors mt-1.5",
        // ON state uses brand-plum so the active toggle reads as a
        // primary product action (matches the editorial accent palette
        // — deep plum in light, lifted plum in dark, bright in both).
        // OFF state stays neutral slate for clear visual hierarchy.
        isOn ? "bg-brand-plum" : "bg-slate-300"
      )}
    >
      <span
        className={clsx(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          isOn ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

// Note: CurationAnimation was replaced with the CircularJourneyLoader component
// for a personalised car-on-track experience using the customer's actual
// vehicle, plate, RTO, and ownership years.
