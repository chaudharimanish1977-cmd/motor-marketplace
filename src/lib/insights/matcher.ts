/**
 * Insight matcher — given a customer's parsed policy + driving
 * profile, returns the insights whose audience targeting filter
 * matches.
 *
 * Pure functions, no I/O. Easy to unit-test, easy to run inside a
 * server component on every /me/insights render.
 */

import type { ParsedPolicy } from "@/lib/types";
import { deriveVehicleContext } from "@/lib/industry-benchmarks";
import { matchCanonicalAddOn } from "@/lib/claim-scenarios";
import type {
  CanonicalAddOn,
  CustomerContext,
  DrivingProfile,
  Insight,
} from "@/lib/insights/types";

const ALL_CANONICAL_ADDONS: CanonicalAddOn[] = [
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
 * Build a CustomerContext snapshot from the parsed policy + driving
 * profile. The matcher reads from this snapshot; everything is
 * deterministic so the result is stable for a given (policy, profile)
 * pair.
 */
export function buildCustomerContext(
  parsedPolicy: ParsedPolicy,
  drivingProfile?: DrivingProfile
): CustomerContext {
  const ctx = deriveVehicleContext(parsedPolicy, drivingProfile);

  // Compute which canonical add-ons the customer has (and therefore
  // doesn't have). Uses the same fuzzy-match the audit uses for gap
  // detection — so a policy line called "Engine Secure Plus" counts
  // as having Engine Protector.
  const present = new Set<CanonicalAddOn>();
  for (const line of parsedPolicy.addOns ?? []) {
    const canonical = matchCanonicalAddOn(line.name) as CanonicalAddOn | null;
    if (canonical) present.add(canonical);
  }
  const missing = new Set<CanonicalAddOn>(
    ALL_CANONICAL_ADDONS.filter((a) => !present.has(a))
  );

  const pastClaimsBucket = bucketClaims(drivingProfile?.pastClaims);

  return {
    vehicleAge: ctx.vehicleAge,
    isCngOrLpg: ctx.isCngOrLpg,
    isFloodProneCity: ctx.isFloodProneCity,
    hasSmartKey: ctx.hasSmartKey,
    ncbPercent: ctx.ncbPercent,
    presentAddOns: present,
    missingAddOns: missing,
    pastClaimsBucket,
    priority: drivingProfile?.priority ?? null,
    otherCars: drivingProfile?.otherCars ?? null,
  };
}

function bucketClaims(
  pastClaims?: string
): "none" | "once" | "frequent" | null {
  if (!pastClaims) return null;
  const lower = pastClaims.toLowerCase();
  if (lower.startsWith("no")) return "none";
  if (lower.includes("twice")) return "frequent";
  if (lower.includes("once")) return "once";
  return null;
}

/**
 * Does the insight's audience filter match the customer? Every
 * specified condition must hold; unspecified conditions are ignored.
 * Returns boolean — callers compose this into "which insights to
 * surface for this customer".
 */
export function matchInsight(
  insight: Insight,
  ctx: CustomerContext
): boolean {
  const a = insight.audience;

  if (a.missingAddOns && !a.missingAddOns.every((x) => ctx.missingAddOns.has(x))) {
    return false;
  }
  if (a.hasAddOns && !a.hasAddOns.every((x) => ctx.presentAddOns.has(x))) {
    return false;
  }

  if (a.isCngOrLpg !== undefined && a.isCngOrLpg !== ctx.isCngOrLpg) return false;
  if (a.isFloodProneCity !== undefined && a.isFloodProneCity !== ctx.isFloodProneCity) {
    return false;
  }
  if (a.hasSmartKey !== undefined && a.hasSmartKey !== ctx.hasSmartKey) return false;

  if (a.minVehicleAge !== undefined && ctx.vehicleAge < a.minVehicleAge) return false;
  if (a.maxVehicleAge !== undefined && ctx.vehicleAge > a.maxVehicleAge) return false;
  if (a.minNcbPercent !== undefined && ctx.ncbPercent < a.minNcbPercent) return false;
  if (a.maxNcbPercent !== undefined && ctx.ncbPercent > a.maxNcbPercent) return false;

  if (a.pastClaims && (!ctx.pastClaimsBucket || !a.pastClaims.includes(ctx.pastClaimsBucket))) {
    return false;
  }
  if (a.priority && (!ctx.priority || !a.priority.includes(ctx.priority as never))) {
    return false;
  }
  if (a.otherCars && (!ctx.otherCars || !a.otherCars.includes(ctx.otherCars as never))) {
    return false;
  }

  return true;
}

/**
 * Filter the full catalogue down to the insights this customer
 * should see, ordered newest-first. Pure function — caller is
 * responsible for sourcing the catalogue (typically via
 * lib/insights/catalogue.ts).
 */
export function matchAllInsights(
  catalogue: Insight[],
  ctx: CustomerContext
): Insight[] {
  return catalogue
    .filter((i) => matchInsight(i, ctx))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

/**
 * For inline rendering inside /report/[id] — given the matching set
 * of insights, return the ones that attach to a specific gap card.
 * Used by WhatsMissingSection to look up "is there an insight
 * attached to my Engine Protector gap?"
 */
export function insightsForGap(
  matched: Insight[],
  gap: CanonicalAddOn
): Insight[] {
  return matched.filter(
    (i) => i.reportAttach?.section === "gaps" && i.reportAttach.gap === gap
  );
}
