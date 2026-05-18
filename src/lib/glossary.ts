/**
 * Glossary of motor-insurance terms RightOffer uses across the report,
 * comparison, /me portal, and emails.
 *
 * Wired in via <GlossaryTerm term="IDV" /> in the UI. The term renders
 * with a dotted underline + cursor-help; on hover (desktop) or
 * long-press (mobile) the native browser tooltip shows the meaning.
 * For a fuller reading experience there's a /glossary page listing
 * every term.
 *
 * Tone discipline:
 *   - Plain English, not legalese
 *   - Concrete examples where they help ("e.g. ₹50k of bumper damage")
 *   - No "LLM", "AI", "policy parser" or other technical jargon
 *   - 1–2 sentences max; the term card on /glossary expands further
 *
 * Editing model: add a new entry below + that's it. The GlossaryTerm
 * component reads from this map at render time.
 */

export interface GlossaryEntry {
  /** Full name expansion (e.g. "Insured Declared Value"). */
  full: string;
  /** Short meaning shown in the inline tooltip. Plain English. */
  short: string;
  /** Optional longer explanation shown on the /glossary page. */
  long?: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  IDV: {
    full: "Insured Declared Value",
    short:
      "The amount your insurer would pay if your car is totally lost (theft, total accident). Set when you buy the policy; not the same as resale value.",
    long: "IDV is the agreed market value of your car set at policy purchase. On total-loss claims (theft, irrecoverable damage) this is the maximum payout. A higher IDV protects you better but raises the premium. A lower IDV saves premium today but leaves you short if the worst happens. Compare against current resale value on Cars24, Spinny, or a dealer to know if yours is fair.",
  },
  NCB: {
    full: "No Claim Bonus",
    short:
      "A compounding discount on your own-damage premium that grows every claim-free year. Starts at 20% after Year 1, tops out at 50% after Year 5.",
    long: "NCB rewards claim-free years with a discount on next year's premium. Year 1 claim-free → 20% off; Year 2 → 25%; Year 3 → 35%; Year 4 → 45%; Year 5+ → 50%. A single claim — any size — wipes the discount back to 0%. Rebuilding takes 4–5 claim-free years. NCB Protection (~₹500/year) is an add-on that lets you claim once without losing the discount.",
  },
  OD: {
    full: "Own Damage",
    short:
      "The part of your premium that covers damage to your own car (accident, fire, theft). Insurers can discount this; comparing premiums means comparing this.",
    long: "The Own Damage component is where insurers compete on price. It covers accidental damage, fire, theft, natural disasters, and similar. Unlike TP (Third-Party), insurers can discount this freely — which is why two quotes for the same car can look meaningfully different. NCB applies to OD, not TP.",
  },
  TP: {
    full: "Third-Party Liability",
    short:
      "The part of your premium that covers damage you cause to others (their car, property, injury). Mandatory by law; price is fixed by IRDAI, all insurers charge the same.",
    long: "Third-Party Liability is legally mandatory in India. It covers damage you cause to other people's vehicles, property, or persons. IRDAI sets the price annually by car category — every insurer charges the same TP premium. So when you compare insurer A vs. B, the TP component is identical; the difference is OD + add-ons.",
  },
  RSA: {
    full: "Roadside Assistance",
    short:
      "An add-on that covers towing, on-spot mechanical help, fuel delivery, flat-tyre fixes. Costs ~₹200–₹400/year.",
    long: "RSA is one of the cheapest, highest-utility add-ons. Your insurer dispatches a 24/7 helpline that handles towing, jumpstarts, flat tyres, locked keys, and minor on-spot repairs. The base comprehensive policy does NOT include any of this. Typically ₹200–₹400/year extra; often bundled free with newer policies.",
  },
  "Zero Depreciation": {
    full: "Zero Depreciation cover",
    short:
      "An add-on that removes the deduction insurers normally apply for wear-and-tear on plastic, rubber, and fibreglass parts. Most valuable for cars 1–5 years old.",
    long: "Without zero-dep, your insurer deducts depreciation on plastic, rubber, fibreglass, and metal parts before paying out — a ₹50k bumper claim might net you ₹25k. Zero Dep removes that deduction. Best value for cars under 5 years; less valuable as the car ages because the depreciation gap narrows. Typical cost: ~1.5% of IDV.",
  },
  "Engine Protector": {
    full: "Engine Protection",
    short:
      "An add-on covering consequential damage to the engine — hydrostatic lock from water ingress, oil leakage damage. Highest value for CNG / LPG cars and flood-prone metros.",
    long: "The base comprehensive policy does NOT cover engine damage that's consequential to flooding (water ingress, hydrostatic lock) or oil-leakage failure. Engine Protection fills this gap. CNG / LPG cars are at higher risk because the dual-fuel intake sits lower. Customers in Mumbai, Kalyan, Chennai, Kolkata, Bengaluru should treat this as essential — typical cost ₹1,200–₹2,500/year vs. ₹60k–₹1.2L hydrostatic lock repair.",
  },
  RTI: {
    full: "Return to Invoice",
    short:
      "An add-on that pays you the original invoice value (not the current IDV) on total loss / theft. Most valuable in the first 3 years.",
    long: "On total-loss claims, the base policy pays IDV — which is lower than what you paid for the car. RTI tops up the difference, paying you the original on-road invoice value. Best value in Years 1–3 when the invoice–IDV gap is widest; less useful after Year 5. Typical cost: ~1% of IDV.",
  },
  "NCB Protection": {
    full: "No-Claim-Bonus Protection",
    short:
      "An add-on that lets you make one claim without losing your NCB discount. Earns its keep once NCB ≥ 25%.",
    long: "Without NCB Protection, any claim — even ₹5,000 — wipes your accumulated NCB to 0%. Rebuilding takes 4–5 claim-free years. NCB Protection (typically ₹500/year) lets you claim once (some insurers: twice) without losing the discount. The protected NCB at 35–45% is usually worth multiples of the add-on premium across the rebuild years.",
  },
  Consumables: {
    full: "Consumables Cover",
    short:
      "An add-on that covers the engine oil, coolant, AC gas, nuts, bolts, and washers consumed during a claim repair. Most valuable for cars 5+ years.",
    long: "On a major repair, the workshop bill includes consumables (engine oil, brake fluid, coolant, AC gas, nuts, bolts, washers, lubricants) — typically ₹5,000–₹15,000. The base policy deducts these from the claim payout. Consumables cover removes the deduction. Worth more on older cars where claims are more frequent. Typical cost: ~₹800/year.",
  },
  "Key Replacement": {
    full: "Key Replacement Cover",
    short:
      "An add-on covering the cost of replacing lost / stolen / damaged keys, including dealer-programmed smart keys. Worth ~₹500/year on premium / smart-key vehicles.",
  },
  "Loss of Personal Belongings": {
    full: "Loss of Personal Belongings",
    short:
      "An add-on covering personal items (laptop, bag, phone) stolen from the vehicle after a break-in. ~₹250/year. Most valuable for premium-vehicle owners.",
  },
  RTO: {
    full: "Regional Transport Office",
    short:
      "The state government office that registers your vehicle and issues the registration number. RightOffer infers your city + flood-risk profile from this.",
  },
};

/** All canonical glossary keys, for typing the GlossaryTerm component. */
export type GlossaryKey = keyof typeof GLOSSARY;

/** Lookup helper — case-sensitive on the keys above. Returns null
 *  when the term isn't in the dictionary so callers can fall back to
 *  rendering the raw text. */
export function lookupTerm(term: string): GlossaryEntry | null {
  return GLOSSARY[term] ?? null;
}
