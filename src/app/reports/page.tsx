import { redirect } from "next/navigation";
import Link from "next/link";
import { Upload } from "lucide-react";
import { findById, findMany, findOne, appendRow, Tables } from "@/lib/db";
import {
  generateCrossDocBottomLine,
  generateReport,
} from "@/lib/report-generator";
import { policyGroupKey } from "@/lib/policy-group";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import { getAnonymousSession } from "@/lib/anonymous-session";
import { buildMultiDocComparison } from "@/lib/multi-doc-comparison";
import type { ParsedPolicy, PolicyReport } from "@/lib/types";
import { BrandBlobs } from "@/components/brand-blobs";
import { LoadingLink } from "@/components/loading-link";
import { MultiDocReport } from "@/components/multi-doc-report";
import { ResetButton } from "./reset-button";
import { TabStrip, type TabDef } from "./tab-strip";

export const dynamic = "force-dynamic";
// 120s for the inline-fallback report-gen path (the parse-time gen
// should have populated the cache by now in normal flow).
export const maxDuration = 120;
export const metadata = {
  title: "Your reports — RightOffer",
  robots: { index: false, follow: false },
};

interface PageProps {
  /** Query params:
   *    docs={id,id,id} — explicit doc list. When set, bypasses session
   *                       discovery. Used by the puppeteer PDF render so
   *                       the function can target a specific customer's
   *                       docs without a session cookie.
   *    print=1         — print mode. Drops the diagnostic header chrome,
   *                       opens all annexures so the PDF carries the
   *                       full content. Also signals downstream render
   *                       to suppress interactive bits.
   *    tab=...         — reserved for back-compat; ignored. */
  searchParams: Promise<Record<string, string | undefined>>;
}

/**
 * Multi-doc comparison landing page — server-rendered.
 *
 * Replaces the prior tab-based UI. Now renders a single master report
 * (the MultiDocReport composer) with:
 *   1. Owner + Vehicle anchor
 *   2. Cross-doc bottom line (LLM call per render)
 *   3. Multi-column Coverage Snapshot table
 *   4. Per-feature insights (from anchor doc)
 *   5. Things to ask (aggregated across all quotes)
 *   6. Annexures — collapsible per-doc full editorial reports
 *   7. Glossary + How we read this
 *
 * Single-doc case redirects to /report/[id] (handled upstream).
 * Multi-doc case (2+ docs) renders the comparison.
 *
 * Gate behaviour: showGate is set when the visitor is unverified;
 * MultiDocReport passes it through to the first annexure so the
 * customer is prompted to verify before the deep content reveals.
 */
export default async function ReportsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const printMode = sp.print === "1";
  /** Active tab in the /reports view. Default "comparator". Tabs
   *  the customer can switch between:
   *    "comparator"       — the master comparison (default)
   *    "doc-<parsedId>"   — per-doc annexure full editorial
   *  In print mode, tab is ignored — the PDF renders everything
   *  sequentially (comparator + all annexures inline). */
  const requestedTab = sp.tab ?? "comparator";

  /** When docs=id,id,id is passed, we trust the explicit list instead
   *  of session discovery. Used by puppeteer rendering the master PDF
   *  (no session cookie inside the headless browser). */
  const explicitDocIds = (sp.docs ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const [fullSessionEmail, uploadSession, anonSession] = await Promise.all([
    getSession(),
    getUploadSession(),
    getAnonymousSession(),
  ]);

  const isVerified = !!(fullSessionEmail || uploadSession);

  // Doc discovery — three paths, merged in priority order:
  //
  //   0. Explicit ?docs= list (highest priority). Used by the puppeteer
  //      PDF render: no session cookie reaches headless Chrome, so we
  //      pass the doc IDs in the URL. When this is set, we IGNORE the
  //      session-based lookups entirely and only render the specified
  //      docs — the master PDF should match exactly what the customer
  //      forwarded, not include other policies on their account.
  //
  //   1. Browser-session cookies (upload-session / anonymous-session)
  //      give us the IDs of docs uploaded in THIS browser session.
  //      Used by the web-upload flow before sign-in.
  //
  //   2. Full session (signed-in email) lets us scope by owner.email.
  //      Used when the customer arrives via a magic-link (email-forward
  //      audit reply) — the magic-link clears the browser-session
  //      cookies during sign-in, so cookie-only discovery comes up empty.
  //      Without this fallback, /reports shows "Nothing to show yet"
  //      even when the customer has multiple forwarded audits on file.
  //
  // All paths feed into a single deduped doc list.
  const docIdSet = new Set<string>();
  // Path 0 — explicit docs param (PDF render path)
  for (const id of explicitDocIds) docIdSet.add(id);
  // When explicit docs are present, skip the session-based discovery
  // (we trust the URL list explicitly).
  if (explicitDocIds.length === 0) {
    for (const id of uploadSession?.docs ?? []) docIdSet.add(id);
    for (const id of anonSession?.docs ?? []) docIdSet.add(id);
  }

  const docs: ParsedPolicy[] = [];
  // Skip owner.email lookup when explicit docs are set — the URL list
  // is canonical for the render.
  if (fullSessionEmail && explicitDocIds.length === 0) {
    // Pull every ParsedPolicy owned by the signed-in email. This is the
    // same lookup /me uses, so the two surfaces stay consistent.
    const ownerLower = fullSessionEmail.toLowerCase();
    const ownerDocs = await findMany<ParsedPolicy>(
      Tables.PARSED_POLICIES,
      (p) => (p.owner?.email ?? "").toLowerCase() === ownerLower
    );
    for (const d of ownerDocs) {
      docIdSet.add(d.id);
      docs.push(d);
    }
  }

  // Fill in any cookie-only docs that didn't come through the email
  // match (e.g. anonymous upload session that hasn't been claimed yet).
  for (const id of docIdSet) {
    if (docs.some((d) => d.id === id)) continue;
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

  // Build the DocPair[] (parsed + report) in the order we want them
  // to appear left-to-right in the comparator. Doc ordering inside
  // buildMultiDocComparison() will then refine this (anchor first,
  // then chronological).
  const docPairs = visibleDocs
    .map((parsed) => {
      const report = reports.get(parsed.id);
      if (!report) return null;
      return { parsed, report };
    })
    .filter((p): p is { parsed: ParsedPolicy; report: PolicyReport } => p !== null);

  if (docPairs.length === 0) {
    return <EmptyState hasFullSession={!!fullSessionEmail} />;
  }

  // Note: visibleDocs.length === 1 case is already handled above via
  // redirect to /report/[id]. So docPairs.length >= 2 here.

  const comparison = buildMultiDocComparison(docPairs);

  // Cross-doc bottom line — synthesised verdict across all forwarded
  // docs. We compute on each render for now (no caching). Cost is
  // ~2-3s of LLM latency. Cache via KV in a future optimisation if
  // /reports traffic grows.
  //
  // Failure is non-fatal — the report still renders with the anchor
  // doc's per-doc bottomLine as fallback.
  let crossDocBottomLine = "";
  try {
    crossDocBottomLine = await generateCrossDocBottomLine({
      docs: comparison.ordered.map((d, i) => ({
        label: comparison.labels[i].label,
        period: comparison.labels[i].sublabel,
        documentType:
          (d.parsed.documentType ?? "policy") === "quote" ? "quote" : "policy",
        insurer: d.parsed.insurerName,
        idv: d.parsed.idv,
        ncbPercent: d.parsed.ncbPercent,
        grandTotalPremium: d.parsed.premium?.grandTotal ?? 0,
        addOnsPresent: (d.parsed.addOns ?? []).map((a) => a.name),
        keyGaps: d.report.keyGaps?.items?.map((g) => g.title),
        perDocBottomLine: d.report.bottomLine,
      })),
    });
  } catch (err) {
    console.error("[reports] cross-doc bottom line failed (non-fatal):", err);
  }

  const showGate = !isVerified;

  // Build the tab definitions — "Comparator" + one per doc.
  // The TabStrip client component reads ?tab= from the URL; we just
  // hand it the list of options. Default tab is comparator.
  const tabs: TabDef[] = [
    { id: "comparator", label: "Comparator" },
  ];
  for (let i = 0; i < comparison.ordered.length; i++) {
    const doc = comparison.ordered[i];
    const docLabel = comparison.labels[i];
    tabs.push({
      id: `doc-${doc.parsed.id}`,
      label: `${docLabel.label}${docLabel.sublabel ? ` · ${docLabel.sublabel}` : ""}`,
    });
  }
  const activeTabId = tabs.find((t) => t.id === requestedTab)
    ? requestedTab
    : "comparator";

  // Count of discovered docs BEFORE the policyGroupKey dedup pass.
  // Used in the header for the "N docs · M unique" diagnostic.
  const rawDocCount = docs.length;
  const dedupedCount = comparison.ordered.length;
  const wasDeduped = rawDocCount > dedupedCount;

  return (
    <>
      {!printMode && <BrandBlobs />}
      <main className="relative z-10 min-h-screen px-4 py-8 md:py-10">
        <div className="max-w-4xl mx-auto">
          {/* Diagnostic header — count + reset. Sits ABOVE the report
              as small chrome so the report itself has a clean opening.
              Hidden in print mode so the PDF starts cleanly with the
              master report header. */}
          {!printMode && (
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap text-[11px] text-brand-slate">
              <div>
                {wasDeduped ? (
                  <>
                    <span className="font-semibold text-brand-charcoal">
                      {dedupedCount}
                    </span>{" "}
                    unique document{dedupedCount === 1 ? "" : "s"}{" "}
                    <span className="text-brand-slate/70">
                      ({rawDocCount} parses deduped)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-brand-charcoal">
                      {dedupedCount}
                    </span>{" "}
                    document{dedupedCount === 1 ? "" : "s"} compared
                  </>
                )}
              </div>
              <ResetButton />
            </div>
          )}

          {/* Tab strip — only on web. PDF render skips it. */}
          {!printMode && (
            <TabStrip
              tabs={tabs}
              firstTabId="comparator"
              isVerified={isVerified}
            />
          )}

          <MultiDocReport
            comparison={comparison}
            crossDocBottomLine={crossDocBottomLine}
            view="customer"
            showGate={!printMode && showGate}
            printMode={printMode}
            activeTab={activeTabId}
          />
        </div>
      </main>
    </>
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
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-navy/10 border border-brand-navy/20 text-brand-navy flex items-center justify-center">
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
            className="mt-5 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-olive hover:brightness-110 text-white font-semibold text-sm rounded-xl shadow-glow transition-all"
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
