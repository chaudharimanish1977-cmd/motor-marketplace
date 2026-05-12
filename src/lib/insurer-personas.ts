/**
 * Tiered insurer-personas bid generator.
 *
 * Generates 3 coverage tiers × 3 invented insurer brands = 9 bids per RFQ.
 *
 *   Tier 1 "Same-Price"  — best coverage at customer's CURRENT premium ±10%.
 *                          Marked unavailable if no improvement possible at floor pricing.
 *   Tier 2 "Comfort+"    — meaningful upgrade at +20-25%, includes all "essential" add-ons.
 *   Tier 3 "Super Cover" — maximum coverage with "essential" + "optional" add-ons.
 *                          Capped at reasonable premium (NOT 5x) to preserve credibility.
 *
 * Why tiers (not single winner): a single "lowest wins" bid can quote 5x customer's
 * current premium — commercially absurd and breaks trust. The tiered "Good/Better/Best"
 * pattern anchors at current price (no shock), gives an upgrade path, and lets insurers
 * compete tier-by-tier (some are price-fighters, some are service-focused).
 */

import { randomUUID } from "crypto";
import { callClaude, extractJSON } from "@/lib/anthropic";
import type {
  Bid,
  BidTier,
  ParsedPolicy,
} from "@/lib/types";

const SYSTEM_PROMPT = `You are simulating a 3-tier insurance marketplace. The server has ALREADY decided what add-ons go in each tier — your ONLY job is to price each (tier × insurer) combination using the customer's current premium as the anchor, and write a one-sentence USP per (tier × insurer).

DO NOT change the add-on composition for any tier. Use exactly the addOns array provided for each tier.

THE 3 INSURER PERSONAS:

1. **BharatSure General Insurance** — "India's neighbourhood insurer"
   • OD adjustment: customer's current netOd × 0.96 to 1.04
   • Service-focused; large garage network
   • Claim Settlement Ratio: 91-93%; Garage count: 4,500-5,200

2. **Vahana Insurance Co.** — "Built for the modern Indian driver"
   • OD adjustment: customer's current netOd × 0.88 to 0.95 (typically cheapest)
   • Tech-first; aggressive on price
   • Claim Settlement Ratio: 94-96%; Garage count: 3,200-3,800

3. **Suraksha Motors Insurance** — "Old-school trust, modern coverage"
   • OD adjustment: customer's current netOd × 0.93 to 1.00
   • Balanced; relationship-led
   • Claim Settlement Ratio: 89-92%; Garage count: 3,800-4,400

PRICING METHODOLOGY (apply for each tier × insurer combination — 9 combinations total):

Step 1 — currentNetOd = parsed_policy.premium.totalOd (this is AFTER customer's current NCB).
       currentTp = parsed_policy.premium.totalTp
       currentMandatory = PA Owner ₹325 + PA Unnamed ₹250 (if applicable) + LL Paid Driver ₹50

Step 2 — insurerOd = currentNetOd × insurer's modifier.

Step 3 — addOnPremium for THIS tier's specific add-on list (vary ±15% per insurer).
       Add-on price guideposts (cap matters — DO NOT exceed):
         • Zero Depreciation: 1.5% of IDV (min ₹500, cap ₹15,000)
         • Engine Protector: max(₹1,200, 0.15% of IDV), cap ₹3,000
         • Return to Invoice: 1.0% of IDV (cap ₹10,000)
         • Consumables: ₹600-1,200
         • Roadside Assistance: ₹150-300
         • NCB Protection: ₹400-800
         • Key Replacement: ₹300-700
         • Loss of Personal Belongings: ₹150-300

Step 4 — subtotal = insurerOd + currentTp + addOnPremium + currentMandatory.
       If hasPreExistingClaim, +5-10% on subtotal.

Step 5 — GST 18% = 9% CGST + 9% SGST on subtotal.

Step 6 — grandTotal = subtotal + GST. Round to nearest ₹10.

CRITICAL — TIER PRICE ORDERING (HARD requirement):
The 3 tiers MUST satisfy: Tier1.cheapest ≤ Tier2.cheapest ≤ Tier3.cheapest.
- Tier 1 add-ons ⊆ Tier 2 add-ons ⊆ Tier 3 add-ons (server guarantees this), so prices MUST be monotonic.
- If Tier 1 = Tier 2 (same add-ons), produce identical pricing for those tiers — that's correct.
- NEVER quote Tier 2 cheaper than Tier 1 or Tier 3 cheaper than Tier 2.

OUTPUT FORMAT (return ONLY this JSON):

{
  "tiers": [
    {
      "tier": 1,
      "bids": [
        {
          "insurerName": "BharatSure General Insurance",
          "insurerTagline": "India's neighbourhood insurer",
          "insurerStrengths": ["string", "string", "string"],
          "basicOd": number,
          "basicTp": number,
          "addOnPremium": number,
          "totalPackage": number,
          "cgst": number,
          "sgst": number,
          "grandTotal": number,
          "garageNetworkSize": "string (e.g. '4,800+ cashless garages')",
          "claimSettlementRatio": "string (e.g. '92.4% (FY 2025)')",
          "uniqueSellingPoint": "string (1 short sentence specific to THIS customer + THIS tier — reference the vehicle + the tier's distinctive value)"
        },
        { ...Vahana bid for Tier 1... },
        { ...Suraksha bid for Tier 1... }
      ]
    },
    { "tier": 2, "bids": [BharatSure, Vahana, Suraksha] },
    { "tier": 3, "bids": [BharatSure, Vahana, Suraksha] }
  ]
}

NOTES:
- Each tier's 3 insurer bids vary 5-12% on grandTotal.
- All money fields are integer INR.
- USPs MUST be different across tiers (e.g., Tier 1 USP focuses on price savings; Tier 3 USP focuses on premium protection).`;

/**
 * Tier composition pre-computed by the server. The LLM only prices these.
 */
export interface TierComposition {
  tier: BidTier;
  label: string;
  tagline: string;
  includedAddOns: string[];
  available: boolean;
  unavailableReason?: string;
}

interface BidGenerationInput {
  parsedPolicy: ParsedPolicy;
  desiredIdv: number;
  hasPreExistingClaim: boolean;
  preExistingClaimDetails?: string;
  tierCompositions: TierComposition[];
}

type RawBidFields = Omit<
  Bid,
  | "id"
  | "rfqId"
  | "isWinner"
  | "rank"
  | "receivedAt"
  | "tier"
  | "tierLabel"
  | "tierTagline"
  | "tierIncludedAddOns"
>;

interface RawTier {
  tier: BidTier;
  bids: RawBidFields[];
}

interface TierGenerationResponse {
  tiers: RawTier[];
}

export interface GeneratedTierBids {
  tier: BidTier;
  label: string;
  tagline: string;
  available: boolean;
  unavailableReason?: string;
  includedAddOns: string[];
  bids: Bid[]; // ranked, stamped, ready to persist
}

// Canonical add-on price estimates — used for fallback deterministic pricing
// when the LLM fails to differentiate tier prices monotonically, AND for the
// transparency breakdown on the offer-detail page.
export function estimateAddOnPremium(name: string, idv: number): number {
  switch (name) {
    case "Zero Depreciation":
      return Math.min(15000, Math.max(500, Math.round(idv * 0.015)));
    case "Engine Protector":
      return Math.min(3000, Math.max(1200, Math.round(idv * 0.0015)));
    case "Return to Invoice":
      return Math.min(10000, Math.max(500, Math.round(idv * 0.01)));
    case "Consumables":
      return 900;
    case "Roadside Assistance":
      return 250;
    case "NCB Protection":
      return 600;
    case "Key Replacement":
      return 500;
    case "Loss of Personal Belongings":
      return 250;
    default:
      return 500;
  }
}

export async function generateTieredBids(
  input: BidGenerationInput,
  rfqId: string
): Promise<GeneratedTierBids[]> {
  const {
    parsedPolicy,
    desiredIdv,
    hasPreExistingClaim,
    tierCompositions,
  } = input;

  const vehicleAge =
    new Date().getFullYear() - parsedPolicy.vehicle.yearOfManufacture;

  // Available tiers only — unavailable tiers don't go to LLM
  const availableTiers = tierCompositions.filter((t) => t.available);

  const customerProfile = {
    vehicle: {
      ...parsedPolicy.vehicle,
      ageYears: vehicleAge,
    },
    idv: desiredIdv,
    ncbPercent: parsedPolicy.ncbPercent,
    rto: parsedPolicy.vehicle.rto,
    currentPremium: parsedPolicy.premium.grandTotal,
    currentNetOd: parsedPolicy.premium.totalOd,
    currentTp: parsedPolicy.premium.totalTp,
    hasPreExistingClaim,
  };

  const tierSpec = availableTiers.map((t) => ({
    tier: t.tier,
    label: t.label,
    addOns: t.includedAddOns,
  }));

  const userMessage = `Price these 3 pre-defined coverage tiers for this customer:

<customer_profile>
${JSON.stringify(customerProfile, null, 2)}
</customer_profile>

<tier_composition>
${JSON.stringify(tierSpec, null, 2)}
</tier_composition>

For each tier, produce 3 insurer bids (BharatSure, Vahana, Suraksha) using the pricing methodology. The add-on lists are FIXED — only compute prices and write USPs.

Return ONLY the JSON object.`;

  const response = await callClaude({
    system: SYSTEM_PROMPT,
    userMessage,
    maxTokens: 8000,
    temperature: 0.4,
  });

  const parsed = extractJSON<TierGenerationResponse>(response);

  if (!parsed.tiers || parsed.tiers.length === 0) {
    throw new Error(
      `Expected tier bids, got ${parsed.tiers?.length ?? 0}. Raw: ${JSON.stringify(parsed).slice(0, 200)}`
    );
  }

  const now = new Date().toISOString();
  const llmTierMap = new Map<BidTier, RawTier>();
  for (const rt of parsed.tiers) llmTierMap.set(rt.tier, rt);

  // Build the result from the SERVER's tier compositions, attaching LLM bids
  const result: GeneratedTierBids[] = tierCompositions.map((tc): GeneratedTierBids => {
    if (!tc.available) {
      return {
        tier: tc.tier,
        label: tc.label,
        tagline: tc.tagline,
        available: false,
        unavailableReason: tc.unavailableReason,
        includedAddOns: [],
        bids: [],
      };
    }

    const llmTier = llmTierMap.get(tc.tier);
    if (!llmTier || !llmTier.bids || llmTier.bids.length === 0) {
      // LLM dropped this tier — should not happen but degrade gracefully
      return {
        tier: tc.tier,
        label: tc.label,
        tagline: tc.tagline,
        available: false,
        unavailableReason: "Bidding error — please retry",
        includedAddOns: tc.includedAddOns,
        bids: [],
      };
    }

    const sortedBids = [...llmTier.bids].sort(
      (a, b) => a.grandTotal - b.grandTotal
    );

    const stampedBids: Bid[] = sortedBids.map((b, idx) => ({
      ...b,
      id: randomUUID(),
      rfqId,
      tier: tc.tier,
      tierLabel: tc.label,
      tierTagline: tc.tagline,
      tierIncludedAddOns: tc.includedAddOns,
      isWinner: idx === 0,
      rank: idx + 1,
      receivedAt: now,
    }));

    return {
      tier: tc.tier,
      label: tc.label,
      tagline: tc.tagline,
      available: true,
      includedAddOns: tc.includedAddOns,
      bids: stampedBids,
    };
  });

  // Server-side validation + repair: enforce monotonic pricing across tiers.
  // If LLM violates Tier 1 ≤ Tier 2 ≤ Tier 3 (cheapest of each), recompute the
  // misordered tier's pricing deterministically by adding the diff in add-on
  // costs to the previous tier's winning grandTotal.
  enforceMonotonicTierPricing(result, parsedPolicy);

  return result;
}

function enforceMonotonicTierPricing(
  tiers: GeneratedTierBids[],
  parsedPolicy: ParsedPolicy
) {
  for (let i = 1; i < tiers.length; i++) {
    const prev = tiers[i - 1];
    const cur = tiers[i];
    if (!prev.available || !cur.available) continue;

    const prevWinPrice = prev.bids[0]?.grandTotal ?? 0;
    const curWinPrice = cur.bids[0]?.grandTotal ?? 0;

    if (curWinPrice >= prevWinPrice) continue; // already monotonic

    // Compute deterministic uplift from prev tier to cur tier
    const newAddOns = cur.includedAddOns.filter(
      (n) => !prev.includedAddOns.includes(n)
    );
    const upliftPerInsurer = newAddOns.reduce(
      (sum, name) => sum + estimateAddOnPremium(name, parsedPolicy.idv),
      0
    );
    const upliftWithGst = Math.round(upliftPerInsurer * 1.18 / 10) * 10;

    // Re-base each insurer's bid in this tier off the equivalent insurer in prev tier
    cur.bids = cur.bids.map((b) => {
      const prevSameInsurer = prev.bids.find(
        (pb) => pb.insurerName === b.insurerName
      );
      const newGrandTotal = (prevSameInsurer?.grandTotal ?? prevWinPrice) + upliftWithGst;
      const ratio = newGrandTotal / b.grandTotal;
      return {
        ...b,
        addOnPremium: Math.round(b.addOnPremium * ratio),
        totalPackage: Math.round(b.totalPackage * ratio),
        cgst: Math.round(b.cgst * ratio),
        sgst: Math.round(b.sgst * ratio),
        grandTotal: newGrandTotal,
      };
    });

    // Re-sort and re-rank after price adjustment
    cur.bids.sort((a, b) => a.grandTotal - b.grandTotal);
    cur.bids = cur.bids.map((b, idx) => ({
      ...b,
      isWinner: idx === 0,
      rank: idx + 1,
    }));
  }
}
