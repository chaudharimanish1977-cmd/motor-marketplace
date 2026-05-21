/**
 * Core domain types for RightOffer V1.
 * Designed to capture everything in a typical Indian motor policy PDF (modeled on Magma + standard IRDAI format).
 */

// ============================================================================
// Parsed Policy (raw extraction from uploaded PDF)
// ============================================================================

export interface ParsedPolicy {
  id: string;
  uploadedAt: string; // ISO timestamp

  /**
   * What kind of document the customer uploaded.
   *   "policy" = a bound insurance policy (active or expired).
   *   "quote"  = a renewal notice / quotation / proposal — not yet bound.
   *
   * Classifier-supplied at parse time. Optional for backward compat —
   * legacy rows without this field are treated as "policy" everywhere
   * we check.
   */
  documentType?: "policy" | "quote";

  // Policy meta
  policyNumber: string;
  insurerName: string;
  policyType: PolicyType;

  // Coverage period (some bundle policies have different OD vs TP periods)
  odPeriodStart: string; // ISO date
  odPeriodEnd: string;
  tpPeriodStart: string;
  tpPeriodEnd: string;

  // Vehicle
  vehicle: VehicleDetails;

  // Insured Declared Value
  idv: number;

  // No Claim Bonus (% retained from prior year)
  ncbPercent: number;

  // Add-ons (parsed line items from policy)
  addOns: AddOnLine[];

  // Premium breakdown
  premium: PremiumBreakdown;

  // Owner / proposer
  owner: OwnerDetails;

  // Previous policy (for renewals)
  previousPolicy?: PreviousPolicy;

  // Raw text for debugging / re-extraction
  rawText: string;

  // Confidence flags
  parseConfidence: "high" | "medium" | "low";
  parseNotes?: string;

  // Public URL to the original PDF uploaded by the customer (Vercel Blob).
  // Stored so we can re-extract, audit, or surface the source doc later.
  uploadedPdfUrl?: string;
  uploadedPdfFileName?: string;

  /**
   * Timestamp of the most recent "12-month anniversary" email send.
   * Written by /api/cron/annual-reaudit when it nudges a customer
   * around the 1-year mark after upload. Used to dedup: the same
   * policy never fires two anniversary emails in the same year.
   * Optional for backward compat with policies created before this
   * field existed.
   */
  anniversaryEmailedAt?: string;
}

export type PolicyType =
  | "Comprehensive Package"
  | "Third Party Only"
  | "Bundle (1yr OD + 3yr TP)"
  | "Standalone OD"
  | "Other";

export interface VehicleDetails {
  make: string;
  model: string;
  variant: string;
  yearOfManufacture: number;
  fuelType: string; // Petrol / Diesel / CNG / LPG / Electric / Hybrid
  cubicCapacity: number;
  seatingCapacity: number;
  registrationNumber: string;
  rto: string;
  chassisNumber?: string;
  engineNumber?: string;
}

export interface AddOnLine {
  name: string;
  premium: number;
  sumInsured?: number;
}

export interface PremiumBreakdown {
  basicOd: number;
  basicTp: number;
  totalOd: number;
  totalTp: number;
  totalPackage: number; // OD + TP before tax
  cgst: number;
  sgst: number;
  grandTotal: number; // What customer actually paid
}

export interface OwnerDetails {
  name: string;
  mobile: string;
  email?: string;
  address: string;
  pincode?: string;
  city?: string;
  state?: string;
  dob?: string;
  gender?: "M" | "F" | "Other";
}

export interface PreviousPolicy {
  policyNumber: string;
  insurer: string;
  periodStart: string;
  periodEnd: string;
  ncbPercent: number;
}

// ============================================================================
// Generated Policy Report (the 7 sections + 5.5)
// ============================================================================

export interface PolicyReport {
  id: string;
  parsedPolicyId: string;
  generatedAt: string;

  // 7 customer-facing sections + section 5.5 + section 6 (hidden)
  atAGlance: AtAGlanceSection;
  whatCoversWell: ListSection;
  keyGaps: ListSection;
  idvCheck: IdvCheckSection;
  renewalTips: ListSection;
  pricingSnapshot: PricingSnapshotSection; // §5.5
  idealInsurerProfile: InsurerProfileSection; // §6 — HIDDEN FROM CUSTOMER
  keyTakeaway: TakeawaySection;

  // Per-add-on relevance tagging — drives bundle builder defaults + tiered bid composition.
  // Optional for backward compat with reports generated before this field was added.
  addOnRecommendations?: AddOnRecommendation[];

  /**
   * Lowercased emails we've already auto-delivered the PDF to for this
   * report. Read by /report/[id]/page.tsx on every server render: if
   * the customer is verified AND their email isn't in this list, we
   * fire the PDF pipeline once (waitUntil) and push their email here.
   * Prevents re-firing on every page refresh.
   *
   * Optional for backward compat with reports generated before this
   * field was added; treat null/undefined as an empty list.
   */
  emailsSent?: string[];

  // --------------------------------------------------------------------------
  // V2 report fields — unified-template push (Big-4 / consulting-style).
  // The previous report was prose-heavy and rewarded reading. The new layout
  // leads with a scannable table + bottom-line verdict, then the editorial
  // sections sit underneath. These four fields power the new top-of-report
  // sections; the existing prose sections continue to render below as the
  // "detailed report" / annexure body.
  //
  // All optional for backward compat with old reports — they degrade
  // gracefully (skip the new sections, show only the prose).
  // --------------------------------------------------------------------------

  /**
   * Aryan's executive summary at the top of the report. Two parts:
   *   - verdict: the read on the customer's situation (1 sentence)
   *   - action: the recommended next step (1 sentence, visually
   *     highlighted in the rendered banner so the call-to-action
   *     doesn't get lost in flowing prose)
   *
   * Auto-generated by the LLM at report-generation time using the rest
   * of the report as context. Customer reads verdict + action in
   * 5 seconds and knows exactly what to do.
   *
   * Backward compat: older reports stored bottomLine as a plain string.
   * Renderers accept either shape — string is treated as verdict-only.
   */
  bottomLine?:
    | string
    | {
        verdict: string;
        action?: string;
      };

  /**
   * Structured table data for the Coverage Snapshot section. Each row is one
   * feature (IDV, NCB, an add-on, a service area). For single-doc reports
   * the table renders 3 columns (Feature · Value · What this means); for
   * multi-doc comparisons each document becomes a column and the value cell
   * carries the ✓/✗/value for that document.
   *
   * Derived from existing fields (idvCheck, addOnRecommendations, etc.) at
   * report-generation time — no extra LLM call needed for the values; the
   * "what this means" copy comes from existing reasoning strings.
   */
  coverageSnapshot?: CoverageSnapshotRow[];

  /**
   * Per-feature insights, anchored to rows in the Coverage Snapshot table.
   * The reader's eye moves from the table row to the matching insight
   * below. Reuses content from whatCoversWell/keyGaps/renewalTips but
   * reframed as feature-level callouts rather than free-floating paragraphs.
   */
  featureInsights?: FeatureInsight[];

  /**
   * Actionable questions for the customer to ask their insurer, generated
   * specifically for quote-type documents. Empty for bound policies (you
   * can't negotiate a bound policy). LLM-generated using the gaps + RCP
   * delta as context.
   */
  thingsToAsk?: ThingsToAskItem[];
}

/**
 * One row in the Coverage Snapshot table. Categories drive grouping +
 * default sort order (core fields first, then add-ons, then service).
 */
export interface CoverageSnapshotRow {
  /** Display label, e.g. "Engine Protector", "IDV", "No-Claim Bonus". */
  feature: string;
  /** Row grouping; affects sort + visual treatment.
   *  - "anchor"  → IDV, NCB, premium (always shown first, no tick mark)
   *  - "addon"   → Zero Dep, Engine Protector, RTI, etc.
   *  - "service" → RSA, cashless network, claim ratio */
  category: "anchor" | "addon" | "service";
  /** Display value for this cell. "✓", "✗", or a formatted scalar like
   *  "₹8.5L", "50% NCB", "Bumper-to-bumper". */
  value: string;
  /** Visual treatment for the cell — green / amber / red / neutral.
   *  Drives colour-coded scanning. */
  status: "good" | "warn" | "missing" | "neutral";
  /** For single-doc reports — the "What this means" column copy.
   *  Empty string for multi-doc reports (comparison alone carries the
   *  meaning; this column hides). */
  whatThisMeans: string;
  /** RightOffer's recommendation for THIS feature on this customer's
   *  profile. Drives the "Recommended" column in the table so the
   *  customer sees not just what's present, but what they should
   *  prioritise.
   *  - "must-have"     → recommended; pursue if missing (red attention)
   *  - "good-to-have"  → optional; worth considering (amber)
   *  - "may-have"      → not strictly needed for this profile (slate)
   *  - undefined       → no recommendation (anchor rows like IDV / NCB) */
  recommendation?: "must-have" | "good-to-have" | "may-have";
}

/**
 * Per-feature insight body. Same `feature` string as the table row so
 * the renderer can anchor them by name.
 */
export interface FeatureInsight {
  /** Matches a CoverageSnapshotRow.feature. */
  feature: string;
  /** Aryan-voice insight. 1-3 sentences. */
  body: string;
  /** Optional "found in §X of the policy" trail. */
  evidence?: string;
}

/**
 * Actionable item for the customer to ask their insurer (quote-only).
 */
export interface ThingsToAskItem {
  /** Insurer name the question is directed at, e.g. "Acko". */
  insurer: string;
  /** Question / ask. Direct, specific, customer can copy-paste.
   *  Examples:
   *    "Can you match the RTI add-on (~₹500/yr)? My current policy has it."
   *    "What's the engine sub-limit on Engine Protector?" */
  ask: string;
  /** Optional brief reasoning the customer can use as context. */
  reasoning?: string;
}

/**
 * Relevance judgment per add-on for THIS customer profile.
 * - "essential": missing/worth-having for this profile, pre-select in bundle, include in all tiers
 * - "optional": nice to have, pre-select if affordable, include in tier 3 only
 * - "drop": present in current policy but not relevant for this customer (e.g., Loss of Personal
 *   Belongings on a basic vehicle). Pre-uncheck and surface savings hint to customer.
 */
export interface AddOnRecommendation {
  name: string; // canonical add-on name (matches catalogue)
  isInCurrentPolicy: boolean;
  recommendation: "essential" | "optional" | "drop";
  reasoning: string; // 1 sentence why (vehicle/profile-specific)
  estimatedAnnualPremium: number; // rough INR estimate for UI sorting
}

export interface AtAGlanceSection {
  policyPeriodLabel: string; // human-readable
  vehicleLabel: string;
  idv: number;
  ncbPercent: number;
  policyTypeLabel: string;
}

export interface ListItem {
  title: string;
  description: string;
  iconHint?: string; // semantic hint for UI to pick an icon
}

export interface ListSection {
  items: ListItem[];
}

export interface IdvCheckSection {
  currentIdv: number;
  assessment: "appropriate" | "low" | "high";
  whatToDo: string[];
  tip: string;
}

export interface PricingSnapshotSection {
  currentPremium: number;
  recommendedRangeMin: number;
  recommendedRangeMax: number;
  hasPremiumSavings: boolean;
  estimatedSavings?: number; // if hasPremiumSavings
  narrative: string; // savings narrative OR claim-time savings reinforcement
  claimTimeExample?: string; // illustrative example to drive home value
}

export interface InsurerProfileSection {
  // HIDDEN from customer-facing report; used only for backend insurer matching
  recommendedInsurers: {
    name: string;
    reasoning: string;
  }[];
  selectionCriteria: string[];
}

export interface TakeawaySection {
  headline: string;
  body: string;
  cta: string;
}

// ============================================================================
// User & Session
// ============================================================================

export interface User {
  id: string;
  mobile: string;
  email?: string;
  createdAt: string;
  dpdpConsentGivenAt?: string;
  /**
   * Customer's preferred first / display name. Populated automatically
   * by Google / Apple OAuth signins (from the provider profile).
   * Optional for OTP-only signups where we don't ask. Used for the
   * editorial welcome panel + future personalised email subjects.
   */
  name?: string;
  /**
   * Timestamp the customer first dismissed the editorial welcome
   * panel on /me. Unset means the customer has never seen the
   * onboarding; setting it permanently hides the panel for that
   * user. See /api/me/onboarding/done + MeOnboardingPanel.
   */
  meOnboardedAt?: string;
}

/**
 * Public, depersonalized share token for a report (Phase 7d.3).
 *
 * Customers can mint a share link to forward their audit to friends /
 * family. The recipient sees a stripped-down preview (vehicle profile,
 * verdict, at-risk number, top gaps) — never the owner name, plate,
 * email, mobile, or address. The token is the only thing on the URL.
 *
 * `revoked` lets the owner kill a share link without losing analytics
 * (we keep the row so we can show the customer "this link was revoked
 * on…" if they ever care).
 */
export interface ShareToken {
  /** Opaque, URL-safe ID surfaced on /share/[token]. */
  id: string;
  /** ParsedPolicy ID the token resolves to. */
  parsedPolicyId: string;
  /** Lowercased email of the customer who minted it (for revocation
   *  control + audit). */
  ownerEmail: string;
  createdAt: string;
  /** Visit counter — incremented on /share/[token] page load. Lets
   *  the customer see "this link was viewed N times" in /me later. */
  viewCount: number;
  revoked: boolean;
}

// ============================================================================
// Bidding (RFQ → Bid → Transaction)
// ============================================================================

export interface RFQ {
  id: string;
  parsedPolicyId: string;
  reportId: string;
  userId?: string;
  createdAt: string;

  // The curated bundle the customer wants quoted (their final selections)
  desiredAddOns: string[];
  desiredIdv: number;

  // Risk disclosure
  hasPreExistingClaim: boolean;
  preExistingClaimDetails?: string;
}

export type BidTier = 1 | 2 | 3;

export interface Bid {
  id: string;
  rfqId: string;
  insurerName: string; // synthetic persona name
  insurerTagline: string;
  insurerStrengths: string[];

  // Pricing
  basicOd: number;
  basicTp: number;
  addOnPremium: number;
  totalPackage: number;
  cgst: number;
  sgst: number;
  grandTotal: number;

  // Differentiators
  garageNetworkSize: string;
  claimSettlementRatio: string;
  uniqueSellingPoint: string;

  // Tier classification (each tier has its own auction with 3 insurers)
  tier: BidTier;
  tierLabel: string; // "Same-Price" | "Comfort+" | "Super Cover"
  tierTagline: string;
  tierIncludedAddOns: string[];

  // Outcome — winner is per-tier (cheapest of 3 insurers within the tier)
  isWinner: boolean;
  rank: number; // rank within tier (1, 2, 3)
  receivedAt: string;
}

/**
 * Tier-level metadata returned alongside the bid array. Used to render the
 * 3 horizontal tier cards on the results page.
 */
export interface TierSummary {
  tier: BidTier;
  label: string;
  tagline: string;
  available: boolean;
  unavailableReason?: string;
  includedAddOns: string[];
  bids: Bid[]; // 3 bids for this tier (if available); empty if unavailable
}

export interface Transaction {
  id: string;
  rfqId: string;
  bidId: string;
  userId: string;
  status: "kyc_pending" | "payment_pending" | "issued";
  policyDocUrl?: string;
  createdAt: string;
  issuedAt?: string;
}

// ============================================================================
// Renewal Schedule (preview of cadence)
// ============================================================================

export interface RenewalNudge {
  id: string;
  triggerType:
    | "60_day_pre"
    | "30_day_pre"
    | "15_day_pre"
    | "7_day_pre"
    | "1_day_pre"
    | "expiry_day"
    | "post_expiry_7"
    | "post_expiry_30"
    | "lapsed_recovery";
  scheduledDate: string;
  channel: "email" | "sms" | "telegram" | "whatsapp";
  subject: string;
  bodyPreview: string;
}

export interface RenewalSchedule {
  id: string;
  parsedPolicyId: string;
  policyExpiryDate: string;
  nudges: RenewalNudge[];
  generatedAt: string;
}

/**
 * Customer-opted-in renewal reminder subscription.
 *
 * Captured on /thank-you when the customer agrees to renewal nudges.
 * A daily cron (built later) reads from here, checks if today falls in the
 * pre-expiry window (e.g. T-60 / T-30 / T-7), and fires email + WhatsApp.
 */
export interface RenewalSubscription {
  id: string;
  parsedPolicyId: string;
  customerEmail: string;
  customerMobile: string;
  /** Channels the customer agreed to. */
  channels: ("email" | "whatsapp")[];
  /** ISO date — derived from parsedPolicy.odPeriodEnd at subscribe time. */
  policyExpiryDate: string;
  /** Which N-days-before checkpoints to fire reminders on (e.g. [60, 30, 7]). */
  daysBefore: number[];
  /** Hour of day in IST (0–23) to fire the reminder. Default 10. */
  reminderHourIst: number;
  status: "active" | "unsubscribed";
  createdAt: string;
  /** When the cron last sent a reminder (so we don't double-fire). */
  lastNudgedAt?: string;
  /**
   * Which `daysBefore` checkpoints have already fired for this subscription.
   * Each checkpoint fires at most once — e.g. if the customer subscribed
   * with [60, 30, 7] and we've already sent the 60-day nudge, this field
   * holds `[60]`. The cron skips a checkpoint if it's listed here.
   */
  nudgesFired?: number[];
  /** ISO timestamp when the customer clicked the one-click unsubscribe link. */
  unsubscribedAt?: string;
}

// ============================================================================
// Comparison Report — the Right Offer comparator output
// ============================================================================

/**
 * A persistent record of a Right Offer comparison run.
 *
 * Created when the customer triggers the comparator on a set of
 * uploaded documents (policy + N quotes, or quotes alone). Captures
 * inputs, computed RCP, scored quotes, auction results (when M4
 * lands), and the final verdict — so the customer can come back via
 * /me and re-view it, and so we accumulate the dataset moat.
 */
export interface ComparisonReport {
  id: string;
  /** Lowercased session email — primary owner key (matches /me filtering). */
  customerEmail: string;
  /** Human label for the vehicle, e.g. "Hyundai Verna". */
  vehicleLabel: string;
  /** Optional — the policy that anchored this comparison (Feature 3). */
  policyId?: string;
  /** Parsed-policy IDs of the uploaded quotes being compared. */
  quoteIds: string[];
  /** RCP captured at comparison time (snapshot — doesn't drift if the
   *  policy report regenerates later). */
  rcp: ComparisonRcpSnapshot;
  /** Scoring of each quote against the RCP. */
  quoteScores: ComparisonQuoteScore[];
  /** Linked RFQ/Bid IDs once M4 wires the auction in. */
  rfqId?: string;
  bidIds?: string[];
  /** Final verdict. */
  verdict: ComparisonVerdict;
  /** Has the customer chosen to reserve a recommended option? */
  reservedAt?: string;
  reservedOption?: ComparisonReservedOption;
  createdAt: string;
  updatedAt: string;
}

/**
 * Snapshot of the RCP at comparison time. Stored inline so the
 * comparison stays stable even if the underlying report changes.
 */
export interface ComparisonRcpSnapshot {
  requiredAddOns: Array<{
    name: string;
    why: string;
    estimatedAnnualPremium: number;
  }>;
  optionalAddOns: Array<{
    name: string;
    why: string;
    estimatedAnnualPremium: number;
  }>;
  idv: { current: number; assessment: "appropriate" | "low" | "high"; note: string };
  requiredAddOnsPremiumTotal: number;
}

/**
 * One uploaded quote's score against the RCP at comparison time.
 */
export interface ComparisonQuoteScore {
  quoteId: string;
  insurerName: string;
  grandTotal: number;
  /** RCP items the quote lacks. */
  missingRequired: string[];
  /** Add-ons the quote includes that aren't in the RCP (over-coverage). */
  extraNonRcp: string[];
  isRcpComplete: boolean;
  isExactlyRcp: boolean;
}

export type ComparisonVerdictType =
  /** Customer's best quote is the Right Offer. Tell them to take it. */
  | "take_existing"
  /** Our offer beats / fills the gap. We pitch. */
  | "rightoffer_pitch"
  /** Neither customer's quotes nor our offer hit the bar. Customer should
   *  ask their insurer to add the missing RCP items, or wait for our
   *  auction (M4) to run. */
  | "needs_attention";

export interface ComparisonVerdict {
  type: ComparisonVerdictType;
  /** Plain-English headline shown at the top of the comparison page. */
  headline: string;
  /** Body paragraph(s) explaining the reasoning. */
  body: string;
  /** Quote ID or bid ID being recommended — null when "needs_attention". */
  recommendedQuoteId?: string;
  recommendedBidId?: string;
}

/**
 * The customer's chosen "reserve this offer" pick, persisted on the
 * comparison so the /me portal can show conversion intent.
 */
export interface ComparisonReservedOption {
  source: "customer_quote" | "rightoffer_bid";
  refId: string;
}
