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
import type { DrivingProfile } from "@/components/driving-profile-card";
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
 *
 * When `drivingProfile` is provided, the trail also includes the
 * relevant personalization checks (mileage, claim history, criticality
 * etc.) so the audit reads as actually tailored to the customer's
 * answers — Phase 7b.
 */
export function buildGapEvidence(
  canonical: string,
  parsedPolicy: ParsedPolicy,
  drivingProfile?: DrivingProfile
): GapEvidence | null {
  const ctx = deriveVehicleContext(parsedPolicy, drivingProfile);
  const checks = buildChecksFor(canonical, parsedPolicy, ctx);
  if (!checks) return null;
  // Layer profile-aware checks UNDER the vehicle-derived checks, so
  // the audit reads "we looked at the policy + the car + your
  // profile" in that order.
  const profileChecks = buildProfileChecksFor(canonical, ctx);
  return {
    canonical,
    checks: [...checks, ...profileChecks],
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

/* ─── Phase 7b · Driving-profile-aware checks ──────────────────────────
 *
 * These rows layer onto the per-gap evidence trail when the customer
 * answered the mid-load survey. Each row reads as "we factored in your
 * answer to question X" so the audit feels actually personal, not just
 * statistical. The flag/pass/neutral semantics match the rest of the
 * audit trail:
 *
 *   - flag    → this signal points TOWARD the gap (e.g. claimed twice
 *               + needing NCB Protection)
 *   - pass    → this signal points AWAY from the gap (e.g. very low
 *               mileage on consumables)
 *   - neutral → factored in but doesn't move the needle
 */

/** Map the mid-load answer string to a coarse mileage bucket the
 *  audit logic can reason about. Keeps the option labels as the
 *  source of truth — if marketing tweaks them later, only this
 *  function needs updating. */
function mileageBucket(
  annualKm?: string
): "low" | "average" | "high" | undefined {
  if (!annualKm) return undefined;
  if (annualKm.includes("< 5")) return "low";
  if (annualKm.includes("15k+")) return "high";
  if (annualKm.includes("10–15k") || annualKm.includes("10-15k")) return "high";
  return "average";
}

function claimsBucket(
  pastClaims?: string
): "none" | "once" | "frequent" | undefined {
  if (!pastClaims) return undefined;
  const lower = pastClaims.toLowerCase();
  if (lower.startsWith("no")) return "none";
  if (lower.includes("twice")) return "frequent";
  if (lower.includes("once")) return "once";
  return undefined;
}

function buildProfileChecksFor(
  canonical: string,
  ctx: VehicleContext
): AuditCheck[] {
  const profile = ctx.drivingProfile;
  if (!profile) return [];
  const checks: AuditCheck[] = [];

  const km = mileageBucket(profile.annualKm);
  const claims = claimsBucket(profile.pastClaims);

  // Mileage signal — relevant for every gap that involves claim
  // frequency (most of them). Phrased so the customer sees their own
  // answer reflected back.
  if (km && canonical !== "Key Replacement") {
    if (km === "high") {
      checks.push({
        label: "Your driving profile · annual mileage",
        result: "flag",
        evidence: `${profile.annualKm} per year — claim probability typically ~1.7× the average at this mileage.`,
      });
    } else if (km === "low") {
      checks.push({
        label: "Your driving profile · annual mileage",
        result: canonical === "Roadside Assistance" ? "neutral" : "pass",
        evidence: `${profile.annualKm} per year — claim probability typically 40–60% of average; this gap is less critical for you than for a typical owner.`,
      });
    }
  }

  // Claim history — directly material to NCB Protection, also a
  // general claim-probability signal everywhere else.
  if (claims) {
    if (canonical === "NCB Protection") {
      if (claims === "frequent") {
        checks.push({
          label: "Your driving profile · recent claims",
          result: "flag",
          evidence: `${profile.pastClaims} in the last 3 years — protecting what you rebuild matters more here.`,
        });
      } else if (claims === "once") {
        checks.push({
          label: "Your driving profile · recent claims",
          result: "flag",
          evidence: `${profile.pastClaims} in the last 3 years — your NCB has likely just reset; protection guards the rebuild.`,
        });
      } else if (claims === "none") {
        checks.push({
          label: "Your driving profile · recent claims",
          result: "flag",
          evidence: `No claims in 3 years — your full NCB is intact and worth guarding.`,
        });
      }
    } else if (claims === "frequent") {
      checks.push({
        label: "Your driving profile · recent claims",
        result: "flag",
        evidence: `${profile.pastClaims} in the last 3 years — points to higher claim frequency than average.`,
      });
    }
  }

  // Criticality of THIS car — when it's the only car in the household,
  // mobility loss has higher real impact, so add-ons that protect
  // continued use (Zero Dep, Engine Protect, RTI, RSA) carry more weight.
  if (
    profile.otherCars === "Only this" &&
    ["Zero Depreciation", "Engine Protector", "Return to Invoice", "Roadside Assistance"].includes(
      canonical
    )
  ) {
    checks.push({
      label: "Your driving profile · household reliance",
      result: "flag",
      evidence:
        "Only car in your household — claim-time downtime hits harder than for multi-car families.",
    });
  }

  // Recommendation lens — never changes detection, just reflects
  // the customer's stated priority back so the trail acknowledges it.
  if (profile.priority === "Pay less") {
    checks.push({
      label: "Your driving profile · what matters to you",
      result: "neutral",
      evidence:
        "You said “Pay less” — we still surface this gap because the claim-time cost outweighs the premium delta; the call's yours.",
    });
  } else if (profile.priority === "Worry less") {
    checks.push({
      label: "Your driving profile · what matters to you",
      result: "neutral",
      evidence:
        "You said “Worry less” — this gap is exactly the kind closing earns you peace of mind.",
    });
  }

  return checks;
}
