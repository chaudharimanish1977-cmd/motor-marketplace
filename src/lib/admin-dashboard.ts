/**
 * Admin dashboard snapshot compute.
 *
 * Reads PARSED_POLICIES + REPORTS + USERS + RENEWAL_SUBSCRIPTIONS in
 * parallel, then aggregates all 10 dashboard categories into one
 * structured snapshot object. Writes once to KV (singleton id="latest")
 * so the /admin/dashboard page reads pre-computed data and renders
 * instantly. Caller decides when to re-compute (cron every 3h between
 * 9am-9pm IST, manual refresh button on the page).
 *
 * Placeholder fields are tagged with a `*Placeholder: true` flag so the
 * UI can render "coming soon" badges for categories gated on
 * instrumentation we haven't shipped yet (PostHog funnel, processing
 * timings, customer ratings).
 */

import {
  readTable,
  Tables,
} from "@/lib/db";
import type {
  AdminDashboardSnapshot,
  ParsedPolicy,
  PolicyReport,
  RenewalSubscription,
  User,
} from "@/lib/types";
import { vehicleKey } from "@/lib/policy-group";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Compute the full snapshot from current KV state. */
export async function computeAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const t0 = Date.now();

  // Pull the four primary tables in parallel. Each is bounded — current
  // scale is well under the 1k-row threshold where pagination becomes
  // necessary.
  const [parsedPolicies, reports, users, renewalSubs] = await Promise.all([
    readTable<ParsedPolicy>(Tables.PARSED_POLICIES),
    readTable<PolicyReport>(Tables.REPORTS),
    readTable<User>(Tables.USERS),
    readTable<RenewalSubscription>(Tables.RENEWAL_SUBSCRIPTIONS),
  ]);

  const now = Date.now();
  const cutoff7d = now - 7 * DAY_MS;
  const cutoff30d = now - 30 * DAY_MS;

  // ── Index reports by parsedPolicyId for O(1) lookup ───────────────
  const reportByPolicyId = new Map<string, PolicyReport>();
  for (const r of reports) reportByPolicyId.set(r.parsedPolicyId, r);

  // ── 1. Top-line volume ────────────────────────────────────────────
  const audits7d = parsedPolicies.filter(
    (p) => Date.parse(p.uploadedAt) >= cutoff7d
  ).length;
  const audits30d = parsedPolicies.filter(
    (p) => Date.parse(p.uploadedAt) >= cutoff30d
  ).length;
  const perDay30d = buildPerDay30d(parsedPolicies, now);

  // Customers with 2+ ParsedPolicy rows (group by owner.email,
  // falling back to owner.mobile when email missing).
  const customerKeyCount = new Map<string, number>();
  for (const p of parsedPolicies) {
    const key = (p.owner?.email || p.owner?.mobile || "").toLowerCase().trim();
    if (!key) continue;
    customerKeyCount.set(key, (customerKeyCount.get(key) ?? 0) + 1);
  }
  const multiAuditCustomers = Array.from(customerKeyCount.values()).filter(
    (n) => n >= 2
  ).length;

  // Distinct vehicles by vehicleKey (registration first, fallback m/m/year/rto).
  const uniqueVehiclesSet = new Set<string>();
  for (const p of parsedPolicies) {
    uniqueVehiclesSet.add(vehicleKey(p));
  }

  // ── 2. Coverage breadth ───────────────────────────────────────────
  // Insurers — canonicalised so "Tata AIG" and "Tata AIG General
  // Insurance Company Limited" merge into one bucket.
  const insurerAgg = aggregateBy(parsedPolicies, (p) =>
    canonicalizeInsurer(p.insurerName ?? "")
  );
  const topInsurers = topN(insurerAgg, 10);

  // Vehicle makes — Maruti, Honda, Tata, etc. Separate from make+model
  // breakdown beneath.
  const makeAgg = aggregateBy(parsedPolicies, (p) =>
    canonicalizeMake(p.vehicle?.make ?? "")
  );
  const topMakes = topN(makeAgg, 10);

  // Make+Model combinations (the granular breakdown).
  const mmAgg = aggregateBy(parsedPolicies, (p) =>
    canonicalizeMakeModel(p.vehicle?.make ?? "", p.vehicle?.model ?? "")
  );
  const topMakeModels = topN(mmAgg, 10);

  // RTOs — canonicalised (strip whitespace + hyphens, uppercase).
  const rtoAgg = aggregateBy(parsedPolicies, (p) =>
    canonicalizeRto(p.vehicle?.rto ?? "")
  );
  const topRtos = topN(rtoAgg, 10).map(({ name, count }) => ({
    rto: name,
    count,
  }));

  // Policy vintage range — min/max odPeriodEnd.
  let oldestExpiry: string | null = null;
  let newestExpiry: string | null = null;
  for (const p of parsedPolicies) {
    if (!p.odPeriodEnd) continue;
    if (!oldestExpiry || p.odPeriodEnd < oldestExpiry) oldestExpiry = p.odPeriodEnd;
    if (!newestExpiry || p.odPeriodEnd > newestExpiry) newestExpiry = p.odPeriodEnd;
  }

  let policyCount = 0;
  let quoteCount = 0;
  for (const p of parsedPolicies) {
    const t = p.documentType ?? "policy";
    if (t === "quote") quoteCount++;
    else policyCount++;
  }

  // ── 3. Audit content insights ─────────────────────────────────────
  // Gap categories from report.keyGaps.items[].title — canonicalised so
  // "Zero Depreciation Cover Missing", "Zero Depreciation Not Available",
  // "Zero Dep Missing" all merge into one "Zero Depreciation" bucket.
  const gapAggMap = new Map<string, { display: string; count: number }>();
  let totalGapItems = 0;
  let reportsWithGaps = 0;
  for (const r of reports) {
    const gaps = r.keyGaps?.items ?? [];
    if (gaps.length > 0) reportsWithGaps++;
    for (const g of gaps) {
      const { key, display } = canonicalizeGap(g.title ?? "");
      if (!key) continue;
      const cur = gapAggMap.get(key) ?? { display, count: 0 };
      cur.count++;
      gapAggMap.set(key, cur);
      totalGapItems++;
    }
  }
  const avgGapsPerPolicy =
    reportsWithGaps > 0 ? totalGapItems / reportsWithGaps : 0;
  const topGapCategories = Array.from(gapAggMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(({ display, count }) => ({ category: display, count }));

  // Coverage-score distribution — placeholder when scoreless reports
  // dominate. (We have a band per report only when CoverageScore was
  // computed; older reports lack it.)
  const coverageScoreDist = {
    excellent: 0,
    good: 0,
    belowAverage: 0,
    critical: 0,
    uncategorized: 0,
  };
  // CoverageScore field isn't on the type today — count all as
  // uncategorized + flag placeholder. Wire when CoverageScore lands
  // on PolicyReport directly.
  for (const _r of reports) {
    void _r;
    coverageScoreDist.uncategorized++;
  }

  // Median IDV + premium across parsed policies.
  const idvValues = parsedPolicies
    .map((p) => p.idv)
    .filter((n): n is number => typeof n === "number" && n > 0)
    .sort((a, b) => a - b);
  const premiumValues = parsedPolicies
    .map((p) => p.premium?.grandTotal)
    .filter((n): n is number => typeof n === "number" && n > 0)
    .sort((a, b) => a - b);
  const medianIdv = median(idvValues);
  const medianPremium = median(premiumValues);

  // Total at-risk: derived from estimated saved-add-on premiums in
  // addOnRecommendations[?recommendation="essential" && !isInCurrentPolicy].
  // Each missing essential add-on's estimatedAnnualPremium contributes
  // to the at-risk number. Not perfect — but a defensible proxy until
  // we ship an explicit at-risk computation.
  let totalAtRisk = 0;
  let atRiskCounted = false;
  for (const r of reports) {
    const recs = r.addOnRecommendations ?? [];
    for (const rec of recs) {
      if (rec.recommendation === "essential" && !rec.isInCurrentPolicy) {
        totalAtRisk += rec.estimatedAnnualPremium || 0;
        atRiskCounted = true;
      }
    }
  }

  // ── 4. Customer signal ────────────────────────────────────────────
  // Ratings — not yet captured in a dedicated table; flag placeholder.
  // When we wire ratings (probably from /thank-you feedback or /me
  // post-audit), this section becomes real.
  const ratingDistribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } as const;

  // Renewal opt-in rate — % of customers (by email) who have at least
  // one active RenewalSubscription.
  const subscribedCustomers = new Set<string>();
  for (const s of renewalSubs) {
    if (s.status === "active") {
      subscribedCustomers.add((s.customerEmail ?? "").toLowerCase().trim());
    }
  }
  const renewalOptInRate =
    customerKeyCount.size > 0
      ? (subscribedCustomers.size / customerKeyCount.size) * 100
      : 0;

  const returningCustomerRate =
    customerKeyCount.size > 0
      ? (multiAuditCustomers / customerKeyCount.size) * 100
      : 0;

  // ── 5. Channel mix ────────────────────────────────────────────────
  // Use the ParsedPolicy.source field stamped by audit-pipeline at parse
  // time. Legacy rows without the field count as "unknown" — those will
  // shrink to 0 as old data ages out.
  let webUpload = 0;
  let emailForward = 0;
  let unknownChannel = 0;
  for (const p of parsedPolicies) {
    const src = p.source ?? "unknown";
    if (src === "web-upload") webUpload++;
    else if (src === "email-forward") emailForward++;
    else unknownChannel++;
  }

  // Multi-doc forwards: cluster forwards by (owner email, uploadedAt
  // within 30-min window). Count clusters with 2+ docs. Only counts
  // policies where source === "email-forward" (the new stamped field);
  // unknown-source legacy rows are excluded so the number reflects
  // real forward batches, not all multi-upload bursts.
  const forwardsByOwner = new Map<string, ParsedPolicy[]>();
  for (const p of parsedPolicies) {
    if (p.source !== "email-forward") continue;
    const key = (p.owner?.email ?? "").toLowerCase().trim();
    if (!key) continue;
    const arr = forwardsByOwner.get(key) ?? [];
    arr.push(p);
    forwardsByOwner.set(key, arr);
  }
  let multiDocForwards = 0;
  let multiVehicleForwards = 0;
  const forwardBatchesByOwner = new Map<string, number>(); // for forwardTrust
  for (const [owner, ps] of forwardsByOwner.entries()) {
    const sorted = ps
      .slice()
      .sort(
        (a, b) =>
          Date.parse(a.uploadedAt || "0") - Date.parse(b.uploadedAt || "0")
      );
    let batches = 0;
    let currentBatch: ParsedPolicy[] = [];
    let lastTs = -Infinity;
    const WINDOW_MS = 30 * 60 * 1000;
    const flush = () => {
      if (currentBatch.length === 0) return;
      batches++;
      if (currentBatch.length >= 2) {
        multiDocForwards++;
        const distinctVehicles = new Set(currentBatch.map((c) => vehicleKey(c)));
        if (distinctVehicles.size >= 2) multiVehicleForwards++;
      }
    };
    for (const p of sorted) {
      const ts = Date.parse(p.uploadedAt || "0");
      if (ts - lastTs > WINDOW_MS) {
        flush();
        currentBatch = [p];
      } else {
        currentBatch.push(p);
      }
      lastTs = ts;
    }
    flush();
    forwardBatchesByOwner.set(owner, batches);
  }

  // ── 6. Operational health ─────────────────────────────────────────
  // Processing timing isn't persisted on ParsedPolicy today.
  // Placeholder until we instrument durations.

  // ── 8. Editorial product engagement ───────────────────────────────
  // drivingProfile from MidLoadQuestions isn't persisted either —
  // it's threaded through report URL query params at view time.
  // Placeholder.

  // ── 9. Forward-channel trust ──────────────────────────────────────
  let customersWith2PlusForwards = 0;
  let customersWith3PlusForwards = 0;
  for (const batches of forwardBatchesByOwner.values()) {
    if (batches >= 2) customersWith2PlusForwards++;
    if (batches >= 3) customersWith3PlusForwards++;
  }

  // ── 10. DPDP compliance ───────────────────────────────────────────
  const consentedCustomers = users.filter((u) => !!u.dpdpConsentGivenAt).length;
  const activeSubscriptions = renewalSubs.filter(
    (s) => s.status === "active"
  ).length;
  const unsubscribedSubscriptions = renewalSubs.filter(
    (s) => s.status === "unsubscribed"
  ).length;

  const computedAt = new Date().toISOString();
  const computedDurationMs = Date.now() - t0;

  return {
    id: "latest",
    computedAt,
    computedDurationMs,
    volume: {
      totalAudits: parsedPolicies.length,
      audits7d,
      audits30d,
      perDay30d,
      totalCustomers: users.length,
      multiAuditCustomers,
      uniqueVehicles: uniqueVehiclesSet.size,
    },
    breadth: {
      insurerCount: insurerAgg.size,
      topInsurers,
      makeCount: makeAgg.size,
      topMakes,
      makeModelCount: mmAgg.size,
      topMakeModels,
      rtoCount: rtoAgg.size,
      topRtos,
      oldestExpiry,
      newestExpiry,
      policyCount,
      quoteCount,
    },
    content: {
      totalAtRiskInr: totalAtRisk,
      atRiskInrPlaceholder: !atRiskCounted,
      avgGapsPerPolicy,
      topGapCategories,
      coverageScoreDistribution: coverageScoreDist,
      coverageScorePlaceholder: true,
      medianIdv,
      medianPremium,
    },
    signal: {
      avgRating: null,
      ratingDistribution,
      totalRatings: 0,
      ratingPlaceholder: true,
      renewalOptInRate,
      returningCustomerRate,
    },
    channels: {
      webUpload,
      emailForward,
      unknownChannel,
      whatsappShareback: 0,
      whatsappShareBackPlaceholder: true,
      multiDocForwards,
      multiVehicleForwards,
    },
    ops: {
      p50AuditMs: null,
      p90AuditMs: null,
      timingsPlaceholder: true,
      auditSuccessRate: null,
      successRatePlaceholder: true,
      lastDashboardComputeAt: computedAt,
      sentryEvents7d: null,
      sentryPlaceholder: true,
    },
    funnel: {
      placeholder: true,
      note: "Coming after PostHog instrumentation (H1)",
    },
    editorialEngagement: {
      midLoadQuestionsAnswered: 0,
      placeholder: true,
    },
    forwardTrust: {
      customersWith2PlusForwards,
      customersWith3PlusForwards,
    },
    dpdp: {
      consentedCustomers,
      activeSubscriptions,
      unsubscribedSubscriptions,
      deletionRequestsHandled: 0,
      deletionPlaceholder: true,
    },
  };
}

// ============================================================================
// Canonicalisation helpers
//
// Each helper returns { key, display } — the `key` is the normalised
// bucket for counting/grouping, the `display` is the title-cased form
// to show in the dashboard UI. Aggregators keep the first non-empty
// `display` seen per key so the UI matches the data shape customers
// actually wrote.
// ============================================================================

interface Canonical {
  key: string;
  display: string;
}

const INSURER_SUFFIX_RE =
  /\b(general|insurance|company|co|limited|ltd|pvt|private|india|ins|gic)\b/g;

function canonicalizeInsurer(raw: string): Canonical {
  if (!raw) return { key: "(unknown)", display: "(unknown)" };
  const stripped = raw
    .toLowerCase()
    .replace(INSURER_SUFFIX_RE, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (!stripped) return { key: "(unknown)", display: "(unknown)" };
  return { key: stripped, display: titleCase(stripped) };
}

const MAKE_ALIASES: Record<string, string> = {
  "maruti suzuki": "maruti",
  "suzuki maruti": "maruti",
  "tata motors": "tata",
  "tata motor": "tata",
  "mahindra mahindra": "mahindra",
  "mercedes benz": "mercedes",
  "mercedes-benz": "mercedes",
  "land rover": "land rover",
  "rolls royce": "rolls royce",
  "mg motor": "mg",
  "mg motors": "mg",
};

function canonicalizeMake(raw: string): Canonical {
  if (!raw) return { key: "(unknown)", display: "(unknown)" };
  const stripped = raw
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (!stripped) return { key: "(unknown)", display: "(unknown)" };
  const aliased = MAKE_ALIASES[stripped] ?? stripped;
  return { key: aliased, display: titleCase(aliased) };
}

function canonicalizeMakeModel(make: string, model: string): Canonical {
  const m = canonicalizeMake(make);
  const mod = (model ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (m.key === "(unknown)" && !mod) {
    return { key: "(unknown)", display: "(unknown)" };
  }
  const key = `${m.key}::${mod}`;
  return {
    key,
    display: `${m.display}${mod ? " " + titleCase(mod) : ""}`,
  };
}

function canonicalizeRto(raw: string): Canonical {
  if (!raw) return { key: "(unknown)", display: "(unknown)" };
  // RTO formats vary widely: "MH 02", "MH-02", "MH02", "MH 12 BC".
  // Normalise to alphanumeric uppercase with no spaces or hyphens.
  const stripped = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!stripped) return { key: "(unknown)", display: "(unknown)" };
  return { key: stripped, display: stripped };
}

const GAP_NOISE_RE =
  /\b(missing|not available|not present|absent|cover|coverage|not in policy|gap|add[- ]?on|add[- ]?ons|policy)\b/g;

const GAP_ALIASES: Record<string, string> = {
  // Zero Depreciation variants
  "zero dep": "zero depreciation",
  "zero deprecation": "zero depreciation",
  "nil depreciation": "zero depreciation",
  "nil dep": "zero depreciation",
  "depreciation waiver": "zero depreciation",
  // Engine Protector variants
  "engine protect": "engine protector",
  "engine cover": "engine protector",
  "engine protection": "engine protector",
  "engine safe": "engine protector",
  // Return to Invoice variants
  rti: "return to invoice",
  "invoice value": "return to invoice",
  "invoice protect": "return to invoice",
  // Roadside Assistance variants
  rsa: "roadside assistance",
  "24x7 rsa": "roadside assistance",
  "24 7 rsa": "roadside assistance",
  roadside: "roadside assistance",
  // NCB variants
  ncb: "ncb protection",
  "no claim bonus": "ncb protection",
  "ncb protect": "ncb protection",
  "ncb safeguard": "ncb protection",
  // Consumables
  consumable: "consumables",
  // Key replacement
  "key lock": "key replacement",
  "key and lock": "key replacement",
  // Personal Belongings
  "personal belongings": "loss of personal belongings",
  "personal effects": "loss of personal belongings",
};

function canonicalizeGap(raw: string): Canonical {
  if (!raw) return { key: "(unknown)", display: "(unknown)" };
  const stripped = raw
    .toLowerCase()
    .replace(GAP_NOISE_RE, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (!stripped) return { key: "(unknown)", display: "(unknown)" };
  const aliased = GAP_ALIASES[stripped] ?? stripped;
  return { key: aliased, display: titleCase(aliased) };
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================================
// Aggregation helpers
// ============================================================================

/**
 * Bucket items by a canonical key + carry a display-friendly label.
 * Returns a Map keyed on canonical key with `{ display, count }`.
 * First display string seen for each key wins (stable for the UI).
 */
function aggregateBy<T>(
  items: T[],
  canonFn: (item: T) => Canonical
): Map<string, { display: string; count: number }> {
  const map = new Map<string, { display: string; count: number }>();
  for (const item of items) {
    const { key, display } = canonFn(item);
    const cur = map.get(key);
    if (cur) {
      cur.count++;
    } else {
      map.set(key, { display, count: 1 });
    }
  }
  return map;
}

function topN(
  agg: Map<string, { display: string; count: number }>,
  n: number
): Array<{ name: string; count: number }> {
  return Array.from(agg.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map(({ display, count }) => ({ name: display, count }));
}

function median(sortedValues: number[]): number {
  if (sortedValues.length === 0) return 0;
  const mid = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2 === 1) return sortedValues[mid];
  return Math.round((sortedValues[mid - 1] + sortedValues[mid]) / 2);
}

function buildPerDay30d(
  policies: ParsedPolicy[],
  now: number
): Array<{ date: string; count: number }> {
  // Build map of YYYY-MM-DD → count of policies uploaded that day,
  // then emit a contiguous 30-day series (0-filled) ending today.
  const dayCounts = new Map<string, number>();
  for (const p of policies) {
    const ts = Date.parse(p.uploadedAt || "0");
    if (!Number.isFinite(ts)) continue;
    if (now - ts > 31 * DAY_MS) continue;
    const d = new Date(ts);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getUTCDate()).padStart(2, "0")}`;
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }
  const series: Array<{ date: string; count: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * DAY_MS);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getUTCDate()).padStart(2, "0")}`;
    series.push({ date: key, count: dayCounts.get(key) ?? 0 });
  }
  return series;
}
