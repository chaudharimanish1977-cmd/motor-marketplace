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
  status: "active" | "unsubscribed";
  createdAt: string;
  /** When the cron last sent a reminder (so we don't double-fire). */
  lastNudgedAt?: string;
}
