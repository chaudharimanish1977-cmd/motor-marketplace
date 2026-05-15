import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findById, findOne, appendRow, Tables } from "@/lib/db";
import {
  generateTieredBids,
  type TierComposition,
} from "@/lib/insurer-personas";
import type {
  ParsedPolicy,
  PolicyReport,
  RFQ,
  Bid,
  AddOnRecommendation,
  TierSummary,
  BidTier,
} from "@/lib/types";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const BidRequestSchema = z.object({
  parsedPolicyId: z.string().uuid(),
  selectedAddOns: z.array(z.string()),
  desiredIdv: z.number().positive(),
  hasPreExistingClaim: z.boolean(),
  preExistingClaimDetails: z.string().optional(),
});

// Fallback for reports generated before addOnRecommendations was added.
function fallbackAddOnRecommendations(
  parsedPolicy: ParsedPolicy
): AddOnRecommendation[] {
  const age =
    new Date().getFullYear() - parsedPolicy.vehicle.yearOfManufacture;
  const inCurrent = new Set(parsedPolicy.addOns.map((a) => a.name));
  const fuelLow = parsedPolicy.vehicle.fuelType.toLowerCase();
  const isCNG = fuelLow.includes("cng") || fuelLow.includes("lpg");

  const canonical = [
    "Zero Depreciation",
    "Engine Protector",
    "Return to Invoice",
    "Roadside Assistance",
    "NCB Protection",
    "Consumables",
    "Key Replacement",
    "Loss of Personal Belongings",
  ];

  return canonical.map((name) => {
    let rec: "essential" | "optional" | "drop" = "optional";
    if (name === "Zero Depreciation") rec = age <= 5 ? "essential" : age <= 10 ? "optional" : "drop";
    else if (name === "Engine Protector") rec = isCNG || age >= 5 ? "essential" : "optional";
    else if (name === "Return to Invoice") rec = age <= 3 ? "essential" : age <= 7 ? "optional" : "drop";
    else if (name === "Roadside Assistance") rec = "essential";
    else if (name === "NCB Protection") rec = parsedPolicy.ncbPercent >= 35 ? "essential" : parsedPolicy.ncbPercent >= 20 ? "optional" : "drop";
    else if (name === "Consumables") rec = age >= 5 ? "essential" : "optional";
    else if (name === "Key Replacement") rec = "optional";
    else if (name === "Loss of Personal Belongings") rec = "drop";

    return {
      name,
      isInCurrentPolicy: inCurrent.has(name),
      recommendation: rec,
      reasoning: "(fallback heuristic)",
      estimatedAnnualPremium: 0,
    };
  });
}

/**
 * Bump a single bid's grandTotal by `targetGrandTotal - bid.grandTotal`,
 * applied as a pre-GST uplift to addOnPremium. CGST/SGST are recomputed
 * proportionally so the breakdown still reconciles to grandTotal.
 */
function upliftBid(bid: Bid, targetGrandTotal: number): void {
  if (bid.grandTotal >= targetGrandTotal) return;
  const upliftPostGst = targetGrandTotal - bid.grandTotal;
  // grandTotal = totalPackage + cgst + sgst, GST is 18% on totalPackage,
  // so an x increment to grandTotal corresponds to x / 1.18 pre-GST.
  const upliftPreGst = Math.round(upliftPostGst / 1.18);
  bid.addOnPremium += upliftPreGst;
  bid.totalPackage += upliftPreGst;
  // Split the GST half-and-half (CGST + SGST) per the breakdown card.
  const gstDelta = Math.round((upliftPreGst * 0.18) / 2);
  bid.cgst += gstDelta;
  bid.sgst += gstDelta;
  bid.grandTotal = Math.round((bid.totalPackage + bid.cgst + bid.sgst) / 10) * 10;
}

/**
 * Mutate the tier bids in-place so each tier's WINNING bid is at least 5%
 * above the previous tier's winning bid. Applies a uniform uplift to ALL
 * bids in the offending tier so the within-tier ranking is preserved.
 */
function enforceMonotonicTiers(tiers: { tier: BidTier; bids: Bid[] }[]): void {
  // Sort by tier so we iterate in order 1 -> 2 -> 3.
  const byTier = new Map(tiers.map((t) => [t.tier, t]));
  for (const tier of [2, 3] as BidTier[]) {
    const prev = byTier.get((tier - 1) as BidTier);
    const cur = byTier.get(tier);
    if (!prev || !cur) continue;
    const prevWinner = [...prev.bids].sort((a, b) => a.grandTotal - b.grandTotal)[0];
    const curWinner = [...cur.bids].sort((a, b) => a.grandTotal - b.grandTotal)[0];
    if (!prevWinner || !curWinner) continue;
    const minRequired = Math.ceil(prevWinner.grandTotal * 1.05);
    if (curWinner.grandTotal >= minRequired) continue;
    const upliftPostGst = minRequired - curWinner.grandTotal;
    console.warn(
      `[bid] Tier ${tier} winner (₹${curWinner.grandTotal}) was at/below ` +
        `Tier ${tier - 1} winner (₹${prevWinner.grandTotal}); applying ` +
        `₹${upliftPostGst} uplift to all ${cur.bids.length} bids in Tier ${tier}.`,
    );
    for (const b of cur.bids) {
      upliftBid(b, b.grandTotal + upliftPostGst);
    }
  }
}

const CANONICAL_ADD_ONS = [
  "Zero Depreciation",
  "Engine Protector",
  "Return to Invoice",
  "Roadside Assistance",
  "NCB Protection",
  "Consumables",
  "Key Replacement",
  "Loss of Personal Belongings",
];

/**
 * Compute the 3 tier compositions deterministically.
 *
 * Tiers are ANCHORED to what the customer selected in the bundle builder:
 *
 *   Tier 1 "Basic"        — customer's selection MINUS optionals
 *                            (essentials-only subset = minimum premium for their choice).
 *   Tier 2 "Recommended"  — customer's selection EXACTLY (drops removed).
 *                            If the customer selected nothing, auto-fill with all
 *                            essentials so the recommended tier is always meaningful.
 *   Tier 3 "Super Cover"  — customer's selection UNION all essential + all optional
 *                            add-ons (drops removed) = maximum claim coverage.
 *
 * Why anchored to customer's selection: the customer just curated add-ons in the
 * bundle builder. Their selection IS their preference and must be respected at
 * the Recommended tier. Basic = save money by trimming; Super = upgrade to max.
 */
function computeTierCompositions(
  parsedPolicy: ParsedPolicy,
  recommendations: AddOnRecommendation[],
  userSelectedAddOns: string[]
): TierComposition[] {
  void parsedPolicy;
  const recByName = new Map(recommendations.map((r) => [r.name, r]));
  const isDrop = (n: string) => recByName.get(n)?.recommendation === "drop";
  const isEssential = (n: string) =>
    recByName.get(n)?.recommendation === "essential";
  const isOptional = (n: string) =>
    recByName.get(n)?.recommendation === "optional";

  // Strip any drop-tagged add-ons from the customer's selection up-front.
  const customerSelection = userSelectedAddOns.filter(
    (n) => CANONICAL_ADD_ONS.includes(n) && !isDrop(n)
  );

  // Edge case: customer selected nothing. Auto-fill Recommended with all essentials
  // so the tier is meaningful. (Confirmed UX choice — option B.)
  const effectiveSelection =
    customerSelection.length === 0
      ? recommendations
          .filter((r) => r.recommendation === "essential")
          .map((r) => r.name)
      : customerSelection;

  // Tier 2 (Recommended): the customer's selection (or auto-essentials)
  const tier2AddOns = [...effectiveSelection];

  // Tier 1 (Basic): essentials-only subset of Tier 2 (drops optionals to reduce premium)
  const tier1AddOns = tier2AddOns.filter((n) => isEssential(n));

  // Tier 3 (Super): Tier 2 + any remaining essentials + all optionals (drops excluded)
  const tier2Set = new Set(tier2AddOns);
  const remainingForTier3 = recommendations
    .filter(
      (r) =>
        (r.recommendation === "essential" || r.recommendation === "optional") &&
        !tier2Set.has(r.name)
    )
    .map((r) => r.name);
  const tier3AddOns = [...tier2AddOns, ...remainingForTier3];

  // Reference both type-guard helpers so TS doesn't warn about unused symbols.
  void isOptional;

  const customerAutoFilled = customerSelection.length === 0;
  const tier1IsSubset =
    tier1AddOns.length < tier2AddOns.length || tier1AddOns.length === 0;
  const tier3HasExtras = tier3AddOns.length > tier2AddOns.length;

  return [
    {
      tier: 1 as BidTier,
      label: "Basic",
      tagline: tier1IsSubset
        ? "Minimum premium — essential add-ons only"
        : "Minimum premium — your selection's essential subset",
      includedAddOns: tier1AddOns,
      available: true,
    },
    {
      tier: 2 as BidTier,
      label: "Recommended",
      tagline: customerAutoFilled
        ? "All AI-recommended essential add-ons for your profile"
        : "Exactly what you selected — your curated cover",
      includedAddOns: tier2AddOns,
      available: true,
    },
    {
      tier: 3 as BidTier,
      label: "Super Cover",
      tagline: tier3HasExtras
        ? "Maximum claim coverage — every relevant add-on for your profile"
        : "Maximum claim coverage — you've already opted for everything relevant",
      includedAddOns: tier3AddOns,
      available: true,
    },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = BidRequestSchema.parse(body);

    const parsedPolicy = await findById<ParsedPolicy>(
      Tables.PARSED_POLICIES,
      validated.parsedPolicyId
    );
    if (!parsedPolicy) {
      return NextResponse.json(
        { error: "Parsed policy not found" },
        { status: 404 }
      );
    }

    const report = await findOne<PolicyReport>(
      Tables.REPORTS,
      (r) => r.parsedPolicyId === validated.parsedPolicyId
    );
    if (!report) {
      return NextResponse.json(
        { error: "Report not yet generated for this policy" },
        { status: 400 }
      );
    }

    const rfq: RFQ = {
      id: randomUUID(),
      parsedPolicyId: validated.parsedPolicyId,
      reportId: report.id,
      createdAt: new Date().toISOString(),
      desiredAddOns: validated.selectedAddOns,
      desiredIdv: validated.desiredIdv,
      hasPreExistingClaim: validated.hasPreExistingClaim,
      preExistingClaimDetails: validated.preExistingClaimDetails,
    };
    await appendRow<RFQ>(Tables.RFQS, rfq);

    const addOnRecs =
      report.addOnRecommendations ?? fallbackAddOnRecommendations(parsedPolicy);

    const tierCompositions = computeTierCompositions(
      parsedPolicy,
      addOnRecs,
      validated.selectedAddOns
    );

    console.log(
      `[bid] Tier compositions for RFQ ${rfq.id}:`,
      tierCompositions.map((t) => `T${t.tier}: [${t.includedAddOns.join(",")}]`).join(" | ")
    );

    const startTime = Date.now();
    const tiers = await generateTieredBids(
      {
        parsedPolicy,
        desiredIdv: validated.desiredIdv,
        hasPreExistingClaim: validated.hasPreExistingClaim,
        preExistingClaimDetails: validated.preExistingClaimDetails,
        tierCompositions,
      },
      rfq.id
    );
    console.log(
      `[bid] Tiered bids generated in ${Date.now() - startTime}ms`
    );

    // Enforce strictly-increasing tier prices. The LLM occasionally produces
    // degenerate output where Tier 2's winner has the same (or lower) grand
    // total as Tier 1's, which makes the "Recommended" tier look broken
    // against "Basic" on the next screen. Apply a deterministic uplift so
    // each tier's winning total is at least 5% above the previous tier's.
    enforceMonotonicTiers(tiers);

    // Persist all bids
    for (const tier of tiers) {
      for (const bid of tier.bids) {
        await appendRow<Bid>(Tables.BIDS, bid);
      }
    }

    const tierSummaries: TierSummary[] = tiers.map((t) => ({
      tier: t.tier,
      label: t.label,
      tagline: t.tagline,
      available: t.available,
      unavailableReason: t.unavailableReason,
      includedAddOns: t.includedAddOns,
      bids: t.bids,
    }));

    return NextResponse.json({
      rfqId: rfq.id,
      tiers: tierSummaries,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: err.issues },
        { status: 400 }
      );
    }
    console.error("[bid] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unknown error during bidding",
      },
      { status: 500 }
    );
  }
}
