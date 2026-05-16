/**
 * Marketplace offers — the synthetic-but-real-shaped 3-offer panel that
 * lands inside ShellQuotesOpen during the renewal window (State A).
 *
 * Each offer is one of our three V1 synthetic partner insurers, surfaced
 * as a distinct tier so the customer sees real variation:
 *
 *   Lean      · Vahana       · ~7% cheaper · essentials only
 *   Balanced  · BharatSure   · same band   · essentials + standard
 *   Premium   · Suraksha     · ~10% richer · essentials + comfort
 *
 * Deterministic — the same customer, refreshing the page, sees the same
 * three offers. Drives off a hash of the policy ID so the experience is
 * stable but per-customer.
 *
 * No LLM. Pure transform. Realistic numbers (premiums ±15% around the
 * customer's anchor; IRDAI-shaped claim-settlement ratios; pan-India
 * network sizes that match each insurer's brand story).
 *
 * V1 disclosure: every offer is flagged `isIndicative: true` so the UI
 * can stamp the "indicative — final terms at purchase" note.
 */

import type { ParsedPolicy } from "@/lib/types";

/* ─── Insurer canon ─────────────────────────────────────────────────── */

export const SYNTHETIC_INSURERS = ["Vahana", "BharatSure", "Suraksha"] as const;
export type SyntheticInsurer = (typeof SYNTHETIC_INSURERS)[number];

/** Per-insurer brand story — taglines, claim ratios, network counts. */
const INSURER_PROFILE: Record<
  SyntheticInsurer,
  {
    tagline: string;
    claimSettlementRatio: number;
    cashlessNetworkSize: number;
    averageClaimDays: number;
  }
> = {
  Vahana: {
    tagline: "100% digital · Claims in 24 hours",
    claimSettlementRatio: 97.4,
    cashlessNetworkSize: 6_400,
    averageClaimDays: 1,
  },
  BharatSure: {
    tagline: "Pan-India garage network · Same-day claims",
    claimSettlementRatio: 95.8,
    cashlessNetworkSize: 8_500,
    averageClaimDays: 1,
  },
  Suraksha: {
    tagline: "Family-first · Concierge claims service",
    claimSettlementRatio: 96.6,
    cashlessNetworkSize: 7_100,
    averageClaimDays: 2,
  },
};

/* ─── Tier canon ────────────────────────────────────────────────────── */

export type MarketplaceTier = "lean" | "balanced" | "premium";

const TIER_LABEL: Record<MarketplaceTier, string> = {
  lean: "Lean Cover",
  balanced: "Balanced",
  premium: "Premium Cover",
};

const TIER_BLURB: Record<MarketplaceTier, string> = {
  lean: "Essentials only — the cheapest path to RCP-complete cover.",
  balanced: "Essentials plus the add-ons most owners regret skipping.",
  premium: "Everything you'd want at claim time. No gaps, no padding.",
};

/** OD-premium multiplier applied to the customer's anchor for each tier.
 *  TP is regulated and not multiplied. These are deliberately conservative
 *  (under-promise / over-deliver). */
const TIER_OD_MULTIPLIER: Record<MarketplaceTier, number> = {
  lean: 0.92,
  balanced: 0.98,
  premium: 1.06,
};

/** Add-on premium overlay per tier, expressed as a fraction of basic OD.
 *  Captures the "richer bundle → more add-on spend" story. */
const TIER_ADD_ON_RATIO: Record<MarketplaceTier, number> = {
  lean: 0.18,
  balanced: 0.28,
  premium: 0.42,
};

/** Add-on names baked into each tier. The lean tier mirrors the RCP
 *  minimum; balanced mirrors RCP + standard comfort; premium adds the
 *  comfort tier. Names match the catalogue used everywhere else. */
const TIER_ADD_ONS: Record<MarketplaceTier, string[]> = {
  lean: ["Zero Depreciation", "Engine Protection", "Return to Invoice"],
  balanced: [
    "Zero Depreciation",
    "Engine Protection",
    "Return to Invoice",
    "Roadside Assistance",
    "Consumables Cover",
  ],
  premium: [
    "Zero Depreciation",
    "Engine Protection",
    "Return to Invoice",
    "Roadside Assistance",
    "Consumables Cover",
    "Tyre Protection",
    "Key Replacement",
    "Personal Belongings",
  ],
};

/** Per-tier USP — single-line "why this offer" that anchors the card. */
const TIER_USP: Record<MarketplaceTier, string> = {
  lean: "Cheapest in this band — no compromises on the essentials.",
  balanced: "The sweet-spot bundle. What most owners actually end up buying.",
  premium: "Maximum coverage. The everything-included pick.",
};

/* ─── Shape of one offer ────────────────────────────────────────────── */

export interface MarketplaceOffer {
  /** Stable ID — survives refresh because it's derived from the anchor. */
  id: string;
  insurerName: SyntheticInsurer;
  tagline: string;

  tier: MarketplaceTier;
  tierLabel: string;
  tierBlurb: string;

  /** IDV — same as the customer's anchor (we don't second-guess valuation). */
  idv: number;
  basicOd: number;
  basicTp: number;
  addOnPremium: number;
  totalPackage: number;
  cgst: number;
  sgst: number;
  grandTotal: number;

  includedAddOns: string[];

  claimSettlementRatio: number;
  cashlessNetworkSize: number;
  averageClaimDays: number;

  /** One-liner anchor for the card. */
  usp: string;

  /** Always true in V1. The UI must surface this disclosure. */
  isIndicative: true;
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

function hash(s: string): number {
  let h = 5_381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Rotate the 3 synthetic insurers across the 3 tiers deterministically
 * per anchor. Same customer → same insurer in the same tier-slot.
 *
 * The default mapping is { lean: Vahana, balanced: BharatSure, premium:
 * Suraksha } — chosen because it lines up with each brand's story. We
 * rotate the start position based on the anchor hash so different
 * customers see different "lean insurer" pairings, but each customer's
 * mapping is stable across refreshes.
 */
function insurerForTier(
  tier: MarketplaceTier,
  seedHash: number
): SyntheticInsurer {
  const order: MarketplaceTier[] = ["lean", "balanced", "premium"];
  const offset = seedHash % SYNTHETIC_INSURERS.length;
  const tierIdx = order.indexOf(tier);
  return SYNTHETIC_INSURERS[(tierIdx + offset) % SYNTHETIC_INSURERS.length];
}

/* ─── Public API ────────────────────────────────────────────────────── */

/**
 * Build the 3-offer marketplace panel for a given anchor policy.
 *
 * Cheap, deterministic, idempotent — safe to call on every render. No
 * IO. No randomness. Same input → same output.
 */
export function generateMarketplaceOffers(
  anchor: ParsedPolicy
): MarketplaceOffer[] {
  const seed = `${anchor.id}|${anchor.vehicle?.registrationNumber ?? ""}|${anchor.idv}`;
  const seedHash = hash(seed);

  // Anchor premium pieces — fall back gracefully when the policy is missing
  // a breakdown (older parses).
  const anchorBasicOd =
    anchor.premium?.basicOd ?? Math.round(anchor.idv * 0.028);
  const anchorBasicTp =
    anchor.premium?.basicTp ?? Math.round(anchor.idv * 0.011);

  const tiers: MarketplaceTier[] = ["lean", "balanced", "premium"];

  return tiers.map((tier) => {
    const insurerName = insurerForTier(tier, seedHash);
    const profile = INSURER_PROFILE[insurerName];

    // Small deterministic jitter per insurer (±2.5%) so two tiers from
    // the same anchor don't look like multiples of each other.
    const jitter = ((hash(`${seed}|${insurerName}`) % 50) - 25) / 1000; // -0.025..+0.025

    const basicOd = roundTo(
      anchorBasicOd * (TIER_OD_MULTIPLIER[tier] + jitter),
      10
    );
    const basicTp = roundTo(anchorBasicTp, 10);
    const addOnPremium = roundTo(
      basicOd * TIER_ADD_ON_RATIO[tier],
      10
    );

    const totalPackage = basicOd + basicTp + addOnPremium;
    // GST 18% on motor insurance, split 9/9 CGST/SGST.
    const cgst = Math.round(totalPackage * 0.09);
    const sgst = Math.round(totalPackage * 0.09);
    const grandTotal = totalPackage + cgst + sgst;

    return {
      id: `mkt-${seedHash.toString(36)}-${tier}`,
      insurerName,
      tagline: profile.tagline,
      tier,
      tierLabel: TIER_LABEL[tier],
      tierBlurb: TIER_BLURB[tier],
      idv: anchor.idv,
      basicOd,
      basicTp,
      addOnPremium,
      totalPackage,
      cgst,
      sgst,
      grandTotal,
      includedAddOns: TIER_ADD_ONS[tier],
      claimSettlementRatio: profile.claimSettlementRatio,
      cashlessNetworkSize: profile.cashlessNetworkSize,
      averageClaimDays: profile.averageClaimDays,
      usp: TIER_USP[tier],
      isIndicative: true,
    };
  });
}

/** Small INR formatter — keep separate from the report-side formatter so
 *  callers don't have to choose. */
export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.round(n)
  );
}
