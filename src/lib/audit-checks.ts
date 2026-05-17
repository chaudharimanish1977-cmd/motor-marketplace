/**
 * Audit-checks engine — given a parsed policy and a canonical add-on
 * name, returns the deterministic check trail that the "Show our work"
 * disclosure on each gap card renders (Phase 7c).
 *
 * Why deterministic + code-derived (not LLM-generated):
 *   1. Audit-defensible — same inputs always produce the same checks,
 *      so a customer (or counsel) can re-run and verify.
 *   2. No hallucination risk — exact numbers, exact references,
 *      no LLM "made-up vehicle facts".
 *   3. No schema migration — every existing PolicyReport inherits 7c
 *      for free at render time.
 *
 * Each check is a tuple of:
 *   - label:    plain-English description of WHAT we looked at
 *   - result:   pass / flag / neutral — semantic colour signal
 *   - evidence: WHAT we observed (concrete fact from the policy)
 *
 * A check with result="flag" is a reason the gap was raised. A check
 * with result="pass" is a guardrail that didn't trigger (we still
 * show some of these so the customer sees we checked them and they're
 * not the problem).
 */

import type { ParsedPolicy } from "@/lib/types";
import {
  deriveVehicleContext,
  getIndustryBenchmark,
  type IndustryBenchmark,
  type VehicleContext,
} from "@/lib/industry-benchmarks";

export interface AuditCheck {
  label: string;
  result: "flag" | "pass" | "neutral";
  evidence: string;
}

export interface GapEvidence {
  /** The canonical add-on name we matched the gap to. */
  canonical: string;
  /** Ordered list of deterministic checks underpinning the gap. */
  checks: AuditCheck[];
  /** Industry benchmark line shown below the checks. May be null when
   *  we don't have a defensible benchmark for this combination. */
  benchmark: IndustryBenchmark | null;
}

/**
 * Format a vehicle age in years into the phrasing we want shown in
 * evidence rows. Reads cleaner than a bare "3" and respects the
 * convention motor insurance uses (1y, 5y, 12y).
 */
function ageLabel(age: number): string {
  if (age <= 0) return "Less than a year old";
  if (age === 1) return "1 year";
  return `${age} years`;
}

/**
 * Generic "is this add-on present in the current policy?" check.
 * Every gap evidence trail starts with this one so the customer sees
 * the foundational fact: we read your policy and confirmed the cover
 * isn't there.
 */
function addOnPresenceCheck(
  parsedPolicy: ParsedPolicy,
  canonical: string,
  matchTerms: string[]
): AuditCheck {
  const present = parsedPolicy.addOns.some((a) => {
    const lower = a.name.toLowerCase();
    return matchTerms.some((t) => lower.includes(t));
  });
  return {
    label: `${canonical} present in current policy?`,
    result: present ? "pass" : "flag",
    evidence: present
      ? "Found in the add-on list on your policy."
      : "Not present in your current policy's add-on list.",
  };
}

/**
 * Build the full check trail + industry benchmark for a single gap.
 * Returns null when the canonical name doesn't map to anything we
 * know how to audit (in which case the gap renders without a "Show
 * our work" disclosure — graceful degradation).
 */
export function buildGapEvidence(
  canonical: string,
  parsedPolicy: ParsedPolicy
): GapEvidence | null {
  const ctx = deriveVehicleContext(parsedPolicy);
  const checks = buildChecksFor(canonical, parsedPolicy, ctx);
  if (!checks) return null;
  return {
    canonical,
    checks,
    benchmark: getIndustryBenchmark(canonical, ctx),
  };
}

function buildChecksFor(
  canonical: string,
  parsedPolicy: ParsedPolicy,
  ctx: VehicleContext
): AuditCheck[] | null {
  switch (canonical) {
    case "Zero Depreciation": {
      const flagsAge: AuditCheck = {
        label: "Vehicle age vs depreciation impact",
        result: ctx.vehicleAge >= 3 ? "flag" : "neutral",
        evidence:
          ctx.vehicleAge >= 11
            ? `${ageLabel(ctx.vehicleAge)} — parts attract heavy depreciation (up to 50%+) at this age.`
            : ctx.vehicleAge >= 6
              ? `${ageLabel(ctx.vehicleAge)} — depreciation on plastics, rubber and metal parts is meaningful at this age.`
              : ctx.vehicleAge >= 3
                ? `${ageLabel(ctx.vehicleAge)} — depreciation starts biting on most part categories.`
                : `${ageLabel(ctx.vehicleAge)} — depreciation cost on parts is still modest at this age.`,
      };
      return [
        addOnPresenceCheck(parsedPolicy, "Zero Depreciation", [
          "zero dep",
          "depreciation",
          "nil dep",
          "bumper to bumper",
        ]),
        flagsAge,
        {
          label: "Claim payout impact without zero-dep",
          result: ctx.vehicleAge >= 3 ? "flag" : "neutral",
          evidence:
            "Insurer deducts depreciation on plastics, rubber, metal and fibreglass parts before paying out.",
        },
      ];
    }

    case "Engine Protector": {
      const fuelEvidence = ctx.isCngOrLpg
        ? `${ctx.fuelType} declared on policy — engine intake is more vulnerable to water ingress and hydrostatic lock.`
        : `${ctx.fuelType || "Fuel type"} — standard exposure to engine flooding risk.`;
      return [
        addOnPresenceCheck(parsedPolicy, "Engine Protection", [
          "engine prot",
          "engine secure",
        ]),
        {
          label: "Fuel type and engine vulnerability",
          result: ctx.isCngOrLpg ? "flag" : "neutral",
          evidence: fuelEvidence,
        },
        {
          label: "City flood-risk profile",
          result: ctx.isFloodProneCity ? "flag" : "neutral",
          evidence: ctx.isFloodProneCity
            ? "Your RTO sits in a metro that sees recurring monsoon flooding."
            : "Your RTO isn't in our flood-prone metro list — standard exposure.",
        },
        {
          label: "Standard own-damage cover behaviour",
          result: "flag",
          evidence:
            "Hydrostatic lock / consequential water damage isn't covered by the base comprehensive policy.",
        },
      ];
    }

    case "Return to Invoice": {
      return [
        addOnPresenceCheck(parsedPolicy, "Return to Invoice", [
          "return to invoice",
          "rti",
          "invoice cover",
          "invoice price",
        ]),
        {
          label: "Vehicle age vs invoice / IDV gap",
          result: ctx.vehicleAge <= 5 ? "flag" : "neutral",
          evidence:
            ctx.vehicleAge <= 3
              ? `${ageLabel(ctx.vehicleAge)} — gap between original invoice and current IDV is at its widest here.`
              : ctx.vehicleAge <= 7
                ? `${ageLabel(ctx.vehicleAge)} — invoice / IDV gap is still meaningful.`
                : `${ageLabel(ctx.vehicleAge)} — invoice / IDV gap has narrowed; RTI matters less now.`,
        },
        {
          label: "Loss scenario coverage",
          result: ctx.vehicleAge <= 5 ? "flag" : "neutral",
          evidence:
            "On total loss / theft, the base policy pays IDV — RTI tops it up to the original invoice value.",
        },
      ];
    }

    case "Roadside Assistance": {
      return [
        addOnPresenceCheck(parsedPolicy, "Roadside Assistance", [
          "roadside",
          "rsa",
          "24x7",
        ]),
        {
          label: "Standard own-damage cover behaviour",
          result: "flag",
          evidence:
            "Towing, on-spot repair and battery jump-start aren't part of base comprehensive cover.",
        },
        {
          label: "Cost-to-benefit ratio at this premium tier",
          result: "neutral",
          evidence:
            "RSA typically adds ₹200–₹400/year — among the lowest-cost add-ons relative to utility.",
        },
      ];
    }

    case "NCB Protection": {
      return [
        addOnPresenceCheck(parsedPolicy, "NCB Protection", [
          "ncb prot",
          "no claim bonus prot",
        ]),
        {
          label: "Current NCB earned",
          result: ctx.ncbPercent >= 25 ? "flag" : "neutral",
          evidence:
            ctx.ncbPercent >= 45
              ? `${ctx.ncbPercent}% NCB — top of the discount ladder, worth protecting.`
              : ctx.ncbPercent >= 25
                ? `${ctx.ncbPercent}% NCB — meaningful discount that resets to 0 on any claim.`
                : ctx.ncbPercent > 0
                  ? `${ctx.ncbPercent}% NCB — early in the ladder, less material to protect today.`
                  : "0% NCB — no discount to protect yet.",
        },
        {
          label: "How NCB behaves on a single claim",
          result: ctx.ncbPercent >= 25 ? "flag" : "neutral",
          evidence:
            "Without NCB protection, even a single small claim wipes the entire discount on renewal — typically rebuilding over 4–5 claim-free years.",
        },
      ];
    }

    case "Consumables": {
      return [
        addOnPresenceCheck(parsedPolicy, "Consumables", ["consumable"]),
        {
          label: "Vehicle age vs typical workshop-bill deductions",
          result: ctx.vehicleAge >= 5 ? "flag" : "neutral",
          evidence:
            ctx.vehicleAge >= 5
              ? `${ageLabel(ctx.vehicleAge)} — major-repair frequency rises here, and consumables can be ₹5–15k per claim.`
              : `${ageLabel(ctx.vehicleAge)} — consumables exposure is modest on a newer car.`,
        },
        {
          label: "Standard own-damage cover behaviour",
          result: "flag",
          evidence:
            "Engine oil, coolant, AC gas, nuts and bolts are deducted from claim payouts unless covered.",
        },
      ];
    }

    case "Key Replacement": {
      return [
        addOnPresenceCheck(parsedPolicy, "Key Replacement", [
          "key replac",
          "key cover",
        ]),
        {
          label: "Vehicle smart-key profile",
          result: ctx.hasSmartKey ? "flag" : "neutral",
          evidence: ctx.hasSmartKey
            ? "Make commonly ships with dealer-programmed smart keys (replacement runs ₹12–25k+)."
            : "Standard mechanical / chipped key — replacement is typically inexpensive.",
        },
      ];
    }

    case "Loss of Personal Belongings": {
      return [
        addOnPresenceCheck(parsedPolicy, "Loss of Personal Belongings", [
          "personal belong",
          "belongings",
        ]),
        {
          label: "Standard own-damage cover behaviour",
          result: "flag",
          evidence:
            "Items stolen from the vehicle (laptops, bags, phones) aren't covered by the base policy.",
        },
      ];
    }

    default:
      return null;
  }
}
