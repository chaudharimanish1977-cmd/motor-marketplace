/**
 * Sample reviews — anonymised reference reviews shown on the public
 * /sample-review pages.
 *
 * Three samples cover three customer profiles:
 *
 *   · `pay_less`   — Maruti Swift owner, primary need is premium savings.
 *                    Review surfaces a switch-insurer recommendation.
 *
 *   · `worry_less` — Hyundai Creta owner, primary need is coverage depth.
 *                    Review surfaces missing add-ons (Zero-Dep, Engine
 *                    Protect) and recommends adding before renewal.
 *
 *   · `balanced`   — Honda City owner, the case study used on the home
 *                    page. Review surfaces an undervalued IDV and a
 *                    re-pricing recommendation; insurer stays the same.
 *
 * All numbers are illustrative for marketing purposes — Indian-context
 * but not tied to a real customer. Premiums, vehicle market values, and
 * insurer claim ratios are within rough industry ranges (May 2026).
 */

export type FindingSeverity = "high" | "mid" | "ok";
export type FindingKind = "GAP" | "OK" | "WATCH";
export type CustomerProfile = "pay_less" | "worry_less" | "balanced";
/** Vehicle body type — drives which ink-line sketch the review page
 *  renders as its hero illustration. */
export type BodyType = "hatchback" | "sedan" | "suv";

export interface Finding {
  k: FindingKind;
  label: string;
  detail: string;
  sev: FindingSeverity;
}

export interface SampleReview {
  /** URL slug — also used as the canonical id. */
  slug: string;

  /** Editorial issue number. */
  issueNumber: string;

  /** Profile lens this sample is keyed to. */
  profile: CustomerProfile;
  /** Short human label, used in nav and chip-style filters. */
  profileLabel: string;

  /** "two minutes, fourteen seconds" — narrated audit duration. */
  auditTime: string;

  /** Vehicle identity. */
  vehicle: string;
  year: string;
  city: string;
  insurer: string;
  premium: string;
  /** Body type — picks the hero ink-line sketch on the sample page. */
  bodyType: BodyType;

  /** Out of 100, used for the score badge. */
  score: number;

  /** Headline takeaway, used as the article-style h1. */
  headline: string;
  /** The italic phrase inside the headline that gets the plum accent. */
  headlineHighlight: string;

  /** Lede paragraph — three short sentences narrating the owner's situation. */
  lede: string;

  /** Findings list — the structured part of the review. */
  findings: Finding[];

  /** The plain-English recommendation that closes the review. */
  verdict: {
    headline: string;
    /** The italic phrase inside the verdict h2 (plum accent). */
    headlineHighlight: string;
    body: string;
  };

  /** SEO description used by metadata. */
  seoDescription: string;
}

export const SAMPLE_REVIEWS: SampleReview[] = [
  {
    slug: "maruti-swift",
    issueNumber: "01",
    profile: "pay_less",
    profileLabel: "Pay less",
    auditTime: "one minute, fifty-three seconds",
    vehicle: "Maruti Swift",
    year: "2019",
    city: "Lucknow",
    insurer: "ICICI Lombard General",
    premium: "₹8,420 / yr",
    bodyType: "hatchback",
    score: 58,
    headline:
      "Same cover, two thousand rupees cheaper — without leaving the same insurer.",
    headlineHighlight: "two thousand rupees cheaper",
    lede: "One Lucknow Swift owner. One uploaded PDF. One re-quote that kept the cover identical and dropped the premium by twenty-five percent at renewal.",
    findings: [
      {
        k: "GAP",
        label: "IDV undervalued",
        detail: "₹4.2L declared · market ~₹5.6L",
        sev: "high",
      },
      {
        k: "GAP",
        label: "No Zero-Dep cover",
        detail: "Standard for cars under 5 yrs old",
        sev: "high",
      },
      {
        k: "OK",
        label: "Roadside assistance",
        detail: "Active until renewal",
        sev: "ok",
      },
      {
        k: "WATCH",
        label: "NCB at 25%",
        detail: "Resets if you claim before August",
        sev: "mid",
      },
      {
        k: "OK",
        label: "PA cover for owner",
        detail: "Mandatory · in place",
        sev: "ok",
      },
    ],
    verdict: {
      headline:
        "Re-quote with the same insurer at the correct IDV and add Zero-Dep before renewal.",
      headlineHighlight:
        "re-quote with the same insurer at the correct IDV and add Zero-Dep",
      body: "The owner stayed with ICICI Lombard. The same paperwork, the same hospital network, the same claim process. The new quote at the corrected market value came in ₹2,100 lower than the auto-renewal email he'd already received — and now includes the Zero-Dep cover he didn't know was missing.",
    },
    seoDescription:
      "A real anonymised RightOffer review of a 2019 Maruti Swift policy in Lucknow. Shows how the owner saved ₹2,100/yr without switching insurer — by re-pricing IDV and adding Zero-Dep cover.",
  },
  {
    slug: "hyundai-creta",
    issueNumber: "02",
    profile: "worry_less",
    profileLabel: "Worry less",
    auditTime: "two minutes, eight seconds",
    vehicle: "Hyundai Creta",
    year: "2022",
    city: "Mumbai",
    insurer: "HDFC ERGO General",
    premium: "₹18,900 / yr",
    bodyType: "suv",
    score: 64,
    headline:
      "A monsoon waterlogging claim would have cost this owner eighty thousand rupees out of pocket.",
    headlineHighlight: "eighty thousand rupees out of pocket",
    lede: "One Mumbai Creta owner. One uploaded PDF. Two critical add-ons missing — both standard for an SUV in a city where Andheri floods twice a year.",
    findings: [
      {
        k: "GAP",
        label: "No Engine Protect",
        detail: "Hydrostatic lock claims excluded by default",
        sev: "high",
      },
      {
        k: "GAP",
        label: "No Zero-Dep cover",
        detail: "Depreciation knocks 40-50% off claim payouts at year 3",
        sev: "high",
      },
      {
        k: "WATCH",
        label: "Cashless network gap",
        detail: "Closest authorised garage is 14 km from your PIN",
        sev: "mid",
      },
      {
        k: "OK",
        label: "Roadside assistance",
        detail: "24×7 nationwide · in place",
        sev: "ok",
      },
      {
        k: "OK",
        label: "Consumables cover",
        detail: "Nuts, bolts, lubricants included",
        sev: "ok",
      },
    ],
    verdict: {
      headline:
        "Add Engine Protect and Zero-Dep before the next monsoon — the cost is ₹2,400/yr; the cover is up to ₹4 lakh per claim.",
      headlineHighlight: "the cover is up to ₹4 lakh per claim",
      body: "Mumbai had three waterlogging events last monsoon within 8 km of this owner's home. A single hydrostatic-lock incident on a Creta engine repairs at ₹80,000-1,20,000 — none of it claimable on her current cover. Adding the two add-ons costs less than her monthly fuel bill.",
    },
    seoDescription:
      "A real anonymised RightOffer review of a 2022 Hyundai Creta policy in Mumbai. Shows the two missing add-ons (Engine Protect, Zero-Dep) that would have cost ₹80,000 in a single monsoon claim.",
  },
  {
    slug: "honda-city",
    issueNumber: "03",
    profile: "balanced",
    profileLabel: "Balanced",
    auditTime: "one minute, forty-seven seconds",
    vehicle: "Honda City",
    year: "2021",
    city: "Bengaluru",
    insurer: "Bajaj Allianz General",
    premium: "₹12,840 / yr",
    bodyType: "sedan",
    score: 62,
    headline:
      "An undervalued IDV worth ₹2.4 lakh of cover, hiding in plain sight on page eleven.",
    headlineHighlight: "₹2.4 lakh of cover, hiding in plain sight",
    lede: "One Bengaluru Honda City owner. One uploaded PDF. One re-pricing recommendation that walked her into renewal with ₹2.4 lakh more cover at the same premium.",
    findings: [
      {
        k: "GAP",
        label: "IDV undervalued",
        detail: "₹6.4L declared · market ~₹8.8L",
        sev: "high",
      },
      {
        k: "GAP",
        label: "No Zero-Dep cover",
        detail: "Standard for cars under 5 yrs old",
        sev: "high",
      },
      {
        k: "OK",
        label: "Roadside assistance",
        detail: "Active until renewal",
        sev: "ok",
      },
      {
        k: "WATCH",
        label: "NCB at 25%",
        detail: "Resets if you claim before January",
        sev: "mid",
      },
      {
        k: "OK",
        label: "PA cover for owner",
        detail: "Mandatory · in place",
        sev: "ok",
      },
    ],
    verdict: {
      headline:
        "Re-price the IDV by ₹2.4 lakh and add Zero-Dep cover before renewal.",
      headlineHighlight:
        "re-price the IDV by ₹2.4 lakh and add Zero-Dep cover",
      body: "The owner kept the same insurer. The same premium. She walked away with ₹2.4 lakh more cover than she would have had on auto-renewal — purely from reading a document she'd never have read herself.",
    },
    seoDescription:
      "A real anonymised RightOffer review of a 2021 Honda City policy in Bengaluru. Shows how the owner gained ₹2.4 lakh more cover at the same premium by re-pricing IDV and adding Zero-Dep.",
  },
];

/**
 * Look up a sample review by slug. Returns null when the slug doesn't
 * exist — the route handler should 404 in that case.
 */
export function getSampleReview(slug: string): SampleReview | null {
  return SAMPLE_REVIEWS.find((s) => s.slug === slug) ?? null;
}

/**
 * The two "other" samples to surface at the bottom of a given sample
 * page, in display order.
 */
export function getRelatedSamples(slug: string): SampleReview[] {
  return SAMPLE_REVIEWS.filter((s) => s.slug !== slug);
}
