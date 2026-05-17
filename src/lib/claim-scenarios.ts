/**
 * Concrete claim scenarios per add-on, used by the "Money at risk" simulator
 * on each gap card. Numbers are illustrative ranges based on typical Indian
 * motor claims (sourced from IRDAI industry data + popular garage tariffs).
 */

export interface ClaimScenario {
  scenario: string; // 1-line narrative
  claimSize: number; // total damage value in INR
  withoutAddOn: {
    insurerPays: number;
    youPay: number;
  };
  withAddOn: {
    insurerPays: number;
    youPay: number;
    extraPremiumThisYear?: number; // What the add-on cost
  };
  /**
   * Whether the bill split scales meaningfully with claim size. True
   * for scenarios where the customer can move the simulator slider
   * and see different out-of-pocket numbers (Zero Dep, Engine Protect,
   * Consumables, Key Replacement, LoPB). False for scenarios where
   * the math doesn't bend (RSA: flat per-call; NCB Protection:
   * compounded lost-discount value; RTI: bound to IDV).
   */
  scalesWithClaimSize?: boolean;
  /** Suggested claim sizes (in INR) to expose on the slider as snap
   *  points. Only used when `scalesWithClaimSize` is true. */
  sliderSnapPoints?: number[];
}

/**
 * Rough annual premium of the add-on for this vehicle profile (₹).
 * Used by the inline ClaimSimulator to show the customer "what the
 * cover would cost" alongside the bill-split — turning the gap from
 * an abstract recommendation into a price-tag they can weigh.
 *
 * Numbers are conservative estimates anchored on:
 *   - IDV-percentage rules for zero-dep + RTI
 *   - Flat-rate market averages for the rest (Engine Protect ~1500,
 *     RSA ~300, NCB Protect ~500, Consumables ~800, Key Repl ~500,
 *     LoPB ~250). These match the rough-estimate logic already used
 *     in the report-generator prompt for addOnRecommendations.
 */
export function getAnnualPremiumEstimate(
  addOnName: string,
  idv: number
): number {
  switch (addOnName) {
    case "Zero Depreciation":
      return Math.round((idv * 0.015) / 100) * 100; // ~1.5% of IDV
    case "Engine Protector":
      return 1500;
    case "Return to Invoice":
      return Math.round((idv * 0.01) / 100) * 100; // ~1% of IDV
    case "Roadside Assistance":
      return 300;
    case "NCB Protection":
      return 500;
    case "Consumables":
      return 800;
    case "Key Replacement":
      return 500;
    case "Loss of Personal Belongings":
      return 250;
    default:
      return 0;
  }
}

export function getOutOfPocket(
  addOnName: string,
  idv: number,
  vehicleAge: number
): number {
  const s = getClaimScenario(addOnName, idv, vehicleAge);
  if (!s) return 0;
  return Math.max(0, s.withoutAddOn.youPay - s.withAddOn.youPay);
}

/**
 * Sum up out-of-pocket risk across a list of gap titles. Used to compute the
 * "money at risk" hero stat shown at the top of the report.
 */
export function totalMoneyAtRisk(
  gapTitles: string[],
  idv: number,
  vehicleAge: number
): { total: number; count: number } {
  let total = 0;
  let count = 0;
  for (const title of gapTitles) {
    const canonical = matchCanonicalAddOn(title);
    if (!canonical) continue;
    const cost = getOutOfPocket(canonical, idv, vehicleAge);
    if (cost > 0) {
      total += cost;
      count += 1;
    }
  }
  return { total, count };
}

const DEFAULT_SNAP_POINTS = [10_000, 25_000, 50_000, 75_000, 100_000, 150_000, 200_000];

export function getClaimScenario(
  addOnName: string,
  idv: number,
  vehicleAge: number
): ClaimScenario | null {
  switch (addOnName) {
    case "Zero Depreciation": {
      // Bumper + panel claim — typical depreciation hit on parts at 40-50% for 5-12yr cars
      const claim = 50000;
      const deprecationLossPct = Math.min(0.6, 0.05 * Math.max(1, vehicleAge));
      const youPayWithout = Math.round(claim * deprecationLossPct);
      return {
        scenario:
          "A minor accident damages the bumper, front fender and headlamp. Workshop bill = ₹50,000.",
        claimSize: claim,
        withoutAddOn: {
          insurerPays: claim - youPayWithout,
          youPay: youPayWithout,
        },
        withAddOn: {
          insurerPays: claim - 2000,
          youPay: 2000,
        },
        scalesWithClaimSize: true,
        sliderSnapPoints: DEFAULT_SNAP_POINTS,
      };
    }
    case "Engine Protector": {
      const claim = 60000;
      return {
        scenario:
          "Heavy monsoon flooding causes water ingress and hydrostatic engine lock.",
        claimSize: claim,
        withoutAddOn: {
          insurerPays: 0,
          youPay: claim,
        },
        withAddOn: {
          insurerPays: claim - 2000,
          youPay: 2000,
        },
        scalesWithClaimSize: true,
        sliderSnapPoints: DEFAULT_SNAP_POINTS,
      };
    }
    case "Return to Invoice": {
      const totalLoss = idv;
      const invoiceValue = Math.round(idv * 1.15);
      return {
        scenario:
          "Car is stolen and not recovered. Original invoice was ~15% higher than current IDV.",
        claimSize: invoiceValue,
        withoutAddOn: {
          insurerPays: totalLoss,
          youPay: invoiceValue - totalLoss,
        },
        withAddOn: {
          insurerPays: invoiceValue,
          youPay: 0,
        },
        scalesWithClaimSize: false, // bound to IDV, not a free claim size
      };
    }
    case "Roadside Assistance": {
      const claim = 4000;
      return {
        scenario:
          "Tyre puncture on the highway at 2 AM. Towing + roadside repair = ₹4,000.",
        claimSize: claim,
        withoutAddOn: {
          insurerPays: 0,
          youPay: claim,
        },
        withAddOn: {
          insurerPays: claim,
          youPay: 0,
        },
        scalesWithClaimSize: false, // flat per-call utility
      };
    }
    case "NCB Protection": {
      // NCB worth depends on premium; rough estimate
      const ncbValue = 1800;
      const yearsToRebuild = 5;
      return {
        scenario:
          "A single accident claim (any size) normally wipes your No-Claim Bonus to zero. With NCB Protect, your accumulated discount survives.",
        claimSize: ncbValue * yearsToRebuild,
        withoutAddOn: {
          insurerPays: 0,
          youPay: ncbValue * yearsToRebuild, // Lost NCB compounded
        },
        withAddOn: {
          insurerPays: ncbValue * yearsToRebuild,
          youPay: 0,
        },
        scalesWithClaimSize: false, // compounded lost-discount value
      };
    }
    case "Consumables": {
      const claim = 8000;
      return {
        scenario:
          "Major repair after a collision. Engine oil, coolant, AC gas, nuts, bolts = ₹8,000 in consumables that are normally deducted.",
        claimSize: claim,
        withoutAddOn: {
          insurerPays: 0,
          youPay: claim,
        },
        withAddOn: {
          insurerPays: claim,
          youPay: 0,
        },
        scalesWithClaimSize: true,
        sliderSnapPoints: [2_000, 5_000, 8_000, 12_000, 18_000, 25_000],
      };
    }
    case "Key Replacement": {
      const claim = 18000;
      return {
        scenario:
          "Lost smart key — modern cars require dealer-programmed replacement.",
        claimSize: claim,
        withoutAddOn: {
          insurerPays: 0,
          youPay: claim,
        },
        withAddOn: {
          insurerPays: claim,
          youPay: 0,
        },
        scalesWithClaimSize: true,
        sliderSnapPoints: [5_000, 10_000, 18_000, 25_000],
      };
    }
    case "Loss of Personal Belongings": {
      const claim = 12000;
      return {
        scenario:
          "Laptop bag and personal items stolen from a parked vehicle after break-in.",
        claimSize: claim,
        withoutAddOn: {
          insurerPays: 0,
          youPay: claim,
        },
        withAddOn: {
          insurerPays: claim,
          youPay: 0,
        },
        scalesWithClaimSize: true,
        sliderSnapPoints: [3_000, 7_000, 12_000, 20_000, 30_000],
      };
    }
    default:
      return null;
  }
}

/**
 * Re-compute the bill split for an arbitrary claim size on a scenario
 * that scales linearly. Used by the inline ClaimSimulator slider so
 * the customer can drag through different claim sizes and watch the
 * out-of-pocket number move in real time.
 *
 * Returns null when the scenario doesn't scale meaningfully (RTI, RSA,
 * NCB Protection) — in those cases the UI should hide the slider and
 * show the baseline scenario only.
 *
 * The scaling rule per add-on:
 *   - Zero Depreciation: youPayWithout = claim × depreciationLossPct;
 *     youPayWith = ₹2k flat (add-on's own deductible).
 *   - Engine Protector / Consumables / Key Replacement / LoPB: the
 *     base policy doesn't cover the claim at all, so without-add-on
 *     out-of-pocket = full claim; with-add-on = ₹2k flat (or zero for
 *     true zero-deductible add-ons; we model the ₹2k as a conservative
 *     compulsory deductible to keep the math honest).
 */
export function rescaleClaimScenario(
  addOnName: string,
  vehicleAge: number,
  newClaimSize: number
): { withoutAddOn: { insurerPays: number; youPay: number }; withAddOn: { insurerPays: number; youPay: number } } | null {
  const claim = Math.max(0, Math.round(newClaimSize));
  switch (addOnName) {
    case "Zero Depreciation": {
      const deprecationLossPct = Math.min(0.6, 0.05 * Math.max(1, vehicleAge));
      const youPayWithout = Math.round(claim * deprecationLossPct);
      const withDeductible = Math.min(2000, claim);
      return {
        withoutAddOn: {
          insurerPays: claim - youPayWithout,
          youPay: youPayWithout,
        },
        withAddOn: {
          insurerPays: Math.max(0, claim - withDeductible),
          youPay: withDeductible,
        },
      };
    }
    case "Engine Protector": {
      const withDeductible = Math.min(2000, claim);
      return {
        withoutAddOn: { insurerPays: 0, youPay: claim },
        withAddOn: {
          insurerPays: Math.max(0, claim - withDeductible),
          youPay: withDeductible,
        },
      };
    }
    case "Consumables":
    case "Key Replacement":
    case "Loss of Personal Belongings": {
      return {
        withoutAddOn: { insurerPays: 0, youPay: claim },
        withAddOn: { insurerPays: claim, youPay: 0 },
      };
    }
    default:
      return null;
  }
}

/**
 * Heuristic: match a gap title (free-text from LLM) to a canonical add-on name.
 * Used to find the right scenario for a gap card.
 */
const CANONICAL = [
  "Zero Depreciation",
  "Engine Protector",
  "Return to Invoice",
  "Roadside Assistance",
  "NCB Protection",
  "Consumables",
  "Key Replacement",
  "Loss of Personal Belongings",
];

export function matchCanonicalAddOn(title: string): string | null {
  const lower = title.toLowerCase();
  for (const c of CANONICAL) {
    if (lower.includes(c.toLowerCase())) return c;
  }
  // Fuzzy matches for LLM variants
  if (lower.includes("zero dep") || lower.includes("depreciation"))
    return "Zero Depreciation";
  if (lower.includes("engine prot") || lower.includes("engine protect"))
    return "Engine Protector";
  if (
    lower.includes("return to invoice") ||
    lower.includes("rti") ||
    lower.includes("invoice cover")
  )
    return "Return to Invoice";
  if (lower.includes("roadside") || lower.includes("rsa"))
    return "Roadside Assistance";
  if (lower.includes("ncb")) return "NCB Protection";
  if (lower.includes("consumable")) return "Consumables";
  if (lower.includes("key")) return "Key Replacement";
  if (lower.includes("personal belong") || lower.includes("belongings"))
    return "Loss of Personal Belongings";
  return null;
}
