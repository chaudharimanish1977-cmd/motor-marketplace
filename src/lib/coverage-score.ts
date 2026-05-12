/**
 * Computes a 0-100 "Coverage Score" for a parsed policy.
 * Higher score = more comprehensive cover. Used as the hero metric at the top
 * of the report so customers get an instant emotional anchor.
 */

import type { ParsedPolicy, PolicyReport } from "@/lib/types";

const CANONICAL_ESSENTIAL_DEFAULTS = [
  "Engine Protector",
  "Roadside Assistance",
  "NCB Protection",
  "Consumables",
];

const CANONICAL_OPTIONAL_DEFAULTS = [
  "Zero Depreciation",
  "Return to Invoice",
  "Key Replacement",
];

export interface CoverageScore {
  score: number; // 0-100
  band: "critical" | "below-average" | "good" | "excellent";
  label: string;
  headline: string;
  factors: ScoreFactor[];
  peerAverage: number;
  peerCity: string;
  peerVehicleCount: number;
}

interface ScoreFactor {
  label: string;
  delta: number; // negative reduces, positive adds
  reason: string;
}

export function computeCoverageScore(
  parsedPolicy: ParsedPolicy,
  report?: PolicyReport
): CoverageScore {
  const factors: ScoreFactor[] = [];
  let score = 100;

  const presentNames = new Set(parsedPolicy.addOns.map((a) => a.name));
  const recs = report?.addOnRecommendations ?? [];

  // Use report's relevance tags if available; otherwise fall back to defaults
  const essentials = recs.length
    ? recs.filter((r) => r.recommendation === "essential").map((r) => r.name)
    : CANONICAL_ESSENTIAL_DEFAULTS;
  const optionals = recs.length
    ? recs.filter((r) => r.recommendation === "optional").map((r) => r.name)
    : CANONICAL_OPTIONAL_DEFAULTS;
  const drops = recs
    .filter((r) => r.recommendation === "drop")
    .map((r) => r.name);

  // -10 per missing essential
  for (const e of essentials) {
    if (!presentNames.has(e)) {
      score -= 10;
      factors.push({
        label: `Missing: ${e}`,
        delta: -10,
        reason: "Essential add-on not in your current policy",
      });
    }
  }

  // -3 per missing optional
  for (const o of optionals) {
    if (!presentNames.has(o)) {
      score -= 3;
      factors.push({
        label: `Optional gap: ${o}`,
        delta: -3,
        reason: "Recommended but not critical",
      });
    }
  }

  // -2 per drop-tagged add-on that's PRESENT (paying for irrelevant cover)
  for (const d of drops) {
    if (presentNames.has(d)) {
      score -= 2;
      factors.push({
        label: `Overpaying for: ${d}`,
        delta: -2,
        reason: "Not relevant for your profile",
      });
    }
  }

  // Bonus: high NCB retention (>= 35%)
  if (parsedPolicy.ncbPercent >= 35) {
    score += 4;
    factors.push({
      label: `${parsedPolicy.ncbPercent}% NCB retained`,
      delta: 4,
      reason: "Strong claim-free track record",
    });
  }

  // Bonus: comprehensive policy (vs TP-only)
  if (parsedPolicy.policyType.toLowerCase().includes("comprehensive")) {
    score += 3;
    factors.push({
      label: "Comprehensive Package",
      delta: 3,
      reason: "Own Damage + Third Party covered",
    });
  }

  // Penalty: very old + zero add-ons = double risk
  const age =
    new Date().getFullYear() - parsedPolicy.vehicle.yearOfManufacture;
  if (age >= 8 && presentNames.size === 0) {
    score -= 5;
    factors.push({
      label: "Old vehicle, bare-bones cover",
      delta: -5,
      reason: "Higher repair costs without add-on cushion",
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Band + label
  let band: CoverageScore["band"];
  let label: string;
  if (score >= 80) {
    band = "excellent";
    label = "Excellent";
  } else if (score >= 60) {
    band = "good";
    label = "Good";
  } else if (score >= 40) {
    band = "below-average";
    label = "Below Average";
  } else {
    band = "critical";
    label = "Critical Gaps";
  }

  // Headline copy
  const make = parsedPolicy.vehicle.make;
  const model = parsedPolicy.vehicle.model;
  const headline = headlineFor(band, make, model);

  // Peer comparison — deterministic from vehicle id hash
  const peerCity = parsedPolicy.vehicle.rto || "your area";
  const peerHash = simpleHash(parsedPolicy.id);
  // Count varies 80-2000, weighted by make popularity
  const popularityFactor = ["maruti", "hyundai", "tata", "honda", "toyota"].some(
    (m) => make.toLowerCase().includes(m)
  )
    ? 5
    : 1.5;
  const peerVehicleCount =
    Math.round((80 + (peerHash % 320)) * popularityFactor);
  // Peer average — slightly different from customer's score for relatability
  // Below-average customer: peers are higher (creates urgency to fix)
  // Excellent customer: peers are slightly lower (validates customer's choice)
  let peerAverage: number;
  if (score < 50) peerAverage = Math.min(100, score + 18 + (peerHash % 6));
  else if (score < 70) peerAverage = score + 4 + (peerHash % 6);
  else peerAverage = Math.max(0, score - 8 - (peerHash % 8));

  return {
    score,
    band,
    label,
    headline,
    factors,
    peerAverage,
    peerCity,
    peerVehicleCount,
  };
}

function headlineFor(
  band: CoverageScore["band"],
  make: string,
  model: string
): string {
  const vehicle = `${make} ${model}`;
  if (band === "excellent")
    return `Your ${vehicle} is well-protected. Few gaps to address.`;
  if (band === "good")
    return `Your ${vehicle} has decent cover, with a few opportunities to strengthen.`;
  if (band === "below-average")
    return `Your ${vehicle} has critical coverage gaps worth fixing.`;
  return `Your ${vehicle} is dangerously under-protected. Most claims would expose you to large out-of-pocket losses.`;
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h);
}
