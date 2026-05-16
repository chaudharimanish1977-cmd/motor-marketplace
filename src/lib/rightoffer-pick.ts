/**
 * RightOffer pick — the single indicative offer we pitch in the
 * Comparator tab.
 *
 * Deterministic (no LLM). Built from:
 *   - The RCP's required add-ons (defines what's included)
 *   - The customer's quote averages (defines the price floor)
 *   - A small undercut on Basic OD (~5%) to "win" on price where
 *     possible — represents the commission-passthrough story
 *     ("we keep 10% instead of agents' 15-20%, savings go to you")
 *
 * Synthetic insurer names per the locked V1 plan ("LLM simulated,
 * Non real partner names + 'indicative offer, final terms at
 * purchase' disclosure"). Real partner integration is a future
 * milestone.
 *
 * Right Offer rule encoded in the returned `beatsCustomerOn`:
 *   - "missing_essentials": no customer quote is RCP-complete; ours is
 *   - "price": customer has RCP-complete option, we're cheaper
 *   - "features": same price or we add value beyond price (rare)
 *   - "neither": customer has RCP-complete option AND cheaper than us
 *                — verdict steers customer to take theirs
 */

import type { ParsedPolicy } from "@/lib/types";
import type { RecommendedCoverageProfile } from "@/lib/recommended-coverage-profile";

const SYNTHETIC_INSURERS = ["BharatSure", "Vahana", "Suraksha"] as const;

const INSURER_TAGLINES: Record<string, string> = {
  BharatSure: "Pan-India garage network · Same-day claims",
  Vahana: "100% digital · Claims in 24 hours",
  Suraksha: "Family-first · Concierge claims service",
};

export interface RightOfferPick {
  insurerName: string;
  tagline: string;
  /** IDV — same as customer's anchor doc (we don't second-guess valuation). */
  idv: number;
  basicOd: number;
  basicTp: number;
  addOnPremium: number;
  totalPackage: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  /** RCP-complete by construction. */
  includedAddOns: string[];
  /** What dimension we beat the customer's best quote on. */
  beatsCustomerOn: "price" | "features" | "missing_essentials" | "neither";
  /** Customer-facing one-liner: why this is the Right Offer. */
  beatSummary: string;
  /** Negative = we're cheaper than customer's best; positive = we cost more. */
  priceVsCustomerBest: number;
  /** Always true in V1 — partners are synthetic. */
  isIndicative: true;
}

export interface CustomerQuoteSummary {
  grandTotal: number;
  basicOd?: number;
  basicTp?: number;
  isRcpComplete: boolean;
  isExactlyRcp: boolean;
  missingRequired: string[];
  extraNonRcp: string[];
  insurerName: string;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.round(n)
  );
}

export function generateRightOfferPick({
  rcp,
  customerQuotes,
  anchor,
}: {
  rcp: RecommendedCoverageProfile;
  customerQuotes: CustomerQuoteSummary[];
  anchor: ParsedPolicy;
}): RightOfferPick {
  // Deterministic insurer rotation based on vehicle identifier so the
  // same customer always sees the same synthetic insurer (avoids "wait,
  // why is the insurer different now" on refresh).
  const seed = `${anchor.vehicle?.registrationNumber ?? ""}-${anchor.idv}-${
    anchor.id
  }`;
  const insurerName =
    SYNTHETIC_INSURERS[hash(seed) % SYNTHETIC_INSURERS.length];
  const tagline = INSURER_TAGLINES[insurerName] ?? "";

  const idv = anchor.idv;

  // Price floor: average of customer quotes' basic OD + TP, then
  // undercut OD by ~5% (TP is regulated, can't undercut). Falls back
  // to anchor's premium when customer quotes are missing breakdowns.
  const validQuotes = customerQuotes.filter(
    (q) => typeof q.basicOd === "number" && typeof q.basicTp === "number"
  );
  const customerBasicOdAvg =
    validQuotes.length > 0
      ? validQuotes.reduce((s, q) => s + (q.basicOd ?? 0), 0) /
        validQuotes.length
      : anchor.premium?.basicOd ?? 0;
  const customerBasicTpAvg =
    validQuotes.length > 0
      ? validQuotes.reduce((s, q) => s + (q.basicTp ?? 0), 0) /
        validQuotes.length
      : anchor.premium?.basicTp ?? 0;

  const basicOd = Math.round(customerBasicOdAvg * 0.95);
  const basicTp = Math.round(customerBasicTpAvg);

  // Add-on premium = sum of RCP-required add-on estimates.
  const addOnPremium = Math.round(
    rcp.requiredAddOns.reduce(
      (s, a) => s + (a.estimatedAnnualPremium ?? 0),
      0
    )
  );

  const totalPackage = basicOd + basicTp + addOnPremium;
  // GST 18% (9% CGST + 9% SGST), standard motor insurance treatment.
  const cgst = Math.round(totalPackage * 0.09);
  const sgst = Math.round(totalPackage * 0.09);
  const grandTotal = totalPackage + cgst + sgst;

  // Determine what we beat (or fail to beat).
  const customerBestGrand =
    customerQuotes.length > 0
      ? Math.min(...customerQuotes.map((q) => q.grandTotal))
      : grandTotal;
  const priceDelta = grandTotal - customerBestGrand;
  const customerHasRcpComplete = customerQuotes.some((q) => q.isRcpComplete);

  let beatsCustomerOn: RightOfferPick["beatsCustomerOn"];
  let beatSummary: string;

  if (!customerHasRcpComplete) {
    // No customer quote covers the RCP — our pick does by construction.
    const missingAcrossAll = new Set<string>();
    customerQuotes.forEach((q) =>
      q.missingRequired.forEach((m) => missingAcrossAll.add(m))
    );
    const missingList = [...missingAcrossAll].join(", ");
    beatsCustomerOn = "missing_essentials";
    if (priceDelta <= 0) {
      beatSummary = `Includes ${missingList} — essentials none of your quotes had. And ₹${formatINR(
        Math.abs(priceDelta)
      )} cheaper than your best quote.`;
    } else {
      beatSummary = `Includes ${missingList} — essentials none of your quotes had. ₹${formatINR(
        priceDelta
      )} more than your cheapest quote, but covers gaps that could cost ₹50k+ at claim time.`;
    }
  } else if (priceDelta < 0) {
    // Customer has RCP-complete option(s), we're cheaper.
    beatsCustomerOn = "price";
    beatSummary = `Same RCP-complete coverage as your best quote, ₹${formatINR(
      Math.abs(priceDelta)
    )} cheaper.`;
  } else if (priceDelta === 0) {
    beatsCustomerOn = "features";
    beatSummary = `Same RCP-complete coverage at the same price. Either works.`;
  } else {
    // Customer's RCP-complete option is cheaper than us.
    beatsCustomerOn = "neither";
    const cheapestRcpComplete = customerQuotes
      .filter((q) => q.isRcpComplete)
      .sort((a, b) => a.grandTotal - b.grandTotal)[0];
    beatSummary = `${cheapestRcpComplete?.insurerName ?? "Your existing quote"} is ₹${formatINR(
      priceDelta
    )} cheaper at the same coverage. We'd take it over our pick.`;
  }

  return {
    insurerName,
    tagline,
    idv,
    basicOd,
    basicTp,
    addOnPremium,
    totalPackage,
    cgst,
    sgst,
    grandTotal,
    includedAddOns: rcp.requiredAddOns.map((a) => a.name),
    beatsCustomerOn,
    beatSummary,
    priceVsCustomerBest: priceDelta,
    isIndicative: true,
  };
}
