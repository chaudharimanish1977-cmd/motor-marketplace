/**
 * Classify a vehicle into a body type based on make + model.
 * Used to render the matching car illustration in the journey loader so
 * Audi customers see a luxury sedan, Wagon R customers see a hatchback,
 * Venue customers see a compact SUV, etc.
 *
 * Heuristic-driven from the Indian car market's common models.
 */

export type BodyType =
  | "hatchback"
  | "sedan-compact"
  | "sedan-luxury"
  | "suv-compact"
  | "suv-luxury";

const LUXURY_SEDAN_MAKES = ["audi", "bmw", "mercedes", "jaguar", "lexus", "volvo"];
const LUXURY_SEDAN_MODELS = [
  "a3", "a4", "a6", "a8",
  "3 series", "5 series", "7 series",
  "c-class", "e-class", "s-class", "c class", "e class", "s class",
  "xf", "xj", "es", "ls", "s60", "s90",
];

const LUXURY_SUV_MAKES_MODELS = [
  "q3", "q5", "q7", "q8",
  "x1", "x3", "x5", "x7",
  "gla", "glb", "glc", "gle", "gls",
  "range rover", "discovery", "evoque", "velar",
  "xc40", "xc60", "xc90",
];

const COMPACT_SUV_MODELS = [
  "venue", "creta", "kushaq", "taigun", "seltos", "carens", "harrier", "safari",
  "scorpio", "scorpio-n", "xuv300", "xuv500", "xuv700", "xuv400",
  "bolero", "vitara", "vitara brezza", "brezza", "ecosport", "magnite",
  "punch", "nexon", "kicks", "duster", "kiger", "exter", "alcazar",
  "compass", "meridian", "fortuner", "innova", "innova crysta", "hyryder",
  "thar", "gloster", "hector", "astor",
];

const COMPACT_SEDAN_MODELS = [
  "city", "amaze", "dzire", "verna", "rapid", "vento", "aura", "tigor",
  "yaris", "ciaz", "etios", "sunny",
];

const HATCHBACK_MODELS = [
  "wagon r", "wagonr", "alto", "alto k10", "celerio", "swift", "baleno",
  "i10", "grand i10", "grand i10 nios", "i20", "santro", "tiago",
  "punch", "kwid", "polo", "ignis", "altroz", "glanza", "ritz",
  "spark", "beat", "go", "redi-go",
];

function normalise(s: string): string {
  return s.toLowerCase().trim();
}

export function getBodyType(make?: string | null, model?: string | null): BodyType {
  const m = normalise((make ?? "") + " " + (model ?? ""));

  // Luxury SUV checks first (since some makes overlap)
  if (LUXURY_SUV_MAKES_MODELS.some((s) => m.includes(s))) return "suv-luxury";

  // Luxury sedan
  if (
    LUXURY_SEDAN_MAKES.some((makeName) => m.includes(makeName)) &&
    LUXURY_SEDAN_MODELS.some((modelName) => m.includes(modelName))
  ) {
    return "sedan-luxury";
  }

  // Compact SUV
  if (COMPACT_SUV_MODELS.some((s) => m.includes(s))) return "suv-compact";

  // Compact sedan
  if (COMPACT_SEDAN_MODELS.some((s) => m.includes(s))) return "sedan-compact";

  // Hatchback
  if (HATCHBACK_MODELS.some((s) => m.includes(s))) return "hatchback";

  // Default: compact sedan (most common Indian profile)
  return "sedan-compact";
}
