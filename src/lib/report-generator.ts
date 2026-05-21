/**
 * Report generator — turns a ParsedPolicy into a personalised PolicyReport via Claude.
 *
 * Generates all 7 customer-facing sections + §5.5 Pricing & Savings + §6 Ideal Insurer
 * Profile (which is HIDDEN from the customer-facing report, used only for backend
 * insurer matching) + a per-add-on relevance recommendation list that drives the
 * bundle builder defaults and the tiered bid composition.
 */

import { randomUUID } from "crypto";
import { callClaude, extractJSON } from "@/lib/anthropic";
import type {
  AddOnRecommendation,
  CoverageSnapshotRow,
  FeatureInsight,
  ParsedPolicy,
  PolicyReport,
  ThingsToAskItem,
} from "@/lib/types";
import { formatINR } from "@/lib/format";

const SYSTEM_PROMPT = `You are an expert motor insurance advisor for Indian private car owners. Generate a personalised, vehicle-specific policy review based on a parsed policy.

OUTPUT FORMAT:
Return ONLY a single valid JSON object matching this exact schema. No prose, no markdown fences.

{
  "atAGlance": {
    "policyPeriodLabel": string (e.g. "31 Mar 2026 – 30 Mar 2027"),
    "vehicleLabel": string (e.g. "Maruti Wagon R LXI 1.0 CNG (2014)"),
    "idv": number,
    "ncbPercent": number,
    "policyTypeLabel": string
  },
  "whatCoversWell": {
    "items": [{ "title": string, "description": string, "iconHint": string }]
  },
  "keyGaps": {
    "items": [{ "title": string, "description": string, "iconHint": string }]
  },
  "idvCheck": {
    "currentIdv": number,
    "assessment": "appropriate" | "low" | "high",
    "whatToDo": [string],
    "tip": string
  },
  "renewalTips": {
    "items": [{ "title": string, "description": string, "iconHint": string }]
  },
  "pricingSnapshot": {
    "currentPremium": number,
    "recommendedRangeMin": number,
    "recommendedRangeMax": number,
    "hasPremiumSavings": boolean,
    "estimatedSavings": number | null,
    "narrative": string,
    "claimTimeExample": string
  },
  "idealInsurerProfile": {
    "recommendedInsurers": [{ "name": string, "reasoning": string }],
    "selectionCriteria": [string]
  },
  "keyTakeaway": {
    "headline": string,
    "body": string,
    "cta": string
  },
  "addOnRecommendations": [
    {
      "name": string,
      "isInCurrentPolicy": boolean,
      "recommendation": "essential" | "optional" | "drop",
      "reasoning": string (one sentence, vehicle/profile-specific),
      "estimatedAnnualPremium": number (rough INR estimate)
    }
  ],
  "bottomLine": {
    "verdict": string (one sentence — the read on the situation),
    "action": string (one sentence — what the customer should DO next; visually highlighted in the rendered banner)
  }
}

GLOBAL GUIDELINES:
- Tone: Friendly expert advisor. NOT salesy. Like a knowledgeable family friend.
- Tailor everything to THIS vehicle's age, fuel type, location/RTO, IDV, NCB%.
- Each description 1-2 sentences max. Be tight.
- Use ₹ with Indian numbering: "₹1,40,000" not "₹140,000".
- Reference specifics from the parsed policy ("12-year-old Wagon R CNG", "50% NCB", "Kalyan RTO").

SECTION-SPECIFIC GUIDANCE:

§atAGlance — Restate key facts cleanly. policyPeriodLabel uses "DD Mon YYYY" format.

§whatCoversWell — 3-6 items. Highlight ACTUAL strengths only, never fabricate. Common patterns:
  • Comprehensive cover (if Comprehensive Package): "Comprehensive Cover", "Own Damage + Third Party Liability included"
  • High NCB: "X% No Claim Bonus", "Maximum/strong discount retained"
  • CNG/LPG declared: "CNG Properly Declared", "Covered under OD & TP"
  • PA owner driver: "Personal Accident Cover"
  • Add-ons present
  • No voluntary deductible (good for older cars)
  iconHint values to use: "shield", "check", "badge", "cng", "pa", "deductible", "addon"

§keyGaps — 3-7 items. ONLY flag missing coverage that is RELEVANT for this customer's profile. Do not flag missing add-ons that wouldn't materially help this customer (e.g., don't flag missing "Tyre Protection" for a hatchback in low-claim profile; don't flag missing "Loss of Personal Belongings" for a basic vehicle owner who doesn't carry valuables). Vehicle-specific reasoning is mandatory.
  • Vehicle age > 5 years: "Zero Depreciation Cover Not Available" (depreciation reduces payouts on older cars), "Consumables Cover" (oil/nuts/bolts deducted from claims), "Engine Protect" (especially for CNG)
  • CNG vehicles: Engine Protector is critical (water ingress, hydrostatic lock)
  • NCB > 25%: "NCB Protection" (one claim wipes out hard-earned NCB)
  • Always consider: "Roadside Assistance", "Key Replacement Cover"
  iconHint values: "engine", "consumables", "rsa", "ncb", "key", "zerodep", "rti", "personal-belongings"

§idvCheck — assess based on vehicle age vs IDV vs typical market value:
  • For 12-year-old Wagon R, IDV of ₹1,40,000 is roughly appropriate
  • whatToDo: 2-3 actionables. e.g., "Ensure IDV reflects current market/resale value", "A slightly higher IDV today protects you better in a total loss"
  • tip: one sentence. e.g., "Compare with resale value on platforms like Cars24, Spinny, or dealer quotes."

§renewalTips — 4-6 location-aware tips. Use the city/RTO from policy.
  • Garage network: "Check Garage Network — Ensure strong presence in [city] and surrounding areas like [neighbouring areas]"
  • "Service Quality Over Price"
  • "Preserve Your X% NCB — Avoid small claims (< ₹8K-₹12K). Self-pay minor repairs."
  • "Don't Over-Insure — Buy only practical add-ons"
  • "Use Insurance Wisely — for major accidents, theft, flood, large repairs"
  iconHint values: "garage", "service", "ncb", "wisely", "deductible", "shield-check"

§pricingSnapshot — THIS IS THE NEW SECTION (§5.5):
  • currentPremium: from input policy's grandTotal
  • recommendedRangeMin/Max: estimate for an OPTIMAL policy with RELEVANT add-ons (NOT all possible add-ons — only those tagged "essential" or "optional" in addOnRecommendations). Recommended range should typically stay within 1.0x-1.5x of current premium for older bare-bones policies. NEVER quote a range > 3x current premium — that's commercially absurd and damages credibility.
  • hasPremiumSavings: true if recommended midpoint < currentPremium
  • estimatedSavings: difference rounded to nearest ₹500 if savings, else null
  • narrative: 2-3 sentences.
    - If savings exist: emphasise the saving + better value
    - If recommended is HIGHER (because of needed add-ons): position as "right cover at right price" — emphasise that the small premium increase prevents large claim-time loss
  • claimTimeExample: ONE concrete scenario specific to this vehicle. Examples:
    - "If your engine is damaged due to flooding (common during Mumbai monsoons), Engine Protect could save you ₹40,000-₹80,000 in repair costs — recovering years of premium difference in a single claim."

§idealInsurerProfile — HIDDEN FROM CUSTOMER but generated for backend matching:
  • recommendedInsurers: 4-5 real Indian general insurers ranked by fit. Use real names: ICICI Lombard, HDFC Ergo, Tata AIG, Bajaj Allianz, Digit Insurance, Reliance General, SBI General, Future Generali, Iffco Tokio, Go Digit
  • selectionCriteria: typically ["Strong garage network", "Efficient claim settlement", "Stable pricing & customer focus", "Good local support in your area"]

§keyTakeaway:
  • headline: punchy one-liner specific to this customer (e.g., "Your 12-year-old Wagon R CNG needs smart, not just more, coverage.")
  • body: 2-3 sentences synthesising the report
  • cta: "Get the Best Curated Offer" or "See Your Personalised Quotes"

§addOnRecommendations — CRITICAL FOR BUNDLE BUILDER + TIERED BIDDING:
  Evaluate EACH of these canonical add-ons for THIS customer and tag with a relevance level:
    1. Zero Depreciation
    2. Engine Protector
    3. Return to Invoice
    4. Roadside Assistance
    5. NCB Protection
    6. Consumables
    7. Key Replacement
    8. Loss of Personal Belongings

  For each add-on, output:
    - name: canonical name from list above
    - isInCurrentPolicy: true if it appears in parsed_policy.addOns
    - recommendation:
        "essential" = strongly recommended for THIS customer profile; should be in all tiers
        "optional" = nice to have but not critical; include in Tier 3 (Super Cover) only
        "drop" = present in current policy but not relevant for this customer (would save money to drop); pre-uncheck in bundle builder with savings hint
    - reasoning: 1 vehicle/profile-specific sentence (e.g., "Critical for CNG vehicles in monsoon-prone Kalyan area")
    - estimatedAnnualPremium: rough INR estimate (Zero Dep ~1.5% of IDV; Engine Protect ~₹1,200-2,500; RTI ~1% of IDV; RSA ~₹200; NCB Protect ~₹500; Consumables ~₹800; Key Replacement ~₹500; LoPB ~₹250)

  RELEVANCE HEURISTICS:
  • Zero Depreciation: "essential" for vehicles ≤ 5 years; "optional" for 6-10 years; "drop" for 11+ years (limited benefit, high cost)
  • Engine Protector: "essential" for CNG/LPG vehicles or vehicles in flood-prone RTOs (Mumbai, Kalyan, Chennai); "optional" otherwise
  • Return to Invoice: "essential" for vehicles ≤ 3 years (covers depreciation gap); "optional" for 4-7 years; "drop" for 8+ years (invoice value vs IDV gap is small)
  • Roadside Assistance: "essential" for all vehicles (low cost, universal utility)
  • NCB Protection: "essential" if NCB ≥ 35%; "optional" if 20-25%; "drop" if 0-15% (low NCB to protect)
  • Consumables: "essential" for vehicles 5+ years (more wear-and-tear claims); "optional" for newer
  • Key Replacement: "optional" for vehicles with smart keys (newer high-end models); "drop" for basic mechanical-key vehicles
  • Loss of Personal Belongings: "optional" for premium vehicles where owners carry valuables; "drop" for basic/family vehicles
  • If isInCurrentPolicy=true but recommendation="drop": explicitly mention the savings opportunity in reasoning.

§bottomLine — THE EXECUTIVE SUMMARY (top of the new report layout):
  STRUCTURE — two sentences, split across two fields:
    "verdict": one sentence stating the read on the customer's situation.
               NO action verb; just the diagnosis.
               Examples: "Solid policy with one meaningful gap."
                         "Cover is thin for an 8-year-old CNG."
                         "Your renewal pricing is fair and the cover is balanced."
    "action":  one sentence stating the SPECIFIC next step. Imperative
               voice. The customer can act on this immediately.
               Examples: "Add Engine Protector for ₹800/yr to close a ₹2L exposure."
                         "Add NCB Protection + Zero Dep — together they cost ₹1,200/yr."
                         "Skip Loss of Personal Belongings; keep everything else as-is."

  RULES (apply to both fields):
  • Tight. No greetings, no "Hi", no "—Aryan" signoff.
  • DO NOT mention insurer-switching as an action (we don't do that yet).
  • DO NOT use vague phrases like "consider reviewing" — be decisive.
  • Customer reads verdict + action in 5 seconds and knows what to do.`;

type ReportSections = Omit<
  PolicyReport,
  "id" | "parsedPolicyId" | "generatedAt"
>;

export async function generateReport(
  parsedPolicy: ParsedPolicy
): Promise<PolicyReport> {
  // Strip rawText to keep prompt size reasonable
  const policyForPrompt = { ...parsedPolicy };
  delete (policyForPrompt as Partial<ParsedPolicy>).rawText;

  const userMessage = `Generate a personalised motor insurance policy review report for this customer:

<parsed_policy>
${JSON.stringify(policyForPrompt, null, 2)}
</parsed_policy>

Today's date is ${new Date().toISOString().slice(0, 10)} for context on policy expiry timing.

Return only the JSON report object, no prose.`;

  const response = await callClaude({
    system: SYSTEM_PROMPT,
    userMessage,
    maxTokens: 6144, // Larger because addOnRecommendations adds 8 items
    temperature: 0.4,
  });

  const sections = extractJSON<ReportSections>(response);

  // Phase 1 unified-template fields. Derived from the LLM output + the
  // parsed policy. Two of these (bottomLine) come straight from the
  // primary LLM call; coverageSnapshot + featureInsights are
  // deterministically derived from the structured fields (no extra
  // LLM cost); thingsToAsk fires a separate LLM call only for
  // quote-type documents (where negotiation makes sense).
  const coverageSnapshot = deriveCoverageSnapshot(
    parsedPolicy,
    sections
  );
  const featureInsights = deriveFeatureInsights(parsedPolicy, sections);

  let thingsToAsk: ThingsToAskItem[] = [];
  if ((parsedPolicy.documentType ?? "policy") === "quote") {
    try {
      thingsToAsk = await generateThingsToAsk(parsedPolicy, sections);
    } catch (err) {
      console.error(
        "[report-generator] thingsToAsk generation failed (non-fatal):",
        err
      );
    }
  }

  return {
    id: randomUUID(),
    parsedPolicyId: parsedPolicy.id,
    generatedAt: new Date().toISOString(),
    ...sections,
    coverageSnapshot,
    featureInsights,
    thingsToAsk,
  };
}

// ---------------------------------------------------------------------------
// Coverage Snapshot derivation — deterministic, no LLM
// ---------------------------------------------------------------------------

/** Canonical add-on list, kept in sync with §addOnRecommendations above.
 *  This is the order in which rows render in the Coverage Snapshot table. */
const CANONICAL_ADDONS = [
  "Zero Depreciation",
  "Engine Protector",
  "Return to Invoice",
  "Roadside Assistance",
  "NCB Protection",
  "Consumables",
  "Key Replacement",
  "Loss of Personal Belongings",
] as const;

/**
 * Build the structured table rows from the parsed policy + LLM-generated
 * report sections. No LLM cost — pure derivation.
 *
 * Row order:
 *   1. Anchor rows (always 3): IDV, NCB, Policy type
 *   2. Add-on rows (always 8): each canonical add-on with ✓ / ✗
 *
 * Status colour-coding logic per add-on:
 *   essential + present     → "good"     (covered what's recommended)
 *   essential + absent      → "missing"  (red — biggest exposure)
 *   optional + absent       → "warn"     (amber — consider adding)
 *   optional + present      → "good"     (still good — they have it)
 *   drop + present          → "warn"     (paying for unneeded cover)
 *   drop + absent           → "neutral"  (correctly not paying for it)
 */
function deriveCoverageSnapshot(
  parsedPolicy: ParsedPolicy,
  sections: ReportSections
): CoverageSnapshotRow[] {
  const rows: CoverageSnapshotRow[] = [];
  const isQuote = (parsedPolicy.documentType ?? "policy") === "quote";

  // ---- Anchor rows ----
  // IDV — use the LLM's assessment to colour-code
  const idvAssessment = sections.idvCheck?.assessment ?? "appropriate";
  const idvStatus: CoverageSnapshotRow["status"] =
    idvAssessment === "appropriate"
      ? "good"
      : idvAssessment === "low"
        ? "missing"
        : "warn";
  rows.push({
    feature: "Insured Declared Value (IDV)",
    category: "anchor",
    value: formatINR(parsedPolicy.idv),
    status: idvStatus,
    whatThisMeans:
      sections.idvCheck?.tip ?? "Drives what an insurer pays on a total loss.",
  });

  // NCB
  rows.push({
    feature: "No-Claim Bonus (NCB)",
    category: "anchor",
    value: `${parsedPolicy.ncbPercent}%`,
    status: parsedPolicy.ncbPercent >= 35 ? "good" : "neutral",
    whatThisMeans:
      parsedPolicy.ncbPercent >= 35
        ? "Hard-earned discount. Worth protecting with NCB Protection."
        : "Standard discount level for your renewal cycle.",
  });

  // Policy type
  rows.push({
    feature: "Policy type",
    category: "anchor",
    value: parsedPolicy.policyType,
    status:
      parsedPolicy.policyType === "Comprehensive Package" ? "good" : "warn",
    whatThisMeans:
      parsedPolicy.policyType === "Comprehensive Package"
        ? "Own-damage + third-party — what most owners need."
        : "Limited cover. Comprehensive is usually the right level.",
  });

  // ---- Add-on rows ----
  // Build a lookup of add-on recommendations from the LLM.
  const recsByName = new Map<string, AddOnRecommendation>();
  for (const r of sections.addOnRecommendations ?? []) {
    recsByName.set(r.name, r);
  }
  // Also detect what's actually in the parsed policy (regardless of LLM's view).
  const presentAddons = new Set(
    (parsedPolicy.addOns ?? []).map((a) => normalizeAddOnName(a.name))
  );

  for (const canonical of CANONICAL_ADDONS) {
    const rec = recsByName.get(canonical);
    const isPresent =
      rec?.isInCurrentPolicy ?? presentAddons.has(canonical.toLowerCase());
    const recommendation = rec?.recommendation ?? "optional";

    let status: CoverageSnapshotRow["status"] = "neutral";
    if (recommendation === "essential" && isPresent) status = "good";
    else if (recommendation === "essential" && !isPresent) status = "missing";
    else if (recommendation === "optional" && isPresent) status = "good";
    else if (recommendation === "optional" && !isPresent) status = "warn";
    else if (recommendation === "drop" && isPresent) status = "warn";
    else if (recommendation === "drop" && !isPresent) status = "neutral";

    // "What this means" copy. For a quote, frame as "should you accept this".
    // For a policy, frame as "what to do about it".
    const reasoning = rec?.reasoning ?? "";
    const whatThisMeans = isPresent
      ? recommendation === "drop"
        ? `Paying for cover you don't strictly need. ${reasoning}`
        : reasoning ||
          (isQuote ? "Included in this quote." : "Already in your policy.")
      : recommendation === "essential"
        ? `Missing. ${reasoning || "Worth adding."}`
        : recommendation === "optional"
          ? `Not included. ${reasoning || "Consider whether you need it."}`
          : `Not included. Not strictly needed for your profile.`;

    // Map the LLM's add-on recommendation onto the customer-facing
    // recommendation column.
    //   essential → must-have    (red attention; missing matters)
    //   optional  → good-to-have (amber consider)
    //   drop      → may-have     (slate / can skip)
    const recommendationLabel: CoverageSnapshotRow["recommendation"] =
      recommendation === "essential"
        ? "must-have"
        : recommendation === "drop"
          ? "may-have"
          : "good-to-have";

    rows.push({
      feature: canonical,
      category: "addon",
      value: isPresent ? "✓" : "✗",
      status,
      whatThisMeans,
      recommendation: recommendationLabel,
    });
  }

  return rows;
}

/** Loose match for "Zero Dep" / "Zero Depreciation Cover" / "0-Dep". */
function normalizeAddOnName(raw: string): string {
  return (raw ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/^zero?dep.*/, "zero depreciation")
    .replace(/^engineprotect.*/, "engine protector")
    .replace(/^returntoinvoice.*/, "return to invoice")
    .replace(/^rti$/, "return to invoice")
    .replace(/^roadsideassist.*/, "roadside assistance")
    .replace(/^rsa$/, "roadside assistance")
    .replace(/^ncb(?!protect).*/, "ncb protection")
    .replace(/^consumable.*/, "consumables")
    .replace(/^keyreplace.*/, "key replacement")
    .replace(/^lossofpersonalbelong.*/, "loss of personal belongings");
}

// ---------------------------------------------------------------------------
// Feature Insights derivation — anchored to table rows
// ---------------------------------------------------------------------------

/**
 * Derive per-feature insights from existing LLM output. Each insight maps to
 * a row in the Coverage Snapshot table (by `feature` string match), giving
 * the customer a clear "this row → this paragraph" connection.
 *
 * Sources:
 *   - idvCheck → IDV insight
 *   - addOnRecommendations[*].reasoning → per-add-on insight
 *   - whatCoversWell + keyGaps → optional supplements when they reference
 *     a specific add-on name
 */
function deriveFeatureInsights(
  parsedPolicy: ParsedPolicy,
  sections: ReportSections
): FeatureInsight[] {
  const insights: FeatureInsight[] = [];

  // IDV insight (from idvCheck section)
  if (sections.idvCheck) {
    const idv = sections.idvCheck;
    const idvBody =
      idv.whatToDo && idv.whatToDo.length > 0
        ? `${idv.tip ?? ""} ${idv.whatToDo.join(" ")}`.trim()
        : idv.tip ?? "";
    if (idvBody) {
      insights.push({
        feature: "Insured Declared Value (IDV)",
        body: idvBody,
      });
    }
  }

  // Add-on insights (one per canonical add-on with a non-empty reasoning)
  const recsByName = new Map<string, AddOnRecommendation>();
  for (const r of sections.addOnRecommendations ?? []) {
    recsByName.set(r.name, r);
  }
  for (const canonical of CANONICAL_ADDONS) {
    const rec = recsByName.get(canonical);
    if (!rec || !rec.reasoning) continue;
    // Skip rows where the reasoning is too generic / no-signal.
    if (rec.reasoning.length < 20) continue;
    insights.push({
      feature: canonical,
      body: rec.reasoning,
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Things to Ask — LLM call (quotes only)
// ---------------------------------------------------------------------------

const THINGS_TO_ASK_PROMPT = `You are an expert motor insurance advisor for Indian private car owners. The customer has received a RENEWAL QUOTE from an insurer and is deciding whether to accept it. Generate 3-5 specific, customer-friendly questions they should ask the insurer (or their agent) before binding the quote.

OUTPUT FORMAT:
Return ONLY a single valid JSON array. No prose, no markdown fences.

[
  {
    "insurer": string (the insurer name from the quote),
    "ask": string (a short, direct question or request — 1 sentence — that the customer can copy-paste into a chat / email / phone call),
    "reasoning": string (1 short sentence the customer can use as context if pressed)
  }
]

GUIDELINES:
- Questions must be CUSTOMER-FRIENDLY language — no jargon. The customer sends these to a sales agent.
- Be specific. Reference exact add-on names, exact rupee amounts, exact policy terms.
- Lead with what's MISSING from this quote vs. what's recommended (from the addOnRecommendations).
- Include 1 question about something IDV-related if IDV is low or high.
- If the customer's CURRENT policy had something the quote drops, ask about it explicitly.
- Avoid passive-aggressive or pushy phrasing. The customer is paying; they're asking for fair terms.
- Use ₹ with Indian numbering: "₹1,400/yr" not "₹1,400 per year".

QUESTION SHAPES (calibrate tone + brevity):
- "Can you add Engine Protector? My current cover has it and our area sees flooding in monsoon."
- "What's the engine sub-limit on this policy if water enters the engine? I want to know before I bind."
- "The IDV is ₹X — can you adjust to ₹Y? Resale data for my model+year supports a higher value."
- "Can you match the Zero Depreciation that's in my current Tata AIG cover? ~₹1,500/yr."

Be tight. The customer will paste these directly.`;

// ---------------------------------------------------------------------------
// Cross-doc bottom line — LLM call, used by /reports multi-doc comparator
// ---------------------------------------------------------------------------

const CROSS_DOC_BOTTOM_LINE_PROMPT = `You are an expert motor insurance advisor for Indian private car owners. The customer has forwarded multiple documents — some combination of an old policy, a renewal quote, and a new policy. Write a structured executive summary.

OUTPUT FORMAT:
Return ONLY a single JSON object:
  {
    "bottomLine": {
      "verdict": "...",
      "action": "..."
    }
  }
No prose, no markdown, no surrounding text.

verdict — one sentence stating the situation:
  - Names the BEST option among what they forwarded (e.g. "Your new HDFC policy is the strongest of the three")
  - States the overall read (e.g. "but it's missing two add-ons your previous cover had")
  - Diagnostic only — no action verbs here

action — one sentence stating what to do RIGHT NOW:
  - Imperative voice ("Add", "Take", "Ask", "Switch")
  - Specific (name the add-on, the amount, or the insurer)
  - Actionable within the week

GUIDELINES:
  - Be DECISIVE. No "consider reviewing" or "you may want to". Take a stance.
  - Refer to docs by short labels like "your Acko renewal" or "your Tata AIG policy", not by date.
  - Don't restate the data — synthesise the verdict.

EXAMPLES (calibrate tone + length):
  verdict: "Acko's renewal is a clear upgrade — the cheapest option that covers everything we recommend."
  action: "Take the Acko renewal, but ask them to match the Engine Protector your old Tata AIG cover had."

  verdict: "Your new HDFC policy is the strongest pick, though missing NCB Protection."
  action: "Add NCB Protection (~₹500/yr) before binding — losing your 35% NCB on a single claim would cost ₹4,000+."`;

export interface CrossDocBottomLineInput {
  docs: Array<{
    /** "Tata AIG Policy", "Acko Quote", "Acko Policy" */
    label: string;
    /** "Apr '23 — Mar '24" */
    period: string;
    documentType: "policy" | "quote";
    insurer: string;
    idv: number;
    ncbPercent: number;
    grandTotalPremium: number;
    addOnsPresent: string[];
    keyGaps?: string[];
    perDocBottomLine?: string;
  }>;
}

export interface CrossDocBottomLineOutput {
  verdict: string;
  action?: string;
}

/**
 * Generate the cross-doc bottom line for the multi-doc /reports view.
 * Called when 2+ docs are forwarded; the output replaces the per-doc
 * bottomLine at the top of the master report.
 *
 * Returns a structured { verdict, action } pair so the renderer can
 * visually emphasise the action callout. Returns null on failure.
 */
export async function generateCrossDocBottomLine(
  input: CrossDocBottomLineInput
): Promise<CrossDocBottomLineOutput | null> {
  const userMessage = `Generate the cross-doc bottom-line verdict for this customer's documents:

<docs>
${JSON.stringify(input.docs, null, 2)}
</docs>

Return only the JSON object, no prose.`;

  try {
    const response = await callClaude({
      system: CROSS_DOC_BOTTOM_LINE_PROMPT,
      userMessage,
      maxTokens: 600,
      temperature: 0.3,
    });
    const parsed = extractJSON<{
      bottomLine?: { verdict?: string; action?: string } | string;
    }>(response);
    const bl = parsed?.bottomLine;
    if (!bl) return null;
    // Tolerate the LLM returning a plain string (older prompt shape).
    if (typeof bl === "string") {
      const v = bl.trim();
      return v ? { verdict: v } : null;
    }
    const verdict = bl.verdict?.trim() ?? "";
    const action = bl.action?.trim();
    if (!verdict && !action) return null;
    return { verdict: verdict || "", action: action || undefined };
  } catch (err) {
    console.error(
      "[report-generator] cross-doc bottom line generation failed:",
      err
    );
    return null;
  }
}

async function generateThingsToAsk(
  parsedPolicy: ParsedPolicy,
  sections: ReportSections
): Promise<ThingsToAskItem[]> {
  const policyForPrompt = { ...parsedPolicy };
  delete (policyForPrompt as Partial<ParsedPolicy>).rawText;

  // Send just enough context for the model to write useful questions.
  // We deliberately omit the full editorial sections — they'd inflate the
  // prompt without changing the structural output.
  const contextForPrompt = {
    insurer: parsedPolicy.insurerName,
    vehicle: parsedPolicy.vehicle,
    idv: parsedPolicy.idv,
    ncbPercent: parsedPolicy.ncbPercent,
    addOnsInQuote: (parsedPolicy.addOns ?? []).map((a) => a.name),
    premium: parsedPolicy.premium,
    previousPolicy: parsedPolicy.previousPolicy,
    keyGaps: sections.keyGaps,
    idvCheck: sections.idvCheck,
    addOnRecommendations: sections.addOnRecommendations,
  };

  const userMessage = `Generate "things to ask" questions for this RENEWAL QUOTE:

<context>
${JSON.stringify(contextForPrompt, null, 2)}
</context>

Today's date is ${new Date().toISOString().slice(0, 10)}.

Return only the JSON array, no prose.`;

  const response = await callClaude({
    system: THINGS_TO_ASK_PROMPT,
    userMessage,
    maxTokens: 1500,
    temperature: 0.3,
  });

  const items = extractJSON<ThingsToAskItem[]>(response);

  // Guard against the LLM returning the wrong shape — drop invalid rows.
  return (Array.isArray(items) ? items : [])
    .filter(
      (item): item is ThingsToAskItem =>
        !!item &&
        typeof item.insurer === "string" &&
        typeof item.ask === "string" &&
        item.ask.length > 0
    )
    .slice(0, 5);
}
