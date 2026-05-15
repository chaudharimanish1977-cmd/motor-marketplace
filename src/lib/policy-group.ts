import type { ParsedPolicy } from "@/lib/types";

/**
 * Stable key for grouping "the same uploaded document." Two parsed
 * records share a key iff they represent the same physical car, for
 * the same coverage period, AND the same document type.
 *
 * Primary key: (documentType, normalised registration number, odPeriodEnd).
 * Reg-number normalisation strips spaces and hyphens and uppercases
 * everything, so "DL 09 CAU 2020", "dl-09-cau-2020", and "DL09CAU2020"
 * all collapse to the same key.
 *
 * Fallback when the parser couldn't extract a registration number:
 * (documentType, make + model + odPeriodEnd, lowercased). Worse than a
 * real reg number but still meaningfully de-duplicates same-PDF reuploads.
 *
 * Why include documentType: a customer might upload a renewal QUOTE for
 * a period, then later upload the BOUND POLICY for the same period. Both
 * should stay visible as distinct cards (the bound policy lands in the
 * Active section; the quote lands in the Quotes section). If they shared
 * a group key, one would collapse into the other.
 *
 * Renewal cases (new period) produce a NEW key (new odPeriodEnd), so
 * last year's policy and this year's policy stay as separate cards —
 * which is the right product behaviour.
 */
export function policyGroupKey(p: ParsedPolicy): string {
  const docType: "policy" | "quote" = p.documentType ?? "policy";
  const reg = (p.vehicle.registrationNumber ?? "")
    .replace(/[\s-]+/g, "")
    .toUpperCase()
    .trim();
  const expiry = p.odPeriodEnd ?? "";
  if (reg) return `${docType}:reg:${reg}|${expiry}`;
  const make = (p.vehicle.make ?? "").toLowerCase().trim();
  const model = (p.vehicle.model ?? "").toLowerCase().trim();
  return `${docType}:mm:${make}|${model}|${expiry}`;
}
