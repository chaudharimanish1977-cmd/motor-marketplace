import { notFound } from "next/navigation";
import Link from "next/link";
import { Upload } from "lucide-react";
import { findById, findOne, appendRow, Tables } from "@/lib/db";
import { generateReport } from "@/lib/report-generator";
import { computeRCP, scoreAgainstRcp } from "@/lib/recommended-coverage-profile";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import { getAnonymousSession } from "@/lib/anonymous-session";
import type {
  ComparisonQuoteScore,
  ComparisonRcpSnapshot,
  ComparisonVerdict,
  ParsedPolicy,
  PolicyReport,
} from "@/lib/types";
import { BrandBlobs } from "@/components/brand-blobs";
import { LoadingLink } from "@/components/loading-link";
import { ReportsTabs, type ReportsTabModel } from "./reports-tabs";

export const dynamic = "force-dynamic";
// 120s mirrors /api/parse so the inline-fallback report generation
// path (used only when parse-time generation failed) has enough
// headroom to complete. Without this, slow LLM responses get killed
// mid-stream and the customer hits "Connection closed".
export const maxDuration = 120;
export const metadata = {
  title: "Your reports — RightOffer",
  robots: { index: false, follow: false },
};

/**
 * Tabbed landing page after upload.
 *
 * Tabs are computed dynamically from whatever's in the customer's
 * session (anonymous browser cookie OR upload session OR full magic-
 * link session). Order:
 *   1. Comparator  — only when 2+ docs
 *   2. Policy      — the first policy (alphabetical insurer if several)
 *   3. Quotes      — alphabetical by insurer name
 *
 * Tab labels are insurer-named (e.g. "Acko Quote") for at-a-glance
 * distinguishability when there are multiple quotes.
 *
 * Gate behaviour (Option C — locked with summary):
 *   - First tab renders full report up to the inline gate; below is
 *     hidden until verify.
 *   - Other tabs render a "Verify email on the [first tab] to unlock"
 *     locked-summary panel.
 *   - Once verified, all tabs unlock simultaneously (router.refresh()
 *     after the gate's OTP exchange).
 *
 * The Comparator content is computed inline here (not via
 * /api/comparisons/create) for anonymous customers — no DB persistence
 * until they verify. Saves storage + keeps the page idempotent.
 */
export default async function ReportsPage() {
  const [fullSessionEmail, uploadSession, anonSession] = await Promise.all([
    getSession(),
    getUploadSession(),
    getAnonymousSession(),
  ]);

  const isVerified = !!(fullSessionEmail || uploadSession);
  // Doc IDs in scope: prefer upload-session (verified), fall back to
  // anonymous-session (typed-but-unverified browser).
  const docIds =
    uploadSession?.docs ?? anonSession?.docs ?? [];

  if (docIds.length === 0) {
    // No docs in session — empty state. (Full-session customers might
    // still have docs in /me, but reports view is about the current
    // session's stack — show empty + redirect them to either /upload
    // or /me.)
    return <EmptyState hasFullSession={!!fullSessionEmail} />;
  }

  // Hydrate every doc in scope. Skip any that are missing / deleted.
  const docs: ParsedPolicy[] = [];
  for (const id of docIds) {
    const p = await findById<ParsedPolicy>(Tables.PARSED_POLICIES, id);
    if (p) docs.push(p);
  }
  if (docs.length === 0) {
    return <EmptyState hasFullSession={!!fullSessionEmail} />;
  }

  // Make sure every doc has a generated report. /api/parse triggers
  // background generation via waitUntil after each successful parse,
  // so by the time a customer clicks "See my reports" the report is
  // usually already cached. This is the fallback path for docs whose
  // background generation hadn't finished (or failed) — wrapped in
  // try/catch so one slow / failing LLM call doesn't take down the
  // whole page. Docs without a generated report are silently dropped
  // from the tab list; their entry stays in the anonymous session for
  // a future page load to retry.
  const reports = new Map<string, PolicyReport>();
  for (const doc of docs) {
    try {
      let report = await findOne<PolicyReport>(
        Tables.REPORTS,
        (r) => r.parsedPolicyId === doc.id
      );
      if (!report) {
        report = await generateReport(doc);
        await appendRow<PolicyReport>(Tables.REPORTS, report);
      }
      reports.set(doc.id, report);
    } catch (err) {
      console.error(
        `[reports] Report generation failed for ${doc.id}:`,
        err
      );
      // Skip this doc — it won't appear in the tab list. Next visit
      // retries lazily.
    }
  }

  // Drop docs whose report failed/missing — they can't render in tabs.
  const visibleDocs = docs.filter((d) => reports.has(d.id));
  if (visibleDocs.length === 0) {
    return <EmptyState hasFullSession={!!fullSessionEmail} />;
  }

  // Sort docs: policies (alpha by insurer) then quotes (alpha by insurer).
  const sortedDocs = [...visibleDocs].sort((a, b) => {
    const aIsPolicy = (a.documentType ?? "policy") === "policy";
    const bIsPolicy = (b.documentType ?? "policy") === "policy";
    if (aIsPolicy !== bIsPolicy) return aIsPolicy ? -1 : 1;
    return (a.insurerName ?? "").localeCompare(b.insurerName ?? "");
  });

  const policies = sortedDocs.filter(
    (d) => (d.documentType ?? "policy") === "policy"
  );
  const quotes = sortedDocs.filter((d) => d.documentType === "quote");

  // Tab list. Comparator comes first if there are 2+ docs.
  const tabs: ReportsTabModel[] = [];
  let comparatorView: ComparatorView | null = null;

  if (sortedDocs.length >= 2) {
    // Compute the comparator inline. Anchor on the first policy if
    // any, else the first quote. RCP comes from the anchor's report.
    const anchor = policies[0] ?? sortedDocs[0];
    const anchorReport = reports.get(anchor.id)!;
    const rcpFull = computeRCP(anchor, anchorReport);
    const rcpSnapshot: ComparisonRcpSnapshot = {
      requiredAddOns: rcpFull.requiredAddOns,
      optionalAddOns: rcpFull.optionalAddOns,
      idv: rcpFull.idv,
      requiredAddOnsPremiumTotal: rcpFull.requiredAddOnsPremiumTotal,
    };

    // Score every doc against the RCP (the anchor scores itself too,
    // so customers see "your current policy is exactly Right Offer" or
    // missing/extras in their own coverage).
    const quoteScores: ComparisonQuoteScore[] = sortedDocs.map((d) => {
      const addOnNames = (d.addOns ?? []).map((a) => a.name);
      const result = scoreAgainstRcp(addOnNames, rcpFull);
      return {
        quoteId: d.id,
        insurerName: d.insurerName,
        grandTotal: d.premium?.grandTotal ?? 0,
        missingRequired: result.missingRequired,
        extraNonRcp: result.extraNonRcp,
        isRcpComplete: result.isRcpComplete,
        isExactlyRcp: result.isExactlyRcp,
      };
    });
    const verdict = computeVerdict(quoteScores);

    comparatorView = {
      vehicleLabel:
        `${anchor.vehicle.make} ${anchor.vehicle.model}`.trim() ||
        "your car",
      rcp: rcpSnapshot,
      quoteScores,
      verdict,
      docs: sortedDocs,
    };

    tabs.push({
      id: "comparator",
      kind: "comparator",
      label: "Comparator",
    });
  }

  for (const doc of sortedDocs) {
    const docType = doc.documentType ?? "policy";
    const insurerFirstWord = doc.insurerName?.split(" ")[0] ?? "";
    tabs.push({
      id: `doc-${doc.id}`,
      kind: "doc",
      docId: doc.id,
      label:
        docType === "quote"
          ? `${insurerFirstWord || "Quote"} Quote`
          : insurerFirstWord
            ? `${insurerFirstWord} Policy`
            : "Policy",
    });
  }

  const reportsForClient = Object.fromEntries(
    sortedDocs.map((d) => [d.id, reports.get(d.id)!])
  );
  const docsForClient = Object.fromEntries(
    sortedDocs.map((d) => [d.id, d])
  );

  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-screen px-4 py-8 md:py-10">
        <div className="max-w-4xl mx-auto">
          <ReportsTabs
            tabs={tabs}
            docs={docsForClient}
            reports={reportsForClient}
            comparator={comparatorView}
            isVerified={isVerified}
            isAnonSessionOnly={!isVerified && !!anonSession}
          />
        </div>
      </main>
    </>
  );
}

// ----------------------------------------------------------------------------
// Comparator data shape passed to the client
// ----------------------------------------------------------------------------

export interface ComparatorView {
  vehicleLabel: string;
  rcp: ComparisonRcpSnapshot;
  quoteScores: ComparisonQuoteScore[];
  verdict: ComparisonVerdict;
  docs: ParsedPolicy[];
}

// ----------------------------------------------------------------------------
// Verdict logic (copy of /api/comparisons/create's computeVerdict — kept
// in sync; can extract to a shared helper if used in a third place).
// ----------------------------------------------------------------------------

function computeVerdict(
  quoteScores: ComparisonQuoteScore[]
): ComparisonVerdict {
  if (quoteScores.length === 0) {
    return {
      type: "needs_attention",
      headline: "No quotes to compare yet.",
      body:
        "Upload at least one renewal quote and we'll score it against the Right Offer profile for your car.",
    };
  }

  const exactlyRcp = quoteScores
    .filter((q) => q.isExactlyRcp)
    .sort((a, b) => a.grandTotal - b.grandTotal);
  if (exactlyRcp.length > 0) {
    const winner = exactlyRcp[0];
    return {
      type: "take_existing",
      headline: `${winner.insurerName} is the Right Offer for you.`,
      body: `This option covers every recommendation for your car at ₹${winner.grandTotal.toLocaleString(
        "en-IN"
      )} — no missing essentials, no padding.`,
      recommendedQuoteId: winner.quoteId,
    };
  }

  const rcpComplete = quoteScores
    .filter((q) => q.isRcpComplete)
    .sort((a, b) => a.grandTotal - b.grandTotal);
  if (rcpComplete.length > 0) {
    const winner = rcpComplete[0];
    return {
      type: "take_existing",
      headline: `${winner.insurerName} covers everything you need — with a couple of extras.`,
      body: `This option includes every Right Offer essential plus ${winner.extraNonRcp.join(
        ", "
      )} which we wouldn't have added. If the price difference is small, it's still a fine choice.`,
      recommendedQuoteId: winner.quoteId,
    };
  }

  const aggregateMissing = new Set<string>();
  for (const q of quoteScores) {
    for (const m of q.missingRequired) aggregateMissing.add(m);
  }
  return {
    type: "needs_attention",
    headline: "None of these cover what we recommend for your car.",
    body: `Every option is missing at least one essential: ${[
      ...aggregateMissing,
    ].join(
      ", "
    )}. Ask your insurer to add the missing items, or wait for the RightOffer auction — when it goes live, our partner insurers will compete to fill the gap.`,
  };
}

// ----------------------------------------------------------------------------
// Empty state
// ----------------------------------------------------------------------------

function EmptyState({ hasFullSession }: { hasFullSession: boolean }) {
  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white border border-brand-light-gray rounded-2xl shadow-soft p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 text-brand-deepblue flex items-center justify-center">
            <Upload className="w-7 h-7" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-brand-charcoal tracking-tight">
            Nothing to show yet
          </h2>
          <p className="mt-2 text-sm text-brand-slate leading-relaxed">
            Upload a policy or renewal quote and we&rsquo;ll prepare your
            Right Offer review.
          </p>
          <LoadingLink
            href="/upload"
            spinnerPosition="right"
            className="mt-5 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-orange hover:brightness-110 text-white font-semibold text-sm rounded-xl shadow-glow transition-all"
          >
            Upload a document
          </LoadingLink>
          {hasFullSession && (
            <Link
              href="/me"
              className="mt-3 inline-block text-xs text-brand-slate hover:text-brand-charcoal"
            >
              Or view your saved policies in /me
            </Link>
          )}
        </div>
      </main>
    </>
  );
}
