import type { ParsedPolicy } from "@/lib/types";

/**
 * Stable key for grouping "the same insurance contract." Two parsed
 * policies share a key iff they represent the same physical car for
 * the same coverage period — i.e. the customer uploaded the same PDF
 * twice, or refined the same policy across reads.
 *
 * Primary key: (normalised registration number, odPeriodEnd).
 * Reg-number normalisation strips spaces and hyphens and uppercases
 * everything, so "DL 09 CAU 2020", "dl-09-cau-2020", and "DL09CAU2020"
 * all collapse to the same key.
 *
 * Fallback when the parser couldn't extract a registration number:
 * (make + model + odPeriodEnd, lowercased). Worse than a real reg
 * number but still meaningfully de-duplicates same-PDF reuploads.
 *
 * Renewal cases produce a NEW key (new odPeriodEnd), so last year's
 * policy and this year's policy stay as separate cards — which is
 * the right product behaviour.
 */
export function policyGroupKey(p: ParsedPolicy): string {
  const reg = (p.vehicle.registrationNumber ?? "")
    .replace(/[\s-]+/g, "")
    .toUpperCase()
    .trim();
  const expiry = p.odPeriodEnd ?? "";
  if (reg) return `reg:${reg}|${expiry}`;
  const make = (p.vehicle.make ?? "").toLowerCase().trim();
  const model = (p.vehicle.model ?? "").toLowerCase().trim();
  return `mm:${make}|${model}|${expiry}`;
}
