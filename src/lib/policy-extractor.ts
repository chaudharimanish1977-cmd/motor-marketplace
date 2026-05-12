/**
 * Policy extractor — turns raw PDF text into a structured ParsedPolicy via Claude.
 *
 * This is the heart of the parser. Prompt is tuned for Indian motor policies
 * (Magma, ICICI Lombard, HDFC Ergo, Bajaj Allianz, Tata AIG, Digit, Reliance, etc.)
 * which all follow IRDAI's standard format with minor variations.
 */

import { randomUUID } from "crypto";
import { callClaude, extractJSON } from "@/lib/anthropic";
import type { ParsedPolicy } from "@/lib/types";

const SYSTEM_PROMPT = `You are an expert in Indian motor insurance policies issued by IRDAI-licensed insurers (ICICI Lombard, HDFC Ergo, Tata AIG, Bajaj Allianz, Magma, Digit, Reliance, SBI General, etc.). Your job is to extract structured data from raw policy text with high precision.

OUTPUT FORMAT:
Return ONLY a single valid JSON object matching this exact schema. No prose, no markdown fences, no commentary before or after.

{
  "policyNumber": string,
  "insurerName": string,
  "policyType": "Comprehensive Package" | "Third Party Only" | "Bundle (1yr OD + 3yr TP)" | "Standalone OD" | "Other",
  "odPeriodStart": "YYYY-MM-DD",
  "odPeriodEnd": "YYYY-MM-DD",
  "tpPeriodStart": "YYYY-MM-DD",
  "tpPeriodEnd": "YYYY-MM-DD",
  "vehicle": {
    "make": string,
    "model": string,
    "variant": string,
    "yearOfManufacture": number,
    "fuelType": "Petrol" | "Diesel" | "CNG" | "LPG" | "Electric" | "Hybrid" | "Bi-Fuel CNG" | "Bi-Fuel LPG",
    "cubicCapacity": number,
    "seatingCapacity": number,
    "registrationNumber": string,
    "rto": string,
    "chassisNumber": string | null,
    "engineNumber": string | null
  },
  "idv": number,
  "ncbPercent": number,
  "addOns": [{ "name": string, "premium": number, "sumInsured": number | null }],
  "premium": {
    "basicOd": number,
    "basicTp": number,
    "totalOd": number,
    "totalTp": number,
    "totalPackage": number,
    "cgst": number,
    "sgst": number,
    "grandTotal": number
  },
  "owner": {
    "name": string,
    "mobile": string,
    "email": string | null,
    "address": string,
    "pincode": string | null,
    "city": string | null,
    "state": string | null,
    "dob": string | null,
    "gender": "M" | "F" | null
  },
  "previousPolicy": null | {
    "policyNumber": string,
    "insurer": string,
    "periodStart": "YYYY-MM-DD",
    "periodEnd": "YYYY-MM-DD",
    "ncbPercent": number
  },
  "parseConfidence": "high" | "medium" | "low",
  "parseNotes": string | null
}

EXTRACTION RULES:
1. Return ONLY the JSON object — no markdown, no code fences, no prose.
2. Use null for missing fields. NEVER fabricate values.
3. Dates: always YYYY-MM-DD. Indian DD/MM/YYYY format → reformat. "16/04/2026" → "2026-04-16".
4. Money: integer INR rupees, no commas, no symbols. "Rs. 1,40,000" → 140000. "₹ 26,565.00" → 26565.
5. NCB: integer 0-65 (% retained from prior year). Valid steps: 0, 20, 25, 35, 45, 50, 55, 65. New cars = 0.
6. Bundle policies (1-yr OD + 3-yr TP): odPeriodEnd is 1 year after start; tpPeriodEnd is 3 years after start.
7. Comprehensive Package: odPeriod and tpPeriod are usually identical.
8. Address: keep as a single string (don't split into lines), preserve the full original.
9. Vehicle make/model/variant: split sensibly. "HYUNDAI VENUE HX5 1.0 TURBO DCT PETROL" → make: "Hyundai", model: "Venue", variant: "HX5 1.0 Turbo DCT Petrol".

ADD-ON NORMALISATION (use these canonical names when matched):
- "Zero Depreciation" (also called Bumper-to-Bumper, Nil Depreciation, Dep Shield)
- "Engine Protector" (also Engine Protect, Engine Cover, Hydrostatic Cover)
- "Return to Invoice" (also RTI, Invoice Cover)
- "Roadside Assistance" (also RSA, Basic RSA, 24x7 Assistance)
- "NCB Protection" (also NCB Protect, NCB Shield)
- "Key Replacement" (also Key & Lock Replacement)
- "Consumables" (also Consumable Cover)
- "Loss of Personal Belongings" (also Personal Belongings Cover)
- "Tyre Protection" (also Tyre Cover, Tyre Protect)
- "Daily Allowance" (also Conveyance Cover)

CONFIDENCE:
- "high" — all critical fields (policy number, insurer, IDV, premium, vehicle make/model/year, RTO, owner name) extracted cleanly.
- "medium" — 1-2 fields had ambiguity (e.g., variant unclear, address contains typos).
- "low" — 3+ critical fields unclear OR document seems malformed/incomplete.

parseNotes: brief explanation of any ambiguity. null if perfectly clean.`;

type ExtractedFields = Omit<ParsedPolicy, "id" | "uploadedAt" | "rawText">;

export async function extractPolicyFromText(
  rawText: string
): Promise<ParsedPolicy> {
  const userMessage = `Extract structured policy data from this Indian motor insurance policy:

<policy_text>
${rawText}
</policy_text>

Return only the JSON object, no prose.`;

  const response = await callClaude({
    system: SYSTEM_PROMPT,
    userMessage,
    maxTokens: 4096,
    temperature: 0.1, // Very deterministic for extraction
  });

  const extracted = extractJSON<ExtractedFields>(response);

  return {
    id: randomUUID(),
    uploadedAt: new Date().toISOString(),
    rawText,
    ...extracted,
  };
}
