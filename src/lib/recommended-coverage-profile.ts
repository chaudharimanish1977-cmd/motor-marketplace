/**
 * Recommended Coverage Profile (RCP) — the first-class object that
 * captures "what we believe THIS customer's policy should look like."
 *
 * RCP is the benchmark every comparator / verdict / auction is scored
 * against. The Right Offer rule lives here:
 *
 *   We pitch when:
 *     - We beat customer's best quote on price at RCP-complete coverage
 *     - We beat customer's best quote on feature load at same price
 *     - Customer's best quote is missing any RCP item (under-covered)
 *     - Customer's best quote has non-RCP items (over-covered)
 *
 *   We say "take your quote" only when:
 *     - Customer's best quote is exactly RCP-complete (no missing, no
 *       padding) AND priced competitively
 *
 * Derived (not LLM-generated) — the report-generator already emits
 * per-add-on relevance ("essential" / "optional" / "drop") for each
 * customer's profile. RCP is a clean, structured projection of that
 * + IDV guidance + over-coverage flags. Same source of truth, no
 * extra LLM cost, no migration of existing reports.
 */

import type { ParsedPolicy, PolicyReport } from "@/lib/types";

export interface RcpAddOn {
  /** Canonical add-on name (matches catalogue). */
  name: string;
  /** Customer-facing "why this matters for your car" sentence. */
  why: string;
  /** Rough annual premium estimate (INR). */
  estimatedAnnualPremium: number;
}

export interface RcpOverCoverageFlag {
  name: string;
  why: string;
}

export interface RecommendedCoverageProfile {
  /** Add-ons we believe THIS customer must have. RCP-complete = has all of these. */
  requiredAddOns: RcpAddOn[];
  /** Nice-to-have add-ons — show in the "comfort tier" / over-cover section. */
  optionalAddOns: RcpAddOn[];
  /** Add-ons currently in the policy/quote that we DON'T recommend for this profile. */
  unnecessaryAddOns: RcpOverCoverageFlag[];
  /** IDV guidance. */
  idv: {
    current: number;
    assessment: "appropriate" | "low" | "high";
    note: string;
  };
  /** Sum of premiums for required add-ons (rough). For "lean Right Offer" pricing display. */
  requiredAddOnsPremiumTotal: number;
}

/**
 * Build the RCP from a ParsedPolicy + its generated PolicyReport.
 * Pure transform — no side effects, idempotent, safe to call on
 * every render.
 */
export function computeRCP(
  parsedPolicy: ParsedPolicy,
  report: PolicyReport
): RecommendedCoverageProfile {
  const required: RcpAddOn[] = [];
  const optional: RcpAddOn[] = [];
  const unnecessary: RcpOverCoverageFlag[] = [];

  for (const rec of report.addOnRecommendations ?? []) {
    if (rec.recommendation === "essential") {
      required.push({
        name: rec.name,
        why: rec.reasoning,
        estimatedAnnualPremium: rec.estimatedAnnualPremium,
      });
    } else if (rec.recommendation === "optional") {
      optional.push({
        name: rec.name,
        why: rec.reasoning,
        estimatedAnnualPremium: rec.estimatedAnnualPremium,
      });
    } else if (rec.recommendation === "drop" && rec.isInCurrentPolicy) {
      // Only flag as unnecessary if the customer actually has it today
      // — otherwise it's irrelevant to surface ("you don't have X, and
      // you wouldn't have needed it anyway" is noise).
      unnecessary.push({
        name: rec.name,
        why: rec.reasoning,
      });
    }
  }

  const requiredAddOnsPremiumTotal = required.reduce(
    (sum, a) => sum + (a.estimatedAnnualPremium ?? 0),
    0
  );

  return {
    requiredAddOns: required,
    optionalAddOns: optional,
    unnecessaryAddOns: unnecessary,
    idv: {
      current: report.idvCheck.currentIdv ?? parsedPolicy.idv,
      assessment: report.idvCheck.assessment,
      note: report.idvCheck.tip,
    },
    requiredAddOnsPremiumTotal,
  };
}

/**
 * Score any policy/quote's add-on set against the RCP.
 * Returns missing required items + extra non-RCP items + a verdict
 * boolean ("is this RCP-complete and lean?").
 *
 * Add-on name comparison is case-insensitive + whitespace-tolerant
 * because parsed quote add-on labels vary slightly across insurers
 * ("Engine Protect" vs "Engine Protector" vs "Engine Cover" — we
 * normalise via a small alias map).
 */
const ADDON_ALIASES: Record<string, string> = {
  "engine protect": "engine protector",
  "engine cover": "engine protector",
  "rti": "return to invoice",
  "rsa": "roadside assistance",
  "zero dep": "zero depreciation",
  "zero depreciation cover": "zero depreciation",
  "ncb protect": "ncb protection",
  "key & lock replacement": "key replacement",
};

function normaliseAddOn(name: string): string {
  const lower = name.trim().toLowerCase();
  return ADDON_ALIASES[lower] ?? lower;
}

export interface RcpScoreResult {
  /** RCP items not present in the candidate option. */
  missingRequired: string[];
  /** Add-ons present in the candidate that aren't in the RCP. */
  extraNonRcp: string[];
  /** True iff missingRequired AND extraNonRcp are both empty. */
  isRcpComplete: boolean;
  /** True iff isRcpComplete AND no padding. */
  isExactlyRcp: boolean;
}

export function scoreAgainstRcp(
  candidateAddOns: string[],
  rcp: RecommendedCoverageProfile
): RcpScoreResult {
  const candidate = new Set(candidateAddOns.map(normaliseAddOn));
  const required = new Set(rcp.requiredAddOns.map((a) => normaliseAddOn(a.name)));
  const allRecognised = new Set([
    ...rcp.requiredAddOns.map((a) => normaliseAddOn(a.name)),
    ...rcp.optionalAddOns.map((a) => normaliseAddOn(a.name)),
  ]);

  const missingRequired: string[] = [];
  for (const r of required) {
    if (!candidate.has(r)) {
      const original = rcp.requiredAddOns.find(
        (a) => normaliseAddOn(a.name) === r
      );
      missingRequired.push(original?.name ?? r);
    }
  }

  const extraNonRcp: string[] = [];
  for (const c of candidate) {
    if (!allRecognised.has(c)) {
      // Find the original casing
      const original = candidateAddOns.find(
        (a) => normaliseAddOn(a) === c
      );
      extraNonRcp.push(original ?? c);
    }
  }

  const isRcpComplete = missingRequired.length === 0;
  const isExactlyRcp = isRcpComplete && extraNonRcp.length === 0;

  return { missingRequired, extraNonRcp, isRcpComplete, isExactlyRcp };
}
