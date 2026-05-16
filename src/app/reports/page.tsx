import { redirect } from "next/navigation";
import Link from "next/link";
import { Upload, Lock, ArrowRight } from "lucide-react";
import { findById, findOne, appendRow, Tables } from "@/lib/db";
import { generateReport } from "@/lib/report-generator";
import {
  computeRCP,
  scoreAgainstRcp,
} from "@/lib/recommended-coverage-profile";
import {
  generateRightOfferPick,
  type RightOfferPick,
} from "@/lib/rightoffer-pick";
import { policyGroupKey } from "@/lib/policy-group";
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
import { ReportDisplay } from "@/components/report-display";
import { TabStrip, type TabDef } from "./tab-strip";
import { ComparatorContent } from "./comparator-content";

export const dynamic = "force-dynamic";
// 120s for the inline-fallback report-gen path (the parse-time gen
// should have populated the cache by now in normal flow).
export const maxDuration = 120;
export const metadata = {
  title: "Your reports — RightOffer",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

/**
 * Tabbed landing page after upload — fully server-rendered.
 *
 * Tab navigation is URL-driven (`?tab=comparator` etc.). Each tab
 * change is a fresh server render — no client-side state, no large
 * data passed across the server/client boundary. This was a deliberate
 * pivot away from a client-component tab switcher: passing the full
 * ParsedPolicy + PolicyReport set as props was bloating the RSC
 * payload and triggering "Connection closed" streaming errors.
 *
 * Tab order (locked with user):
 *   1. Comparator — only when 2+ docs
 *   2. Policy — sorted alphabetically by insurer (one expected)
 *   3. Quotes — alphabetical by insurer name
 *
 * Gate behaviour (Option C — locked-with-summary):
 *   - First tab shows full content with the inline ReportGate after
 *     the "what's missing" section.
 *   - Other tabs show a locked panel pointing the customer to the
 *     first tab to verify their email.
 *   - Once verified (full session or upload session), all tabs unlock.
 */
export default async function ReportsPage({ searchParams }: PageProps) {
  const { tab: requestedTab } = await searchParams;

  const [fullSessionEmail, uploadSession, anonSession] = await Promise.all([
    getSession(),
    getUploadSession(),
    getAnonymousSession(),
  ]);

  const isVerified = !!(fullSessionEmail || uploadSession);
  const docIds =
    uploadSession?.docs ?? anonSession?.docs ?? [];

  if (docIds.length === 0) {
    return <EmptyState hasFullSession={!!fullSessionEmail} />;
  }

  const docs: ParsedPolicy[] = [];
  for (const id of docIds) {
    const p = await findById<ParsedPolicy>(Tables.PARSED_POLICIES, id);
    if (p) docs.push(p);
  }
  if (docs.length === 0) {
    return <EmptyState hasFullSession={!!fullSessionEmail} />;
  }

  // Make sure every doc has a generated report. /api/parse pre-
  // generates these synchronously, so this is just the fallback path
  // for docs whose generation failed. try/catch so one slow LLM call
  // can't take down the whole page.
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
    }
  }

  const renderableDocs = docs.filter((d) => reports.has(d.id));
  if (renderableDocs.length === 0) {
    return <EmptyState hasFullSession={!!fullSessionEmail} />;
  }

  // Dedupe by policyGroupKey — collapse multiple parses of the same
  // physical document (same registration + expiry + documentType)
  // into one. Customer's intent is "one logical doc per car-period
  // per type"; without this they'd see N copies if they re-uploaded
  // the same PDF during testing, or if the cookie carries stale IDs
  // from a prior browser session that hit the same policy+quote.
  // Canonical pick within each group: most recent uploadedAt.
  const groups = new Map<string, ParsedPolicy[]>();
  for (const d of renderableDocs) {
    const key = policyGroupKey(d);
    const arr = groups.get(key) ?? [];
    arr.push(d);
    groups.set(key, arr);
  }
  const visibleDocs = Array.from(groups.values()).map((group) =>
    [...group].sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0]
  );

  if (visibleDocs.length === 1) {
    redirect(`/report/${visibleDocs[0].id}`);
  }

  // Sort docs: policies (alpha by insurer) then quotes (alpha by insurer).
  const sortedDocs = [...visibleDocs].sort((a, b) => {
    const aIsPolicy = (a.documentType ?? "policy") === "policy";
    const bIsPolicy = (b.documentType ?? "policy") === "policy";
    if (aIsPolicy !== bIsPolicy) return aIsPolicy ? -1 : 1;
    return (a.insurerName ?? "").localeCompare(b.insurerName ?? "");
  });

  // Build the tab list.
  const tabs: TabDef[] = [];
  // Comparator first (sortedDocs.length >= 2 always here — single-doc
  // redirected above).
  tabs.push({ id: "comparator", label: "Comparator" });
  for (const doc of sortedDocs) {
    const docType = doc.documentType ?? "policy";
    const insurerFirstWord = doc.insurerName?.split(" ")[0] ?? "";
    tabs.push({
      id: `doc-${doc.id}`,
      label:
        docType === "quote"
          ? `${insurerFirstWord || "Quote"} Quote`
          : insurerFirstWord
            ? `${insurerFirstWord} Policy`
            : "Policy",
    });
  }

  const firstTabId = tabs[0].id;
  const activeTabId = requestedTab ?? firstTabId;
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const isActiveFirst = activeTab.id === firstTabId;
  const showGate = !isVerified && isActiveFirst;
  const showLocked = !isVerified && !isActiveFirst;

  // Compute the comparator content if needed (active tab is comparator
  // OR — for the locked panel on other tabs — we don't need it).
  let comparatorContent: React.ReactNode = null;
  if (activeTab.id === "comparator") {
    const anchor =
      sortedDocs.find(
        (d) => (d.documentType ?? "policy") === "policy"
      ) ?? sortedDocs[0];
    const anchorReport = reports.get(anchor.id)!;
    const rcpFull = computeRCP(anchor, anchorReport);
    const rcpSnapshot: ComparisonRcpSnapshot = {
      requiredAddOns: rcpFull.requiredAddOns,
      optionalAddOns: rcpFull.optionalAddOns,
      idv: rcpFull.idv,
      requiredAddOnsPremiumTotal: rcpFull.requiredAddOnsPremiumTotal,
    };
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
    // Generate our indicative Right Offer pick — the differentiated
    // recommendation we pitch alongside the customer's quotes.
    const rightOfferPick = generateRightOfferPick({
      rcp: rcpFull,
      customerQuotes: quoteScores.map((qs) => {
        const doc = sortedDocs.find((d) => d.id === qs.quoteId);
        return {
          grandTotal: qs.grandTotal,
          basicOd: doc?.premium?.basicOd,
          basicTp: doc?.premium?.basicTp,
          isRcpComplete: qs.isRcpComplete,
          isExactlyRcp: qs.isExactlyRcp,
          missingRequired: qs.missingRequired,
          extraNonRcp: qs.extraNonRcp,
          insurerName: qs.insurerName,
        };
      }),
      anchor,
    });

    const verdict = computeVerdict(quoteScores, rightOfferPick);
    const vehicleLabel =
      `${anchor.vehicle.make} ${anchor.vehicle.model}`.trim() ||
      "your car";

    comparatorContent = (
      <ComparatorContent
        vehicleLabel={vehicleLabel}
        rcp={rcpSnapshot}
        quoteScores={quoteScores}
        verdict={verdict}
        docs={sortedDocs}
        rightOfferPick={rightOfferPick}
        showGate={showGate}
      />
    );
  }

  // For doc tabs, find the doc/report.
  const activeDocId =
    activeTab.id.startsWith("doc-") ? activeTab.id.slice(4) : null;
  const activeDoc = activeDocId
    ? sortedDocs.find((d) => d.id === activeDocId)
    : null;
  const activeReport = activeDocId ? reports.get(activeDocId) : null;

  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-screen px-4 py-8 md:py-10">
        <div className="max-w-4xl mx-auto">
          <TabStrip
            tabs={tabs}
            firstTabId={firstTabId}
            isVerified={isVerified}
          />

          {showLocked ? (
            <LockedTabPanel
              firstTabLabel={tabs[0].label}
              firstTabId={firstTabId}
            />
          ) : (
            <>
              {activeTab.id === "comparator" && comparatorContent}
              {activeDoc && activeReport && (
                <ReportDisplay
                  parsedPolicy={activeDoc}
                  report={activeReport}
                  view="customer"
                  showGate={showGate}
                />
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

// ----------------------------------------------------------------------------
// Verdict — now factors in the RightOffer pick as a competing option.
//
// The "Right Offer rule" decision tree:
//   1. If a customer quote is isExactlyRcp AND <= our pick's price
//      → "take_existing" (your quote is the Right Offer)
//   2. Else if a customer quote is isRcpComplete (with extras) AND
//      cheaper than our pick → "take_existing" with over-coverage note
//   3. Else our pick wins → "rightoffer_pitch"
//
// The pick is always RCP-complete by construction (lib/rightoffer-pick),
// so we never end up in a "needs_attention" verdict unless the customer
// has uploaded zero quotes (handled upstream — comparator tab itself
// only renders for 2+ docs).
// ----------------------------------------------------------------------------
function computeVerdict(
  quoteScores: ComparisonQuoteScore[],
  rightOfferPick: RightOfferPick
): ComparisonVerdict {
  if (quoteScores.length === 0) {
    return {
      type: "needs_attention",
      headline: "No quotes to compare yet.",
      body:
        "Upload at least one renewal quote and we'll score it against the Right Offer profile for your car.",
    };
  }

  const ourPrice = rightOfferPick.grandTotal;

  // Cheapest customer quote that's exactly RCP-complete (no padding).
  const exactlyRcp = quoteScores
    .filter((q) => q.isExactlyRcp)
    .sort((a, b) => a.grandTotal - b.grandTotal);
  if (exactlyRcp.length > 0 && exactlyRcp[0].grandTotal <= ourPrice) {
    const winner = exactlyRcp[0];
    return {
      type: "take_existing",
      headline: `${winner.insurerName} is the Right Offer for you.`,
      body: `Covers every recommendation at ₹${winner.grandTotal.toLocaleString(
        "en-IN"
      )} — no missing essentials, no padding, and cheaper than our pick. Take it directly from ${winner.insurerName}.`,
      recommendedQuoteId: winner.quoteId,
    };
  }

  // Cheapest customer quote that's RCP-complete (with extras allowed).
  const rcpComplete = quoteScores
    .filter((q) => q.isRcpComplete)
    .sort((a, b) => a.grandTotal - b.grandTotal);
  if (rcpComplete.length > 0 && rcpComplete[0].grandTotal < ourPrice) {
    const winner = rcpComplete[0];
    const extras = winner.extraNonRcp.length
      ? ` plus ${winner.extraNonRcp.join(", ")} you didn't strictly need`
      : "";
    return {
      type: "take_existing",
      headline: `${winner.insurerName} is the Right Offer for you.`,
      body: `Covers everything we recommend${extras}, and ₹${(
        ourPrice - winner.grandTotal
      ).toLocaleString(
        "en-IN"
      )} cheaper than our pick. Take it directly from ${winner.insurerName}.`,
      recommendedQuoteId: winner.quoteId,
    };
  }

  // Our pick wins — either no customer quote is RCP-complete, or
  // all RCP-complete customer quotes are more expensive than our pick.
  return {
    type: "rightoffer_pitch",
    headline: `Our pick: ${rightOfferPick.insurerName} — the Right Offer for you.`,
    body: rightOfferPick.beatSummary,
  };
}

// ----------------------------------------------------------------------------
// Locked panel — server component, no client-state needed
// ----------------------------------------------------------------------------
function LockedTabPanel({
  firstTabLabel,
  firstTabId,
}: {
  firstTabLabel: string;
  firstTabId: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-brand-light-gray bg-brand-offwhite/40 p-8 md:p-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 text-brand-deepblue flex items-center justify-center">
        <Lock className="w-6 h-6" />
      </div>
      <h3 className="mt-4 text-lg md:text-xl font-bold text-brand-charcoal tracking-tight">
        Verify your email to unlock this tab
      </h3>
      <p className="mt-2 text-sm text-brand-slate max-w-md mx-auto leading-relaxed">
        Head to the{" "}
        <span className="font-semibold text-brand-charcoal">
          {firstTabLabel}
        </span>{" "}
        tab and enter the code we&rsquo;ll email you. Once verified,
        every tab unlocks &mdash; no need to verify again.
      </p>
      <Link
        href={`/reports?tab=${encodeURIComponent(firstTabId)}`}
        className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-orange hover:brightness-110 text-white font-semibold text-sm rounded-xl shadow-glow transition-all"
      >
        Go to {firstTabLabel}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
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
