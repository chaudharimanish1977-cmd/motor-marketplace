/**
 * MultiVehicleReport — top-level layout for /reports when a customer
 * forwards documents covering MORE THAN ONE vehicle in a single
 * inbound batch.
 *
 * Wraps N MultiDocReport instances (one per vehicle), with a
 * cross-vehicle summary banner + a vehicle-nav strip at the top.
 *
 * Crucially: there is NO cross-vehicle comparator. An Audi A6 and a
 * Maruti Swift have different IDVs, different add-on profiles,
 * different claim cost profiles — comparing their snapshots
 * side-by-side would produce nonsense numbers and mislead the
 * customer. Each vehicle gets its own self-contained audit; the
 * customer reads them as a list, not as a competition.
 *
 * Print mode: all vehicles render sequentially with a clean page
 * break between each, suitable for the master PDF that goes into
 * the inbound email attachment.
 */

import type { MultiVehicleComparison } from "@/lib/multi-doc-comparison";
import { MultiDocReport } from "@/components/multi-doc-report";

interface Props {
  /** Grouped, per-vehicle comparison data. Caller computes via
   *  buildMultiVehicleComparison() in lib/multi-doc-comparison.ts. */
  data: MultiVehicleComparison;
  /** Pre-computed cross-doc bottom lines, KEYED BY vehicleKey. Each
   *  vehicle's bottom-line is generated independently — they're never
   *  synthesised across vehicles. May be empty if upstream couldn't
   *  generate (network blip, etc.); MultiDocReport falls back to the
   *  anchor doc's per-doc bottomLine. */
  bottomLinesByVehicle: Record<string, { verdict: string; action?: string } | null>;
  /** Excluded docs (rejected / unreadable / errored) — same shape as
   *  single-vehicle. Surfaced once at the top, not per-vehicle, since
   *  the rejection happened at the inbound webhook level (before
   *  vehicle grouping). */
  excludedDocs?: Array<{ filename: string; reason: string }>;
  view: "investor" | "customer";
  showGate: boolean;
  printMode?: boolean;
  /** Which tab is active. For multi-vehicle, "vehicle-<key>" picks
   *  one vehicle to focus on. Default "all" shows every vehicle
   *  stacked. In print mode, activeTab is ignored. */
  activeTab?: string;
  /** Admin reveal — same gate as single-vehicle. Threaded down to
   *  every per-vehicle MultiDocReport so any of them can surface
   *  Section 6 when ?admin=1. */
  showAdminReveal?: boolean;
}

export function MultiVehicleReport({
  data,
  bottomLinesByVehicle,
  excludedDocs,
  view,
  showGate,
  printMode,
  activeTab = "all",
  showAdminReveal,
}: Props) {
  const { vehicles, totalDocs } = data;

  // Which vehicle to render. "all" or a key starting with "vehicle-"
  // (used by the tab strip in the future; today we just default to
  // showing all stacked vertically, matching the single-vehicle
  // annexure pattern).
  const showAllVehicles =
    printMode || activeTab === "all" || !activeTab.startsWith("vehicle-");
  const activeVehicleKey = showAllVehicles
    ? null
    : activeTab.slice("vehicle-".length);

  // Surface only the active vehicle on web when a specific one is
  // requested. PDF render (printMode) always shows all.
  const rendered = showAllVehicles
    ? vehicles
    : vehicles.filter((v) => v.vehicleKey === activeVehicleKey);

  return (
    <article className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      {/* ── 1. Cross-vehicle summary banner ─────────────────────── */}
      <header className="mb-10 pb-6 border-b border-brand-charcoal/15 text-center">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
          · {vehicles.length} vehicles audited · {totalDocs}{" "}
          {totalDocs === 1 ? "document" : "documents"} ·
        </div>
        <h1 className="font-serif font-medium text-3xl md:text-[40px] leading-[1.08] tracking-[-0.02em] text-brand-charcoal m-0">
          Your household&rsquo;s{" "}
          <span className="italic text-brand-plum">audit</span>.
        </h1>
        <p className="mt-3 max-w-2xl mx-auto font-serif italic text-[15px] md:text-[16px] text-brand-slate leading-[1.5]">
          You forwarded documents for {vehicles.length} different vehicles. We
          read them as separate audits — different cars need different
          coverage, so we never cross-compare add-ons or premiums between
          them.
        </p>
      </header>

      {/* ── 2. Excluded docs (if any) ───────────────────────────── */}
      {excludedDocs && excludedDocs.length > 0 && (
        <ExcludedDocsBlock items={excludedDocs} />
      )}

      {/* ── 3. Per-vehicle audits ───────────────────────────────── */}
      {rendered.map((slice, i) => (
        <section
          key={slice.vehicleKey}
          className={
            i > 0
              ? "mt-16 pt-8 border-t-2 border-brand-plum/40 print:break-before-page"
              : ""
          }
        >
          <div className="mb-8">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold mb-2">
              · Vehicle {String(i + 1).padStart(2, "0")} of{" "}
              {String(vehicles.length).padStart(2, "0")} ·
            </div>
            <h2 className="font-serif font-medium text-2xl md:text-3xl tracking-[-0.015em] text-brand-charcoal m-0">
              {slice.vehicleLabel}
            </h2>
            <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
              {slice.docCount}{" "}
              {slice.docCount === 1 ? "document" : "documents"} forwarded for
              this vehicle
            </div>
          </div>

          {/* Reuse the existing MultiDocReport for the per-vehicle
           *  comparison. It already handles single-doc cases (collapses
           *  to a single audit) AND multi-doc-same-vehicle (the
           *  cross-doc comparator). */}
          <MultiDocReport
            comparison={slice.comparison}
            crossDocBottomLine={bottomLinesByVehicle[slice.vehicleKey] ?? null}
            excludedDocs={undefined /* surfaced once at top */}
            view={view}
            showGate={showGate && i === 0}
            printMode={printMode}
            showAdminReveal={showAdminReveal}
            activeTab="comparator"
          />
        </section>
      ))}
    </article>
  );
}

/**
 * Inline "Couldn't process" block — same wording as the email body's
 * counterpart in lib/email-sender.ts, kept consistent so the customer
 * sees the same explanation whether they read the email or the web view.
 */
function ExcludedDocsBlock({
  items,
}: {
  items: Array<{ filename: string; reason: string }>;
}) {
  return (
    <section className="mb-10 pl-5 border-l-2 border-amber-500/60">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-amber-700 font-bold mb-2">
        · Couldn&rsquo;t process ·
      </div>
      <p className="font-serif italic text-[14.5px] text-brand-slate mb-3 max-w-xl">
        We received the following but couldn&rsquo;t include them in any of the
        vehicle audits. Forward a different copy or upload directly if any of
        these should have been read.
      </p>
      <ul className="space-y-1.5 list-none m-0 p-0">
        {items.map((item, i) => (
          <li
            key={`excluded-${i}-${item.filename}`}
            className="font-serif text-[14px] text-brand-charcoal leading-[1.5]"
          >
            <span className="font-medium">{item.filename}</span>
            <span className="text-brand-slate"> — {item.reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
