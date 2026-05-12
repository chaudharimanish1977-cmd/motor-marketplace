/**
 * Fast regex-based extraction of basic vehicle info from raw policy text.
 *
 * Used to personalise the parsing-wait animation immediately after upload,
 * before the slower LLM-based full extraction runs. Intentionally lossy —
 * if a field can't be confidently extracted, returns null. The full LLM
 * pass will fill in everything authoritatively.
 *
 * Tuned for Indian motor insurance policies (Magma, HDFC ERGO, ICICI Lombard,
 * Bajaj Allianz, etc.) which all share a similar high-level format mandated
 * by IRDAI.
 */

export interface PreviewExtraction {
  make: string | null;
  model: string | null;
  year: number | null;
  registrationNumber: string | null;
  rto: string | null;
  ownerName: string | null;
  vehicleLabel: string | null; // Composed "Maruti Wagon R LXI 1.0 CNG"
  ageYears: number | null;
}

const COMMON_BRANDS = [
  "MARUTI",
  "HYUNDAI",
  "TATA",
  "MAHINDRA",
  "HONDA",
  "TOYOTA",
  "FORD",
  "AUDI",
  "BMW",
  "MERCEDES",
  "VOLKSWAGEN",
  "KIA",
  "RENAULT",
  "NISSAN",
  "SKODA",
  "JEEP",
  "MG",
  "VOLVO",
  "JAGUAR",
  "LAND ROVER",
  "MITSUBISHI",
  "DATSUN",
  "FIAT",
  "CHEVROLET",
];

const RTO_CITY_PATTERNS = [
  "DELHI", "MUMBAI", "BANGALORE", "BENGALURU", "CHENNAI", "KOLKATA", "HYDERABAD",
  "PUNE", "AHMEDABAD", "KALYAN", "THANE", "NOIDA", "GURGAON", "GURUGRAM",
  "JAIPUR", "LUCKNOW", "KANPUR", "NAGPUR", "INDORE", "BHOPAL", "PATNA",
  "VADODARA", "SURAT", "GHAZIABAD", "FARIDABAD", "MEERUT", "AGRA", "VARANASI",
  "ALLAHABAD", "RAJKOT", "AURANGABAD", "AMRITSAR", "VIJAYAWADA", "VISAKHAPATNAM",
  "CHANDIGARH", "MYSORE", "MYSURU", "NASHIK", "COIMBATORE", "KOCHI", "TRIVANDRUM",
];

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

export function extractPreview(text: string): PreviewExtraction {
  const upper = text.toUpperCase();

  // ===== Make =====
  let make: string | null = null;
  let makeUpper = "";
  for (const brand of COMMON_BRANDS) {
    if (upper.includes(brand)) {
      make = brand.charAt(0) + brand.slice(1).toLowerCase();
      makeUpper = brand;
      break;
    }
  }

  // ===== Year of Manufacture =====
  let year: number | null = null;
  const yearMatches = [
    /(?:Year of Manufacture|Year of Mfg|Model Year|YOM)[\s:]*(\d{4})/i,
    /(\d{4})\s*Model/i,
    /(?:Vehicle Registration Date|Registration Date)[\s:]+\d{1,2}[\/\-]\d{1,2}[\/\-](\d{4})/i,
    /(?:Mfg\.? Date|Manufacturing Date)[\s:]+\d{1,2}[\/\-]\d{1,2}[\/\-](\d{4})/i,
  ];
  for (const re of yearMatches) {
    const m = text.match(re);
    if (m) {
      const y = parseInt(m[1], 10);
      if (y >= 1990 && y <= new Date().getFullYear() + 1) {
        year = y;
        break;
      }
    }
  }

  // ===== Registration Number =====
  // Look for explicit "Registration No" label first (most reliable).
  let registrationNumber: string | null = null;
  const explicitReg = text.match(
    /Vehicle Registration No\.?[\s:]+([A-Z]{2}[\s\-]?\d{1,2}[\s\-]?[A-Z]{0,3}[\s\-]?\d{1,4}|NEW|New|\s*NEW\s*)/i
  )
    || text.match(
      /Registration No\.?[\s:]+([A-Z]{2}[\s\-]?\d{1,2}[\s\-]?[A-Z]{0,3}[\s\-]?\d{1,4}|NEW|New)/i
    );
  if (explicitReg) {
    const cand = explicitReg[1].trim().replace(/\s+/g, " ");
    if (cand.toUpperCase() === "NEW") {
      registrationNumber = "NEW";
    } else if (/\d/.test(cand) && /[A-Z]/.test(cand)) {
      registrationNumber = cand;
    }
  }
  // Fallback: search globally for an Indian plate pattern, but require at least
  // 3 digits + 2-3 letters layout to reduce false positives.
  if (!registrationNumber) {
    const globalReg = text.match(
      /\b([A-Z]{2}[\s\-]?\d{1,2}[\s\-]?[A-Z]{1,3}[\s\-]?\d{3,4})\b/
    );
    if (globalReg) {
      registrationNumber = globalReg[1].replace(/\s+/g, " ").trim();
    }
  }

  // ===== RTO (city) =====
  let rto: string | null = null;
  // Try explicit "RTO XYZ" pattern first
  const rtoExplicit = text.match(/RTO[\s:]*([A-Z][A-Za-z\s]{2,30}?)(?:\s{2,}|\n|Vehicle|Registration|Chassis|Cubic|Year)/i);
  if (rtoExplicit) {
    const candidate = rtoExplicit[1].trim();
    if (candidate.length > 1 && candidate.length < 35) {
      rto = titleCase(candidate);
    }
  }
  // Fallback: search for known city names
  if (!rto) {
    for (const city of RTO_CITY_PATTERNS) {
      if (upper.includes(city)) {
        rto = city.charAt(0) + city.slice(1).toLowerCase();
        break;
      }
    }
  }

  // ===== Model / Variant =====
  let model: string | null = null;
  let vehicleLabel: string | null = null;

  // Strategy 1: Look for explicit label patterns first.
  const labelMatches = [
    // "Vehicle Make/Model MARUTI / WAGON R LXI 1.0 CNG BSVI"
    /Vehicle Make\/Model[\s:]+([A-Z][A-Z0-9\s\/\.\-]{2,60}?)(?:\n|RTO|Vehicle Registration|Chassis|Engine|Cubic Capacity|Year of)/i,
    // "Make AUDI \n Model AUDI A6-35 TFSI PREMIUM"
    /Model[\s:]+([A-Z][A-Z0-9\s\.\-]{2,60}?)(?:\n|Registration|Cubic Capacity|Year of|Engine No|Chassis No|Body Type|Seats)/i,
    // "Model/Variant: XYZ"
    /Model\/Variant[\s:]+([A-Z][A-Z0-9\s\.\-]{2,60}?)(?:\n|Registration|Year)/i,
  ];

  for (const re of labelMatches) {
    const m = text.match(re);
    if (m) {
      let raw = m[1].trim();
      // Strip leading make if present in the match
      if (makeUpper && raw.toUpperCase().startsWith(makeUpper)) {
        raw = raw.slice(makeUpper.length).replace(/^[\s\/,\-]+/, "");
      }
      // Strip trailing words that look like adjacent fields
      raw = raw.split(/\s{2,}/)[0].trim();
      if (raw.length >= 2 && raw.length <= 60) {
        model = titleCase(raw);
        break;
      }
    }
  }

  // Strategy 2: try each occurrence of the make brand in turn — find the
  // one followed by a plausible model variant (i.e. ≥2 valid tokens after).
  // HDFC ERGO has "Make AUDI ... Policy No." with the REAL "Model AUDI A6..."
  // appearing later, so we need to skip the first match if it leads nowhere.
  const BAD_TOKENS = new Set([
    "POLICY", "NO", "REGISTRATION", "CHASSIS", "ENGINE", "RTO", "VEHICLE",
    "YEAR", "MAKE", "MODEL", "CUBIC", "CAPACITY", "PERIOD", "INSURANCE",
    "SEATS", "BODY", "TYPE", "PROPOSAL", "INVOICE", "CUSTOMER", "ISSUANCE",
    "FROM", "TO", "DATE",
  ]);
  if (!model && makeUpper) {
    let searchFrom = 0;
    while (true) {
      const idx = upper.indexOf(makeUpper, searchFrom);
      if (idx === -1) break;
      const after = text.slice(idx + makeUpper.length, idx + makeUpper.length + 100);
      const cleaned = after.replace(/^[\s\/,\-]+/, "");
      const tokens = cleaned
        .split(/\s+/)
        .slice(0, 8)
        .filter(
          (t) =>
            /^[A-Z][A-Z0-9\-\.]*$/.test(t) &&
            t.length >= 2 &&
            t.length <= 20 &&
            !BAD_TOKENS.has(t)
        );
      // Require at least 2 valid tokens for it to look like a real variant
      if (tokens.length >= 2) {
        model = titleCase(tokens.slice(0, 5).join(" "));
        break;
      }
      searchFrom = idx + makeUpper.length;
    }
  }

  if (make && model) vehicleLabel = `${make} ${model}`;
  else if (make) vehicleLabel = make;

  // ===== Owner Name =====
  let ownerName: string | null = null;
  const ownerMatches = [
    /(?:Name of Insured|Insured Name|Insured)[\s:]+(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Smt\.?|Shri)?\s*([A-Z][A-Z\s]{2,40}?)(?:\n|\s+(?:Vehicle|Period|Address|Mobile|C\-\d|S\/o|D\/o))/,
    /\b(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?)\s+([A-Z][A-Z\s]{2,40}?)(?:\s+Communication|\s+C\-\d|\n)/,
  ];
  for (const re of ownerMatches) {
    const m = text.match(re);
    if (m) {
      const name = m[1].trim();
      if (name.length > 2 && name.length < 50) {
        ownerName = titleCase(name);
        break;
      }
    }
  }

  // ===== Age (derived) =====
  const ageYears = year ? Math.max(0, new Date().getFullYear() - year) : null;

  return {
    make,
    model,
    year,
    registrationNumber,
    rto,
    ownerName,
    vehicleLabel,
    ageYears,
  };
}
