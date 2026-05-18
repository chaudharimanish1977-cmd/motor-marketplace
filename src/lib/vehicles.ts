/**
 * Vehicle profiles for /insurance/car/[slug] SEO landing pages.
 *
 * Each entry is hand-written editorial content — three findings most
 * owners of that model overlook, plus a verdict pull-quote.
 *
 * Top 5 best-selling India four-wheelers (FY25), used as the starter
 * set. Adding a new model is a single PR: append an entry, redeploy,
 * sitemap picks it up.
 */

export type VehicleBody =
  | "hatchback"
  | "tall-hatchback"
  | "compact-suv"
  | "micro-suv"
  | "sedan"
  | "suv"
  | "mpv";

export interface VehicleFinding {
  title: string;
  body: string;
}

export interface VehicleProfile {
  slug: string;
  make: string;
  model: string;
  bodyType: VehicleBody;
  // SEO
  seoTitle: string;
  seoDescription: string;
  // Editorial
  /** Mono-cap kicker above the masthead, e.g. "Vehicle brief · Swift". */
  kicker: string;
  /** Full headline. Highlight phrase is verbatim inside this string. */
  masthead: string;
  /** Italic-plum phrase inside `masthead`. */
  mastheadHighlight: string;
  /** One-paragraph lede under the masthead. */
  lede: string;
  /** The three things most owners overlook. */
  findings: [VehicleFinding, VehicleFinding, VehicleFinding];
  /** Italic + plum pull-quote verdict. */
  verdict: string;
  /** Optional related vehicles (slugs). */
  related?: string[];
}

export const VEHICLES: VehicleProfile[] = [
  {
    slug: "maruti-swift",
    make: "Maruti Suzuki",
    model: "Swift",
    bodyType: "hatchback",
    seoTitle: "Maruti Swift insurance — what most owners overlook",
    seoDescription:
      "An editorial guide to motor insurance for the Maruti Swift. IDV deflation, CNG kit declaration, and the three add-ons that actually matter for a Swift.",
    kicker: "Vehicle brief · Swift",
    masthead: "Maruti Swift insurance — three things most owners overlook.",
    mastheadHighlight: "three things most owners overlook",
    lede:
      "The Swift sells in such volume that every part is cheap, every workshop knows it, and every insurer has a clear actuarial picture of it. That works for you — if you know which add-ons to keep and which to skip.",
    findings: [
      {
        title: "IDV deflates 10–15% per year — push back",
        body: "Insurers use a well-documented Swift resale curve and tend to quote IDV at the low end of the band from year 3 onwards. A 2021 Swift VXi at year 4 is often quoted at ₹4.5L when ₹5.2L is defensible. Lower IDV means lower premium today and lower claim payout if the car is totalled tomorrow. At renewal, always ask for the upper bound of the IDV range and have the conversation.",
      },
      {
        title: "CNG retrofit is a hard declaration",
        body: "Aftermarket CNG kits are common on the Swift. The kit MUST be declared to the insurer — usually with an RC endorsement and a small premium loading. Undeclared CNG means a routine OD claim can be rejected outright, even if the claim has nothing to do with the kit. The declaration costs ₹600–1,200/yr in premium loading; the alternative costs the full claim.",
      },
      {
        title: "Three add-ons matter, the rest are noise",
        body: "Personal Accident is non-negotiable and statutory. NCB Protection becomes worth it from year 3 once you've built a 35–50% bonus. Zero Depreciation is worth it for years 1–3 — the Swift's plastic and rubber depreciate fast, and Zero Dep makes the insurer pay full replacement cost without age-deduction. Engine Protector, RTI and Consumables are nice-to-haves and lower priority on the Swift specifically — parts are cheap, so the gap they close is smaller than on a premium car.",
      },
    ],
    verdict:
      "The Swift is the easiest car in India to insure well. The default Swift policy is also the easiest one to leave 30% of value on the table on.",
    related: ["maruti-wagon-r", "tata-punch"],
  },
  {
    slug: "hyundai-creta",
    make: "Hyundai",
    model: "Creta",
    bodyType: "compact-suv",
    seoTitle: "Hyundai Creta insurance — IDV, ADAS, and what's worth paying for",
    seoDescription:
      "An editorial guide to motor insurance for the Hyundai Creta. IDV volatility, ADAS-equipped trim repair costs, and the diesel-NCR scrap rule effect.",
    kicker: "Vehicle brief · Creta",
    masthead: "Hyundai Creta insurance — pay for the trim, not the brochure.",
    mastheadHighlight: "pay for the trim, not the brochure",
    lede:
      "The Creta is one of India's most-sold compact SUVs and one of the most variable to insure — your trim, fuel type and year matter more than the model name suggests.",
    findings: [
      {
        title: "IDV is unusually volatile — quote three insurers",
        body: "The Creta has a hot resale market, but insurer IDV tables don't always update annually. We've seen the same year and variant quoted with a ₹70K–1.1L IDV gap across three insurers. The premium follows IDV proportionally — higher IDV, higher premium, but also higher payout on a total loss. Get three quotes, pick the right IDV, then choose the policy. Don't pick the policy first.",
      },
      {
        title: "ADAS-equipped trims have expensive bumpers",
        body: "From MY23 onwards, higher Creta trims ship with ADAS (Adaptive Cruise, Lane Keep, etc.). Those sensors live in the front bumper and windscreen. A bumper that costs ₹18,000 on a non-ADAS Creta costs ₹65,000+ to replace on an ADAS trim because of sensor recalibration. Zero Depreciation and Engine Protector are materially more valuable on ADAS trims through years 1–4, where they're optional on the lower trims.",
      },
      {
        title: "Diesel + NCR + 10-year rule",
        body: "Diesel Creta owners in Delhi NCR have a hard 10-year cut-off — after which the car cannot legally be on the road in the region. If your car is approaching that and you're insuring in NCR, the realistic IDV should reflect a finite remaining life. Some insurers under-discount the IDV in those last years; some under-IDV them aggressively. Both are wrong — push for an IDV that reflects the local resale, not the national one.",
      },
    ],
    verdict:
      "Insure the Creta you actually drive, not the Creta on the brochure. The trim and the fuel matter — sometimes more than the make.",
    related: ["maruti-brezza", "tata-punch"],
  },
  {
    slug: "tata-punch",
    make: "Tata",
    model: "Punch",
    bodyType: "micro-suv",
    seoTitle: "Tata Punch insurance — IDV, CNG, and what changes at year 3",
    seoDescription:
      "Editorial guide to motor insurance for the Tata Punch. New-model IDV volatility, the CNG declaration trap, and add-ons that fit a micro-SUV in India.",
    kicker: "Vehicle brief · Punch",
    masthead: "Tata Punch insurance — the policy for the car India just learned to buy.",
    mastheadHighlight: "the policy for the car India just learned to buy",
    lede:
      "The Punch is recent enough that insurer actuarial data on it is still settling. Three things to check, given the model is still finding its resale floor.",
    findings: [
      {
        title: "Insurers vary widely — three quotes minimum",
        body: "Because the Punch only launched in 2021, IDV bands across insurers still vary more than for mature models. A year-2 Punch can be quoted with a ₹50K–80K IDV spread across the top five insurers, with proportional premium differences. Get three or more quotes at renewal; pick the IDV that reflects current resale (Cars24/Spinny indicative is a useful sanity check).",
      },
      {
        title: "CNG variant declaration — factory or retrofit",
        body: "Factory-fitted CNG Punch variants are insurable as standard; retrofit CNG must be declared with an RC endorsement and is subject to a small premium loading. Undeclared retrofit = OD claim rejection risk. The Punch CNG is popular as a city second car, so this trap catches a lot of owners. Check your RC and policy schedule both say CNG.",
      },
      {
        title: "Side curtain airbags from MY24 reduce PA loading",
        body: "From model year 2024, side curtain airbags are standard across Punch trims. Some insurers will still try to push higher Personal Accident loading based on older actuarial assumptions. PA is statutory at a baseline; anything above ₹15L is optional and worth a discussion. Insurers don't always volunteer the discount for better passive safety; ask.",
      },
    ],
    verdict:
      "The Punch is two years away from being a settled insurance conversation. Until then, shop the IDV harder than the brand.",
    related: ["maruti-swift", "maruti-brezza"],
  },
  {
    slug: "maruti-wagon-r",
    make: "Maruti Suzuki",
    model: "Wagon R",
    bodyType: "tall-hatchback",
    seoTitle: "Maruti Wagon R insurance — second-car logic, multi-vehicle discounts",
    seoDescription:
      "Editorial guide to motor insurance for the Maruti Wagon R. Low IDV, multi-car household discounts, and the cheap glass-replacement trap most miss.",
    kicker: "Vehicle brief · Wagon R",
    masthead: "Maruti Wagon R insurance — the family second car, insured the family-second-car way.",
    mastheadHighlight: "the family second car, insured the family-second-car way",
    lede:
      "The Wagon R is the most-bought second car in Indian households. The right policy is shaped by that fact, not by what's optimal for a single-car owner.",
    findings: [
      {
        title: "Multi-vehicle discount is the biggest single saving",
        body: "Households commonly own a Wagon R as a city runabout alongside a larger primary car. Many insurers offer a 5–10% multi-vehicle discount when both policies are with the same insurer. It's the single easiest 10% to find — and it's missed routinely because the two cars came from different dealers with different insurer agreements. Consolidate at the next renewal.",
      },
      {
        title: "Low IDV doesn't mean skip Comprehensive",
        body: "A 5-year-old Wagon R might insure at ₹2.5–3.5L IDV. Tempting to drop to Third-Party-only for a small premium — but the Wagon R is a tall hatchback, more prone to rollovers in side impacts, and OD claims when they happen are not small relative to IDV. Comprehensive cover with a moderate voluntary deductible is the right balance here. Pure TP is false economy.",
      },
      {
        title: "Glass replacement is the most common claim",
        body: "Wagon R front windscreens are tall, exposed, and replaced often — debris, branches, pebbles. Glass replacement is typically excluded from the standard NCB drop on most insurers (claim doesn't reset your bonus). Confirm with your insurer; if yours doesn't have that carve-out, switch at renewal. The Wagon R will claim glass at least once over 5 years.",
      },
    ],
    verdict:
      "The Wagon R's value as a second car comes from cheap to run, cheap to insure. The cheap-to-insure half is something most owners don't actively optimise.",
    related: ["maruti-swift", "maruti-brezza"],
  },
  {
    slug: "maruti-brezza",
    make: "Maruti Suzuki",
    model: "Brezza",
    bodyType: "compact-suv",
    seoTitle: "Maruti Brezza insurance — IDV resilience and the SUV add-on bias",
    seoDescription:
      "Editorial guide to motor insurance for the Maruti Brezza. Strong IDV retention, the Engine Protector pitch most owners don't need, and where Zero Dep wins instead.",
    kicker: "Vehicle brief · Brezza",
    masthead: "Maruti Brezza insurance — the add-on agents push, and the one that actually pays.",
    mastheadHighlight: "the add-on agents push, and the one that actually pays",
    lede:
      "The Brezza retains value better than almost any compact SUV in India. That changes which add-ons matter for it — and which are sold to you out of habit, not out of fit.",
    findings: [
      {
        title: "IDV holds — push for the upper band at renewal",
        body: "The Brezza's resale curve flattens earlier than the Swift's; a year-4 Brezza often holds 60–65% of its on-road price. Insurers don't always quote the upper end of the band. The premium impact is modest; the claim-payout impact on a total loss is large. Get the IDV right; the cover follows.",
      },
      {
        title: "Engine Protector is over-sold on the Brezza",
        body: "Engine Protector is pitched aggressively for SUVs as 'flood and ground-clearance cover.' On the Brezza, with 198mm ground clearance and a high air-intake, hydrostatic-lock risk is materially lower than on a sedan or hatchback. The add-on isn't useless — but it's not where the marginal rupee on a Brezza policy is best spent. Skip it unless you're in Mumbai/Hyderabad/Chennai during monsoon and parking in a low spot.",
      },
      {
        title: "Zero Dep wins through year 3 — then phase out",
        body: "The Brezza's plastic and rubber depreciate at the same rate as the Swift's, and replacement bumpers / mirrors / side mouldings cost more on the SUV. Zero Depreciation is the high-value add-on through years 1–3. From year 4, parts have already depreciated significantly and the math reverses — drop Zero Dep and re-route the savings into NCB Protection if you haven't already.",
      },
    ],
    verdict:
      "The Brezza is the rare Indian car where insurer instincts and owner instincts disagree on add-ons. The owner is usually right.",
    related: ["hyundai-creta", "tata-punch"],
  },
];

export function getVehicle(slug: string): VehicleProfile | undefined {
  return VEHICLES.find((v) => v.slug === slug);
}

export function getRelatedVehicles(slug: string): VehicleProfile[] {
  const vehicle = getVehicle(slug);
  if (!vehicle || !vehicle.related) return [];
  return vehicle.related
    .map((s) => getVehicle(s))
    .filter((v): v is VehicleProfile => !!v);
}
