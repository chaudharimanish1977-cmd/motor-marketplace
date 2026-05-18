/**
 * Insight types — the data shape for RightOffer's continuous engagement
 * layer (the "living report" stream).
 *
 * Each Insight is a small, editorial piece of content that targets a
 * specific cohort of customers based on their parsed-policy facts and
 * driving profile. Insights live in the customer's /me/insights feed
 * AND surface subtly inline within /report/[id] when they tie to a
 * specific section of the audit.
 *
 * Authoring model (v1): insights are TypeScript modules in
 * src/content/insights/*. Each module default-exports an Insight
 * object. The whole catalogue is imported and indexed at build time.
 *
 * Why TypeScript not markdown frontmatter: typed audience targeting
 * catches mismatched tags at compile time, body HTML stays explicit,
 * no parser dependency. Trade-off: less friendly for non-engineers
 * to write, but at the prototype stage the founder is the author.
 * Easy to swap to MDX or CMS-backed later.
 */

import type { ParsedPolicy } from "@/lib/types";
import type { DrivingProfile } from "@/components/driving-profile-card";

/**
 * Audience targeting — a customer matches an insight when EVERY
 * specified condition holds. Unspecified conditions are ignored.
 * Reuses the same vocabulary the audit-checks engine already
 * understands (industry-benchmarks.ts VehicleContext).
 */
export interface InsightAudience {
  /** Customer's policy must be MISSING all of these add-ons (i.e.
   *  customer has the gap). Canonical names — same vocabulary as
   *  audit-checks.ts. */
  missingAddOns?: CanonicalAddOn[];
  /** Customer's policy must HAVE all of these add-ons (i.e. no
   *  gap on these). Inverse of missingAddOns. */
  hasAddOns?: CanonicalAddOn[];

  /** Vehicle fuel-type filter. */
  isCngOrLpg?: boolean;
  /** RTO city in flood-prone metros (Mumbai, Kalyan, Thane, Chennai,
   *  Kolkata, Kochi, Bengaluru, Hyderabad, Gurgaon). */
  isFloodProneCity?: boolean;
  /** Premium / smart-key vehicle (BMW, Mercedes, Audi, etc.). */
  hasSmartKey?: boolean;

  /** Inclusive vehicle-age bounds. */
  minVehicleAge?: number;
  maxVehicleAge?: number;

  /** Inclusive NCB bounds. */
  minNcbPercent?: number;
  maxNcbPercent?: number;

  /** Customer's reported claim history (from driving profile). */
  pastClaims?: ("none" | "once" | "frequent")[];
  /** Customer's stated priority lens (from driving profile). */
  priority?: ("Pay less" | "Worry less" | "Both matter")[];
  /** Customer's household car count (from driving profile). */
  otherCars?: ("Only this" | "1 more" | "2–3" | "4+")[];
}

export type CanonicalAddOn =
  | "Zero Depreciation"
  | "Engine Protector"
  | "Return to Invoice"
  | "Roadside Assistance"
  | "NCB Protection"
  | "Consumables"
  | "Key Replacement"
  | "Loss of Personal Belongings";

/**
 * Where in /report/[id] this insight should surface inline, if
 * anywhere. Insights with `reportAttach: null` live only in the
 * /me/insights feed.
 *
 * Currently supported attachment points:
 *   - { section: "gaps", gap: <canonical> } — appears as a small
 *     note inside the matching gap card in §02
 *   - { section: "renewal" } — appears inside §03 At Renewal
 *   - { section: "summary" } — appears at the top of the report
 *     summary (above §01)
 */
export type InsightReportAttach =
  | { section: "gaps"; gap: CanonicalAddOn }
  | { section: "renewal" }
  | { section: "summary" }
  | null;

export interface Insight {
  /** Stable identifier — URL-safe slug. Used in the feed URL and as
   *  the de-duplication key for "have we shown this to the customer
   *  already". */
  id: string;
  /** Editorial title — serif, sentence case, no period. */
  title: string;
  /** One-line summary used in the feed list view + the discovery
   *  line at the top of §02 ("3 updates since you last visited"). */
  oneLiner: string;
  /** Body HTML. Plain paragraphs + <strong>/<em>/<a> only, no
   *  custom components — keeps the surface portable to PDF render
   *  and email digest later. */
  body: string;
  /** ISO date the insight was published. Drives sort order in the
   *  feed (newest first) and the "since last visit" discovery line. */
  publishedAt: string;
  /** When true, the insight fires immediately on author (urgent
   *  digest break). When false (default), it's queued for the next
   *  monthly digest. */
  urgent?: boolean;
  /** Targeting filter. */
  audience: InsightAudience;
  /** Optional inline attachment point in /report/[id]. */
  reportAttach: InsightReportAttach;
  /** Kicker word shown above the title in the feed (e.g. "Monsoon
   *  watch", "Market move", "Maintenance"). Editorial mono kicker. */
  kicker: string;
}

/**
 * Snapshot of customer facts the matcher reads. Built once per
 * /me/insights or /report/[id] render from the customer's parsed
 * policy + driving profile, then passed into matchInsight() for
 * each candidate insight.
 */
export interface CustomerContext {
  vehicleAge: number;
  isCngOrLpg: boolean;
  isFloodProneCity: boolean;
  hasSmartKey: boolean;
  ncbPercent: number;
  /** Canonical add-on names the customer's policy includes. Computed
   *  from ParsedPolicy.addOns via the same fuzzy matcher the audit
   *  uses for gap detection. */
  presentAddOns: Set<CanonicalAddOn>;
  /** Canonical add-on names the customer's policy is MISSING — the
   *  complement of presentAddOns within the canonical universe. */
  missingAddOns: Set<CanonicalAddOn>;
  /** Driving-profile signals — pass-through from the survey answers. */
  pastClaimsBucket: "none" | "once" | "frequent" | null;
  priority: string | null;
  otherCars: string | null;
}

/**
 * Re-export for ergonomics — consumers building a CustomerContext
 * often need ParsedPolicy / DrivingProfile too.
 */
export type { ParsedPolicy, DrivingProfile };
