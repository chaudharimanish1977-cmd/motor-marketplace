/**
 * Lookup of neighbouring areas for major Indian RTO cities.
 * Used to personalise the journey-loader animation with locally-recognisable
 * landmarks ("Curating for Delhi · Gurgaon · Noida · Faridabad").
 */

export const NEARBY_AREAS: Record<string, string[]> = {
  Delhi: ["Gurgaon", "Noida", "Faridabad", "Ghaziabad", "Dwarka"],
  Mumbai: ["Thane", "Navi Mumbai", "Vasai", "Andheri", "Borivali"],
  Kalyan: ["Dombivli", "Thane", "Navi Mumbai", "Ulhasnagar", "Ambernath"],
  Thane: ["Mulund", "Kalyan", "Dombivli", "Mira Road", "Bhiwandi"],
  Pune: ["Pimpri", "Chinchwad", "Hinjawadi", "Lohegaon", "Hadapsar"],
  Bangalore: [
    "Whitefield",
    "Electronic City",
    "Yelahanka",
    "Indiranagar",
    "Koramangala",
  ],
  Bengaluru: [
    "Whitefield",
    "Electronic City",
    "Yelahanka",
    "Indiranagar",
    "Koramangala",
  ],
  Chennai: ["Tambaram", "Velachery", "Porur", "Ambattur", "Adyar"],
  Kolkata: ["Howrah", "Salt Lake", "Barrackpore", "Behala", "Garia"],
  Hyderabad: ["Secunderabad", "Cyberabad", "Madhapur", "Kondapur", "Gachibowli"],
  Ahmedabad: ["Gandhinagar", "Vastrapur", "Maninagar", "Bopal", "Naroda"],
  Jaipur: ["Vaishali Nagar", "Malviya Nagar", "Mansarovar", "Jagatpura"],
  Surat: ["Adajan", "Athwa", "Vesu", "Pal"],
  Noida: ["Greater Noida", "Ghaziabad", "Delhi", "Indirapuram"],
  Gurgaon: ["Gurugram", "Faridabad", "Delhi", "Sohna Road"],
  Gurugram: ["Gurgaon", "Faridabad", "Delhi", "Sohna Road"],
  Faridabad: ["Delhi", "Gurgaon", "Noida", "Ballabhgarh"],
  Lucknow: ["Gomti Nagar", "Hazratganj", "Indira Nagar", "Aliganj"],
};

export function getNearbyAreas(city: string | undefined | null): string[] {
  if (!city) return [];
  const normalized = city.trim();
  if (NEARBY_AREAS[normalized]) return NEARBY_AREAS[normalized];
  const key = Object.keys(NEARBY_AREAS).find(
    (k) => k.toLowerCase() === normalized.toLowerCase()
  );
  return key ? NEARBY_AREAS[key] : [];
}

/**
 * Returns up to 4 routes including the RTO city + nearest neighbours.
 *
 * Defensive: if the city isn't in our known list AND doesn't look like
 * a real Indian city name, returns [] so the loader silently drops the
 * "Curating for X" chip rather than rendering nonsense. This is the
 * downstream safety net for parser misclassifications (e.g. a renewal
 * notice that captured "Occupants" as the city).
 */
export function formatLandmarks(
  city: string | null | undefined,
  max = 4
): string[] {
  if (!city) return [];
  const nearby = getNearbyAreas(city);
  // Known city — confident, include it + its neighbours.
  if (nearby.length > 0) return [city, ...nearby].slice(0, max);
  // Unknown city — only show it if it looks plausibly like a city
  // name. Reject single-word matches that are obviously parser noise.
  if (!looksLikeCity(city)) return [];
  return [city].slice(0, max);
}

function looksLikeCity(city: string): boolean {
  const trimmed = city.trim();
  if (trimmed.length < 3 || trimmed.length > 30) return false;
  // Cities don't contain digits in their names.
  if (/\d/.test(trimmed)) return false;
  // Reject obvious non-city words that have made it through upstream
  // filters in the past.
  const first = trimmed.split(/\s+/)[0].toLowerCase();
  const NON_CITIES = new Set([
    "occupants",
    "owner",
    "insured",
    "vehicle",
    "driver",
    "passenger",
    "address",
    "code",
    "office",
    "jurisdiction",
    "number",
    "registration",
    "capacity",
    "policy",
    "endorsement",
    "proposal",
  ]);
  return !NON_CITIES.has(first);
}
