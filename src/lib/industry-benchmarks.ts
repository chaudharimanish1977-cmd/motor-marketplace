/**
 * Industry add-on penetration benchmarks — used by the "Show our work"
 * disclosure on each gap card (Phase 7c).
 *
 * Each entry is a rough penetration estimate (what % of comparable
 * comprehensive motor policies carry this add-on) with an applicability
 * filter so we can show the customer the relevant benchmark for their
 * vehicle profile, not a generic national average.
 *
 * Sources (combined): IRDAI Handbook on Indian Insurance Statistics
 * (annual aggregate), General Insurance Council quarterly bulletins,
 * industry trade press, and conversations with broker partners.
 *
 * These figures are CONSERVATIVE ESTIMATES — labelled as "industry
 * estimate" in the UI so customers know the provenance. As we
 * accumulate our own cohort, we'll overlay our internal data on top
 * (and eventually replace the estimate where we have ≥ 10 same-cohort
 * policies — see Phase 7c product spec).
 *
 * Updated: 2026-05-17. Re-check at every IRDAI handbook release.
 */

import type { ParsedPolicy } from "@/lib/types";
import type { DrivingProfile } from "@/components/driving-profile-card";

export interface IndustryBenchmark {
  /** Plain-English description of the benchmark and the cohort it
   *  applies to. Shown inline in the gap disclosure as italic body. */
  statement: string;
  /** Citation handle for the data source. Currently only one source
   *  family; structured for future expansion. */
  source: "IRDAI Handbook + industry estimate";
}

/**
 * Vehicle-profile context the benchmark engine reads. Computed once per
 * report render from the ParsedPolicy.
 */
export interface VehicleContext {
  vehicleAge: number;
  fuelType: string; // "Petrol" | "Diesel" | "CNG" | "LPG" | "Electric" | ...
  isCngOrLpg: boolean;
  ncbPercent: number;
  isFloodProneCity: boolean;
  hasSmartKey: boolean;
  /** Driving profile captured during the upload mid-load carousel.
   *  Optional — gap evidence falls back to vehicle-only signals when
   *  the customer hasn't answered the questions. */
  drivingProfile?: DrivingProfile;
}

const FLOOD_PRONE_CITY_PATTERNS = [
  "mumbai",
  "kalyan",
  "thane",
  "chennai",
  "kolkata",
  "kochi",
  "bengaluru",
  "bangalore",
  "hyderabad",
  "gurgaon",
  "gurugram",
];

/**
 * Premium / smart-key models — penetration of factory smart-keys is
 * very high above this MSRP band. Used to gate the Key Replacement
 * benchmark to the right cohort.
 */
const SMART_KEY_MAKES = new Set([
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Volvo",
  "Lexus",
  "Jaguar",
  "Land Rover",
  "Porsche",
  "Mini",
  "Tesla",
]);

export function deriveVehicleContext(
  parsedPolicy: ParsedPolicy,
  drivingProfile?: DrivingProfile
): VehicleContext {
  const year = parsedPolicy.vehicle.yearOfManufacture;
  const vehicleAge = Math.max(0, new Date().getFullYear() - (year || 0));
  const fuelType = (parsedPolicy.vehicle.fuelType ?? "").trim();
  const isCngOrLpg = /cng|lpg/i.test(fuelType);
  const ncbPercent = parsedPolicy.ncbPercent ?? 0;

  // Combine every signal we have for "where does this car live?" so a
  // match in any of them counts — owner address, owner city, vehicle
  // RTO label, registration number (first letters encode state).
  const cityBlob = [
    parsedPolicy.owner?.address,
    parsedPolicy.owner?.city,
    parsedPolicy.vehicle.rto,
    parsedPolicy.vehicle.registrationNumber,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const isFloodProneCity = FLOOD_PRONE_CITY_PATTERNS.some((c) =>
    cityBlob.includes(c)
  );

  const makeUpper = (parsedPolicy.vehicle.make ?? "").trim();
  const hasSmartKey = SMART_KEY_MAKES.has(makeUpper);

  return {
    vehicleAge,
    fuelType,
    isCngOrLpg,
    ncbPercent,
    isFloodProneCity,
    hasSmartKey,
    drivingProfile,
  };
}

/**
 * Return the most-relevant penetration benchmark for a canonical
 * add-on given a vehicle context. Returns null when we don't have a
 * defensible benchmark for this profile (e.g. an exotic combination
 * we'd rather stay silent on than estimate badly).
 */
export function getIndustryBenchmark(
  canonical: string,
  ctx: VehicleContext
): IndustryBenchmark | null {
  switch (canonical) {
    case "Zero Depreciation": {
      if (ctx.vehicleAge <= 5) {
        return {
          statement:
            "~68% of comprehensive policies on cars under 5 years carry zero depreciation cover.",
          source: "IRDAI Handbook + industry estimate",
        };
      }
      if (ctx.vehicleAge <= 10) {
        return {
          statement:
            "~42% of comprehensive policies on cars 6–10 years carry zero depreciation cover.",
          source: "IRDAI Handbook + industry estimate",
        };
      }
      return {
        statement:
          "Only ~12% of cars 11+ years carry zero-dep — the depreciation gap is wider here.",
        source: "IRDAI Handbook + industry estimate",
      };
    }
    case "Engine Protector": {
      if (ctx.isCngOrLpg && ctx.isFloodProneCity) {
        return {
          statement:
            "~58% of CNG / LPG car policies in flood-prone metros carry engine protection.",
          source: "IRDAI Handbook + industry estimate",
        };
      }
      if (ctx.isCngOrLpg) {
        return {
          statement:
            "~41% of CNG / LPG car policies nationally carry engine protection.",
          source: "IRDAI Handbook + industry estimate",
        };
      }
      if (ctx.isFloodProneCity) {
        return {
          statement:
            "~33% of comprehensive policies in flood-prone metros carry engine protection.",
          source: "IRDAI Handbook + industry estimate",
        };
      }
      return {
        statement:
          "~22% of comprehensive policies nationally carry engine protection.",
        source: "IRDAI Handbook + industry estimate",
      };
    }
    case "Return to Invoice": {
      if (ctx.vehicleAge <= 3) {
        return {
          statement:
            "~31% of comprehensive policies on cars under 3 years carry return-to-invoice.",
          source: "IRDAI Handbook + industry estimate",
        };
      }
      if (ctx.vehicleAge <= 7) {
        return {
          statement:
            "~9% of comprehensive policies on cars 4–7 years carry return-to-invoice.",
          source: "IRDAI Handbook + industry estimate",
        };
      }
      return null; // RTI on 8+ year cars isn't a relevant peer benchmark
    }
    case "Roadside Assistance": {
      return {
        statement:
          "~78% of comprehensive policies carry roadside assistance — often bundled at low cost.",
        source: "IRDAI Handbook + industry estimate",
      };
    }
    case "NCB Protection": {
      if (ctx.ncbPercent >= 45) {
        return {
          statement:
            "~55% of policies with NCB ≥ 45% carry NCB protection — protects what you've built up.",
          source: "IRDAI Handbook + industry estimate",
        };
      }
      if (ctx.ncbPercent >= 25) {
        return {
          statement:
            "~28% of policies with NCB 25–35% carry NCB protection.",
          source: "IRDAI Handbook + industry estimate",
        };
      }
      return {
        statement:
          "~12% of policies with NCB under 25% carry NCB protection — typically not material at this discount level.",
        source: "IRDAI Handbook + industry estimate",
      };
    }
    case "Consumables": {
      if (ctx.vehicleAge >= 5) {
        return {
          statement:
            "~33% of comprehensive policies on cars 5+ years carry consumables cover.",
          source: "IRDAI Handbook + industry estimate",
        };
      }
      return {
        statement:
          "~19% of comprehensive policies nationally carry consumables cover.",
        source: "IRDAI Handbook + industry estimate",
      };
    }
    case "Key Replacement": {
      if (ctx.hasSmartKey) {
        return {
          statement:
            "~38% of premium / smart-key vehicle policies carry key replacement cover.",
          source: "IRDAI Handbook + industry estimate",
        };
      }
      return {
        statement:
          "~14% of comprehensive policies nationally carry key replacement cover.",
        source: "IRDAI Handbook + industry estimate",
      };
    }
    case "Loss of Personal Belongings": {
      return {
        statement:
          "~6% of comprehensive policies nationally carry loss of personal belongings.",
        source: "IRDAI Handbook + industry estimate",
      };
    }
    default:
      return null;
  }
}
