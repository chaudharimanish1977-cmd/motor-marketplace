/**
 * City profiles for /insurance/city/[slug] SEO landing pages.
 *
 * Each entry is hand-written editorial content — three locally
 * credible findings + a verdict pull-quote. The page template at
 * src/app/insurance/city/[slug]/page.tsx reads from this list,
 * generates static pages for every slug at build time, and
 * registers them in sitemap.ts.
 *
 * Adding a city is a single PR — append an entry, redeploy, and
 * the new page is live + indexed.
 */

export type CityRiskTag =
  | "monsoon-flood"
  | "theft"
  | "pothole"
  | "cyclone-coast"
  | "heat-hail"
  | "dust-arid"
  | "urban-traffic";

export interface CityFinding {
  title: string;
  body: string;
}

export interface CityProfile {
  slug: string;
  name: string; // Display name
  state: string;
  // SEO
  seoTitle: string;
  seoDescription: string;
  // Editorial
  riskTags: CityRiskTag[];
  /** Mono-cap kicker above the masthead, e.g. "Mumbai brief". */
  kicker: string;
  /** Full headline. Highlight phrase is inside this string verbatim. */
  masthead: string;
  /** Italic-plum phrase inside `masthead` — wraps in italic-plum. */
  mastheadHighlight: string;
  /** One-paragraph lede under the masthead. */
  lede: string;
  /** The three things locals get wrong. */
  findings: [CityFinding, CityFinding, CityFinding];
  /** Pull-quote verdict — italic + plum. */
  verdict: string;
  /** Optional related cities (slugs). When empty, footer renders nothing. */
  related?: string[];
}

export const CITIES: CityProfile[] = [
  {
    slug: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    seoTitle: "Car insurance in Mumbai — what the monsoon doesn't forgive",
    seoDescription:
      "An editorial guide to motor insurance for Mumbai car owners. Flood sub-limits, renewal timing around the monsoon, RTI on potholed cars — what most policies miss.",
    riskTags: ["monsoon-flood", "pothole", "urban-traffic"],
    kicker: "Mumbai brief",
    masthead: "Motor insurance in Mumbai — what the monsoon doesn't forgive.",
    mastheadHighlight: "what the monsoon doesn't forgive",
    lede:
      "Mumbai is the single hardest city in India to insure a car well. Three quiet traps catch the average policy — none of them obvious until July.",
    findings: [
      {
        title: "Flood damage hides in the engine sub-limit",
        body: "Hydrostatic lock — the engine seizing after water ingress — is the costliest monsoon claim a Mumbai driver makes. Most basic policies cap engine repair at ₹15–25K. The actual repair bill on a flooded petrol engine starts at ₹1.2L and runs to ₹2–3L on diesels. Engine Protector add-on (sometimes called Hydrostatic Cover) lifts the cap to the full IDV. It costs the price of one tank of fuel a year.",
      },
      {
        title: "Renewal timing matters more than premium",
        body: "Mumbai claims peak July–September. If your renewal window opens in July, the insurer prices in the season — you'll pay 8–15% more for the same cover than you would in March. Bring renewals forward into the dry months. Some insurers will let you renew up to 60 days early without backdated cover; ask explicitly.",
      },
      {
        title: "RTI dies fast on Mumbai roads",
        body: "Return-to-Invoice — the add-on that pays the original ex-showroom price on a total loss — is only available for the first 3 to 5 years on most insurers. Mumbai potholes age cars quickly; suspension, alignment and electrical claims pile up by year 4. If your car is approaching the RTI sunset and your reading the policy at renewal, that's the year to use it, not lose it.",
      },
    ],
    verdict:
      "If you live south of Sion or anywhere on the central line, the monsoon owns your policy three months a year. Plan for it.",
    related: ["pune", "ahmedabad"],
  },
  {
    slug: "delhi-ncr",
    name: "Delhi NCR",
    state: "Delhi",
    seoTitle: "Car insurance in Delhi NCR — theft, scrap rules, and the PUC trap",
    seoDescription:
      "An editorial guide to motor insurance for Delhi, Gurgaon, Noida and Faridabad car owners. Vehicle theft, BS6 scrap rules, PUC-linked claim rejections.",
    riskTags: ["theft", "pothole", "urban-traffic"],
    kicker: "Delhi NCR brief",
    masthead: "Motor insurance in Delhi NCR — the policy traps Delhi keeps quiet.",
    mastheadHighlight: "the policy traps Delhi keeps quiet",
    lede:
      "Delhi leads India in vehicle theft and has the strictest age-based scrap rules in the country. Two facts most owners don't price into their cover.",
    findings: [
      {
        title: "Theft cover is narrower than it sounds",
        body: "Delhi has topped car-theft tables in India for over a decade. Third-Party-only policies do not pay if your car is stolen and never recovered — full stop. Comprehensive (Own Damage + Third Party) does, but only if the policy schedule names anti-theft device endorsement where applicable. Read your schedule. If it isn't there, ask your insurer to add it before renewal.",
      },
      {
        title: "Scrap rules limit your useful IDV",
        body: "Diesel cars in NCR must be off the road at 10 years; petrol at 15. Your insurer should adjust the IDV downward in the last 2–3 years to reflect this finite remaining life — many don't, which is good news for you (higher IDV means higher claim payout if the car is totalled). At renewal, push for an IDV that reflects what the car would actually sell for in NCR, not the national resale benchmark.",
      },
      {
        title: "PUC lapses can void claims",
        body: "Pollution Under Control (PUC) certificate validity is checked at the claim-survey stage in NCR. An expired PUC at the time of the claim is a quiet but legitimate ground for the insurer to reject or reduce payout. Renew PUC three weeks before it lapses — set a calendar reminder for one day before insurance renewal, since both windows commonly drift together.",
      },
    ],
    verdict:
      "Delhi treats motor insurance like a tax. It shouldn't be. Three quiet checks each renewal will save you the price of the premium itself.",
    related: ["jaipur", "lucknow"],
  },
  {
    slug: "bangalore",
    name: "Bangalore",
    state: "Karnataka",
    seoTitle: "Car insurance in Bangalore — traffic, theft and the weekend run",
    seoDescription:
      "Editorial guide to motor insurance for Bangalore car owners. Bumper-to-bumper claim frequency, tech-park theft, RSA for the Coorg-Ooty weekend drive.",
    riskTags: ["urban-traffic", "theft"],
    kicker: "Bangalore brief",
    masthead: "Motor insurance in Bangalore — designed for the city you actually drive in.",
    mastheadHighlight: "designed for the city you actually drive in",
    lede:
      "Bangalore drivers spend more time bumper-to-bumper than any other Indian metro. The policy designed for highway driving costs you twice — once at renewal, once at the claim.",
    findings: [
      {
        title: "Voluntary deductibles look cheap, hurt often",
        body: "Insurers offer a 15–25% premium discount if you accept a voluntary deductible of ₹5–10K per claim. In Mumbai or Pune that's a fair trade. In Bangalore, where the average car suffers 1.5–2 minor own-damage claims a year (mirrors, fenders, scratches), the deductible eats most of the discount inside 18 months. Cap voluntary deductible at ₹2,500, or skip it entirely.",
      },
      {
        title: "Daytime tech-park theft is the new pattern",
        body: "Whitefield, Electronic City, Manyata and ORR park lots have seen rising daytime theft and break-in claims — laptops, phones, sometimes the car itself from less-monitored gates. Loss of Personal Belongings is a cheap add-on (₹150–300/yr) covering up to ₹20–30K of contents stolen from a locked car. It pays for itself the first time.",
      },
      {
        title: "RSA is the Coorg-Ooty insurance",
        body: "Bangalore drivers head out of city more than any other metro — Coorg, Ooty, Chikmagalur, Yelagiri. Road Side Assistance (RSA) covers breakdown towing, battery jumpstart, flat tyres, fuel delivery — the things you actually need at 11pm on a Mysore-Coorg stretch. It's the smallest premium on the schedule (₹300–600/yr) and the only add-on where you'll specifically remember the year you wished you had it.",
      },
    ],
    verdict:
      "The right Bangalore policy isn't the cheapest. It's the one tuned for the way you actually use the car — most of the week in traffic, two weekends a month outside city.",
    related: ["chennai", "hyderabad"],
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    seoTitle: "Car insurance in Hyderabad — floods, heat and the IT corridor",
    seoDescription:
      "Editorial guide to motor insurance for Hyderabad car owners. Urban flooding, summer heat damage, and the policy fit for HITEC City commuters.",
    riskTags: ["monsoon-flood", "heat-hail", "urban-traffic"],
    kicker: "Hyderabad brief",
    masthead: "Motor insurance in Hyderabad — between the floods and the heat.",
    mastheadHighlight: "between the floods and the heat",
    lede:
      "Hyderabad picked up two crises most insurers haven't fully priced in yet: serious urban flooding (2020, 2023) and long-hot-summer interior damage. Three things to check on your policy.",
    findings: [
      {
        title: "Urban flood cover, same trap as Mumbai",
        body: "The 2020 and 2023 Hyderabad floods rewrote what 'monsoon risk' means here. The engine sub-limit trap from Mumbai applies identically — basic policies cap engine claims at ₹15–25K; Engine Protector add-on lifts that to full IDV. Especially relevant if you're in Begumpet, Tolichowki, or low-lying parts of HITEC City.",
      },
      {
        title: "Heat damages interiors year-round",
        body: "Long parking outdoors in Hyderabad summers degrades dashboard plastics, AC compressors, and battery life faster than the insurer's actuarial tables assume. Comprehensive own-damage policies cover failures caused by heat, but not the gradual wear itself. Worth checking your policy specifically excludes 'consequential damage' — that exclusion does a lot of work at claim time.",
      },
      {
        title: "Kompally and Manikonda need RTI longer",
        body: "Hyderabad's new-suburb roads age cars faster than central ones — Kompally, Manikonda, Bachupally suspensions take a beating. Return-to-Invoice (which pays original invoice on a total loss) is more useful here than the standard 3-year sunset suggests. If your insurer offers it up to year 5, take it.",
      },
    ],
    verdict:
      "Hyderabad is two climates a year. A policy built for one of them is a policy that will fail you in the other.",
    related: ["bangalore", "chennai"],
  },
  {
    slug: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    seoTitle: "Car insurance in Chennai — cyclones, coastal salt, and PA cover",
    seoDescription:
      "Editorial guide to motor insurance for Chennai car owners. Cyclone-season cover (Oct–Dec), coastal corrosion, the Tamil Nadu two-wheeler PA gotcha.",
    riskTags: ["cyclone-coast", "monsoon-flood"],
    kicker: "Chennai brief",
    masthead: "Motor insurance in Chennai — built for the cyclone month, not the calendar year.",
    mastheadHighlight: "built for the cyclone month, not the calendar year",
    lede:
      "Chennai gets one bad month a year — usually November — and the rest mostly forgives the policy. The trick is making sure the policy doesn't quietly fail you in that one month.",
    findings: [
      {
        title: "Cyclone-season cover is non-negotiable",
        body: "Nivar (2020), Michaung (2023), and others brought widespread car damage across Chennai in a single week each. Comprehensive cover with Engine Protector is the floor here — basic Third-Party-only or Comprehensive-without-engine-cover will leave you with the largest part of the bill yourself. Renew before October. After that, expect rate hikes for the next 60 days.",
      },
      {
        title: "Coastal salt corrosion has limits",
        body: "Cars parked within 5–7 km of the coast (Besant Nagar, Thiruvanmiyur, Injambakkam) see undercarriage rust that no standard policy covers — corrosion is universally excluded. What is covered: electrical faults caused by salt-air ingress, which Engine Protector catches. Anti-rust treatment is a maintenance cost, not insurance — but factoring it into total cost of ownership makes the right comprehensive policy look cheaper than it does naked.",
      },
      {
        title: "PA cover may already be on your two-wheeler",
        body: "Tamil Nadu has very high two-wheeler ownership. Compulsory Personal Accident cover for the owner-driver only needs to be on one policy — many Chennai households accidentally double-pay for it on both the car and the bike. The car-policy version is usually the better value (higher sum insured, ₹15L vs ₹15L). Check your two-wheeler policy first, then opt out of the duplicate.",
      },
    ],
    verdict:
      "November will tell you whether your policy was honest. The rest of the year, you won't notice it. That's the point.",
    related: ["hyderabad", "kolkata"],
  },
  {
    slug: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    seoTitle: "Car insurance in Kolkata — waterlogging, narrow streets and NCB",
    seoDescription:
      "Editorial guide to motor insurance for Kolkata car owners. Salt Lake monsoon flooding, narrow-street scratch frequency, and protecting your No-Claim Bonus.",
    riskTags: ["monsoon-flood", "urban-traffic"],
    kicker: "Kolkata brief",
    masthead: "Motor insurance in Kolkata — the discount you've built up matters more than the cover.",
    mastheadHighlight: "the discount you've built up matters more than the cover",
    lede:
      "Kolkata's combination of monsoon waterlogging and tight street geometry produces lots of small claims. That's harder on your No-Claim Bonus than most people realise.",
    findings: [
      {
        title: "Salt Lake and Lake Town flood every July",
        body: "The Salt Lake / Bidhannagar / Lake Town belt waterlogs reliably through monsoon. Engine sub-limit caps apply here exactly as they do in Mumbai — Engine Protector add-on for the full IDV cover is worth its small premium. If your car has been there during a previous flood event, check whether last year's claim was paid in full or partially capped; the schedule will say.",
      },
      {
        title: "Narrow streets, small claims, eaten NCB",
        body: "Kolkata's older neighbourhoods (Bhowanipore, Ballygunge, Burrabazar) produce minor own-damage claims more frequently than wider-street cities. Each claim wipes your No-Claim Bonus the following year — five years of accrued 50% NCB lost over a ₹4,000 mirror replacement. NCB Protection add-on costs ₹400–800/yr and preserves the bonus through one to two small claims a year. High-value here.",
      },
      {
        title: "IDV deflates faster than the national table",
        body: "Kolkata's resale market sets lower prices than national averages for older cars (year 5+). Your insurer often uses a national IDV table, which over-inflates your insured value — but the premium follows that inflated number. At renewal, ask for the IDV adjusted to local resale; the premium drops without changing the cover meaningfully.",
      },
    ],
    verdict:
      "Three years of accident-free driving in Kolkata is a serious financial asset. Pay the small premium that protects it.",
    related: ["mumbai", "chennai"],
  },
  {
    slug: "pune",
    name: "Pune",
    state: "Maharashtra",
    seoTitle: "Car insurance in Pune — Hinjewadi commute, ghats and two-car homes",
    seoDescription:
      "Editorial guide to motor insurance for Pune car owners. IT-corridor accident frequency, Ghat-route claims, and the multi-vehicle discount most households miss.",
    riskTags: ["urban-traffic", "monsoon-flood"],
    kicker: "Pune brief",
    masthead: "Motor insurance in Pune — closer to Mumbai than the policy assumes.",
    mastheadHighlight: "closer to Mumbai than the policy assumes",
    lede:
      "Pune insurers price based on Pune statistics, but the average Pune car spends weekends on the Mumbai expressway or the Lonavala highway. Three things that means for your cover.",
    findings: [
      {
        title: "Hinjewadi commute is its own risk pool",
        body: "The Hinjewadi-Wakad-Baner corridor produces accident frequencies closer to Bangalore tech-park rates than to general Pune. If you commute it daily, the same logic from Bangalore applies — skip the voluntary deductible, take NCB Protection. Insurers don't always price this in to the standard Pune quote.",
      },
      {
        title: "Ghat-section claims are Western Ghats, not Pune",
        body: "Monsoon accidents on the Pune-Mumbai expressway and the old NH-48 ghat section show up as Mumbai-region claims on the insurer's books, but happen mostly to Pune-registered cars. Road Side Assistance (RSA) for highway breakdowns is more valuable here than the standard quote treats it. Cheap to add at renewal; impossible to add at the breakdown.",
      },
      {
        title: "Two-car households leave money on the table",
        body: "Pune has a high rate of two-car households (commuter + family) — most insurers offer a 5–10% multi-vehicle discount when both are on the same policy. Frequently missed because the cars were bought from different dealers and ended up with different insurers. Switch both to the same insurer at the next renewal; the saving is real.",
      },
    ],
    verdict:
      "Pune isn't a smaller Mumbai. But on insurance, the policy that treats it as one tends to be the right one.",
    related: ["mumbai", "ahmedabad"],
  },
  {
    slug: "ahmedabad",
    name: "Ahmedabad",
    state: "Gujarat",
    seoTitle: "Car insurance in Ahmedabad — heat, hailstorms and the dry season",
    seoDescription:
      "Editorial guide to motor insurance for Ahmedabad car owners. March-April hailstorms, summer heat damage, claim notification windows for hail events.",
    riskTags: ["heat-hail", "dust-arid"],
    kicker: "Ahmedabad brief",
    masthead: "Motor insurance in Ahmedabad — hail in spring, heat in summer.",
    mastheadHighlight: "hail in spring, heat in summer",
    lede:
      "Ahmedabad gets one weather event most policies aren't drafted for: spring hailstorms. The rest of the year is heat. The policy that covers both well doesn't cost much more than the one that covers neither.",
    findings: [
      {
        title: "Spring hailstorms are claim-eligible — within 7 days",
        body: "Gujarat sees periodic hailstorm activity in March and April that can dent panels and crack windscreens across entire neighbourhoods (Bopal, SG Road, Chandkheda). Comprehensive policies cover this — but notification windows are tight (typically 7 days) and surveyors are overbooked after a major event. File on day one, not day six.",
      },
      {
        title: "Heat-shortened battery life isn't a claim",
        body: "Ahmedabad summers shorten battery and AC compressor life by 18–24 months versus cooler cities. The component wear itself is not insurable — but a battery failure that strands you is a Roadside Assistance call, and AC compressor failure caused by a defined event (short circuit, accident impact) is a comprehensive claim. The premium for both is small and high-value here.",
      },
      {
        title: "Paint UV-fade is silent",
        body: "Year-on-year UV-fade reduces resale value by 5–10% over five years, more on darker colours. No policy covers paint fade, but it does push the appropriate IDV downward — most owners don't push for the IDV reduction at renewal because the lower premium feels like a cut. It isn't. The lower IDV reflects the real car.",
      },
    ],
    verdict:
      "Ahmedabad's weather is predictable enough that your policy can be too. The default policy isn't.",
    related: ["jaipur", "mumbai"],
  },
  {
    slug: "jaipur",
    name: "Jaipur",
    state: "Rajasthan",
    seoTitle: "Car insurance in Jaipur — dust, golden-triangle drives, old-city theft",
    seoDescription:
      "Editorial guide to motor insurance for Jaipur car owners. Pre-monsoon dust storms, Delhi-Agra tourism-route accident cover, walled-city parking theft.",
    riskTags: ["dust-arid", "theft"],
    kicker: "Jaipur brief",
    masthead: "Motor insurance in Jaipur — the dust, the highway, and the old city.",
    mastheadHighlight: "the dust, the highway, and the old city",
    lede:
      "Jaipur sits at the intersection of three insurance realities: pre-monsoon dust storms, heavy tourism-route driving, and walled-city parking density. Each one is a different conversation with your insurer.",
    findings: [
      {
        title: "Pre-monsoon dust storms can disable AC and electricals",
        body: "May–June Rajasthan dust storms (locally 'aandhi') can push fine dust into AC blowers, ECU vents, and air-intake systems, causing short-circuit events later. These are insurable as comprehensive own-damage events if the timing and surveyor report support causation. Engine Protector add-on widens this materially. Worth the premium even on cars stored under canvas covers.",
      },
      {
        title: "Golden-triangle routes need RSA",
        body: "Jaipur-Delhi (NH-48), Jaipur-Agra, and Jaipur-Udaipur stretches are heavy-tourism roads with thin breakdown infrastructure. RSA add-on (₹300–600/yr) covers towing, battery, flat-tyre, fuel-delivery on these routes. The cheap insurance every Jaipur driver wishes they had once. Take it once and don't think about it again.",
      },
      {
        title: "Walled-city parking is a theft conversation",
        body: "Inside the four walls (Chandpole, Tripolia, Surajpole, Sanganeri) and in Sindhi Camp / Bani Park overnight parking, theft and break-in frequencies run higher than the rest of the city. Comprehensive cover is the floor; anti-theft endorsement and Loss of Personal Belongings are the cheap upgrades that catch real cases.",
      },
    ],
    verdict:
      "Jaipur is three insurance cities in one. The right policy acknowledges all three; the default one mostly addresses none.",
    related: ["delhi-ncr", "ahmedabad"],
  },
  {
    slug: "lucknow",
    name: "Lucknow",
    state: "Uttar Pradesh",
    seoTitle: "Car insurance in Lucknow — pothole repairs, first-time owners, and Zero Dep",
    seoDescription:
      "Editorial guide to motor insurance for Lucknow car owners. Suspension-claim frequency, PUC compliance, and the Zero Depreciation add-on for new owners.",
    riskTags: ["pothole", "urban-traffic"],
    kicker: "Lucknow brief",
    masthead: "Motor insurance in Lucknow — for a car you just bought and want to keep right.",
    mastheadHighlight: "for a car you just bought and want to keep right",
    lede:
      "Lucknow is one of India's fastest-growing four-wheeler markets, with a large share of first-time car owners stepping up from two-wheelers. Three checks worth doing in year one of ownership.",
    findings: [
      {
        title: "Zero Depreciation matters most in year one",
        body: "Zero Depreciation (also called Bumper-to-Bumper) makes the insurer pay 100% of replacement cost for plastic, rubber and metal parts, without subtracting age-based depreciation. The premium is around 15–20% extra. For a first-time owner who hasn't yet learned the cost of a bumper or a fender flare, year-one Zero Dep is the single highest-value add-on. Phase it out around year 4 when parts have already depreciated.",
      },
      {
        title: "Lucknow roads age suspensions",
        body: "Pothole-heavy commuter routes (Faizabad Road, Kanpur Road, Sitapur Road) wear suspension components faster than insurer schedules assume. Engine Protector — which covers electrical and electronic damage caused by impact — picks up some of what suspension-only policies don't. The actual suspension itself remains a maintenance cost.",
      },
      {
        title: "PUC enforcement is uneven — but the claim survey isn't",
        body: "On-road PUC enforcement in Lucknow is lighter than NCR. At claim time, though, the surveyor will check PUC validity at the date of the event, and an expired PUC is a legitimate ground for claim reduction. Treat PUC renewal as part of insurance renewal, not a separate task.",
      },
    ],
    verdict:
      "First year of ownership is when the policy choices you make matter most — and Lucknow's roads will test all of them.",
    related: ["delhi-ncr", "jaipur"],
  },
];

export function getCity(slug: string): CityProfile | undefined {
  return CITIES.find((c) => c.slug === slug);
}

/** Resolve `related: ["pune", "ahmedabad"]` to full profile objects.
 *  Skips missing slugs so renaming a city slug doesn't break the
 *  related-cities footer of every other page. */
export function getRelatedCities(slug: string): CityProfile[] {
  const city = getCity(slug);
  if (!city || !city.related) return [];
  return city.related
    .map((s) => getCity(s))
    .filter((c): c is CityProfile => !!c);
}
