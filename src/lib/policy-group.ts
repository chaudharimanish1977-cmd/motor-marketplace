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

/**
 * Stable key for grouping "documents covering the same physical car."
 *
 * Distinct from policyGroupKey: vehicleKey IGNORES period + documentType.
 * The same car's 2023 policy + 2024 quote share a vehicleKey but have
 * different policyGroupKey. Used by the inbound-forward dispatcher to
 * detect when a single forward covers multiple vehicles (so the
 * cross-doc comparator never compares an Audi A6 to a Maruti Swift).
 *
 * Primary key: normalised registration number — same normalisation as
 * policyGroupKey (strip spaces/hyphens, uppercase).
 *
 * Fallback when the parser couldn't extract a registration: lowercase
 * make + model + yearOfManufacture + rto. Stricter than policyGroupKey's
 * fallback because the same household might own two Maruti Swifts of
 * different years — we want different physical cars to NOT collapse.
 */
export function vehicleKey(p: ParsedPolicy): string {
  const reg = (p.vehicle.registrationNumber ?? "")
    .replace(/[\s-]+/g, "")
    .toUpperCase()
    .trim();
  if (reg) return `reg:${reg}`;
  const make = (p.vehicle.make ?? "").toLowerCase().trim();
  const model = (p.vehicle.model ?? "").toLowerCase().trim();
  const year = p.vehicle.yearOfManufacture ?? 0;
  const rto = (p.vehicle.rto ?? "").toLowerCase().trim();
  return `mm:${make}|${model}|${year}|${rto}`;
}

/**
 * Human-readable label for a vehicle — used as section header /
 * tab label in multi-vehicle emails + /reports.
 */
export function vehicleLabel(p: ParsedPolicy): string {
  const make = (p.vehicle.make ?? "").trim();
  const model = (p.vehicle.model ?? "").trim();
  const year = p.vehicle.yearOfManufacture;
  const base = `${make} ${model}`.trim();
  if (!base) return "your car";
  return year ? `${base} (${year})` : base;
}
