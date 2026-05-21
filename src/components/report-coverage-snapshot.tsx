/**
 * CoverageSnapshotTable — the scannable table that anchors every
 * report. Renders in two modes:
 *
 *   - single-doc: 3 columns: Feature · Value · What this means
 *   - multi-doc:  N+1 columns: Feature · <doc 1> · <doc 2> · ...
 *
 * Multi-doc mode is consumed by /reports (Phase 2b); single-doc is
 * the only consumer until then.
 *
 * Status drives cell colour:
 *   good     → sage tint (covered)
 *   warn     → amber tint (consider)
 *   missing  → alert tint (red — biggest exposure)
 *   neutral  → no tint (information)
 *
 * Mobile design: on screens < md the table collapses to a card-per-row
 * layout so the user doesn't have to horizontal-scroll a wide table on
 * a phone. Desktop sees the full grid.
 */

import { Check, X } from "lucide-react";
import type { CoverageSnapshotRow } from "@/lib/types";

type Status = CoverageSnapshotRow["status"];

interface SingleDocProps {
  mode: "single";
  rows: CoverageSnapshotRow[];
  /** Vehicle label, displayed in the table caption. */
  vehicleLabel: string;
  /** When true, render the desktop grid layout REGARDLESS of viewport
   *  width. Used by puppeteer PDF render where Tailwind's responsive
   *  breakpoints don't behave the way they do in a normal browser
   *  (the print viewport is narrower, so md:hidden kicks in). */
  printMode?: boolean;
}

interface MultiDocRow {
  feature: string;
  category: CoverageSnapshotRow["category"];
  /** Feature-level recommendation; mirrors the same field on
   *  CoverageSnapshotRow. Drives the "Recommended" column so the
   *  customer sees what to prioritise across docs at a glance. */
  recommendation?: CoverageSnapshotRow["recommendation"];
  cells: Array<{
    value: string;
    status: Status;
  }>;
}

interface MultiDocProps {
  mode: "multi";
  rows: MultiDocRow[];
  /** Column headers — one per document. */
  documents: Array<{ label: string; sublabel?: string }>;
  vehicleLabel: string;
  /** When true, render the desktop grid layout REGARDLESS of viewport
   *  width. Required for the PDF render to show docs as columns
   *  instead of the mobile-card stacked layout. */
  printMode?: boolean;
}

type Props = SingleDocProps | MultiDocProps;

export function CoverageSnapshotTable(props: Props) {
  if (props.mode === "single") {
    return <SingleDocTable {...props} />;
  }
  return <MultiDocTable {...props} />;
}

// ---------------------------------------------------------------------------
// Single-doc rendering
// ---------------------------------------------------------------------------

function SingleDocTable({ rows, vehicleLabel, printMode }: SingleDocProps) {
  if (!rows || rows.length === 0) return null;
  // Print mode forces the desktop grid (puppeteer's print viewport
  // narrower than the md: breakpoint, so without this it falls into
  // the mobile-card layout).
  const desktopClass = printMode ? "block" : "hidden md:block";
  const mobileClass = printMode ? "hidden" : "md:hidden";

  return (
    <section className="mb-10">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-2">
        · Coverage snapshot ·
      </div>
      <h2 className="font-serif font-medium text-[22px] md:text-[26px] leading-[1.2] tracking-[-0.015em] text-brand-charcoal m-0 mb-4">
        Where your{" "}
        <span className="italic text-brand-plum">{vehicleLabel}</span> cover
        stands today.
      </h2>

      {/* Desktop: full table grid */}
      <div className={`${desktopClass} border-y border-brand-charcoal/15`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-brand-charcoal/15">
              <th className="text-left py-2.5 pr-4 font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-slate w-[30%]">
                Feature
              </th>
              <th className="text-center py-2.5 px-3 font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-slate w-[16%]">
                Recommended
              </th>
              <th className="text-center py-2.5 px-3 font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-slate w-[14%]">
                Status
              </th>
              <th className="text-left py-2.5 pl-3 font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-slate">
                What this means
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={`${row.feature}-${idx}`}
                className={`align-top ${
                  idx < rows.length - 1
                    ? "border-b border-brand-charcoal/10"
                    : ""
                }`}
              >
                <td className="py-3 pr-4 font-serif font-medium text-[14.5px] text-brand-charcoal">
                  {row.feature}
                </td>
                <td className="py-3 px-3 text-center">
                  <RecommendationChip recommendation={row.recommendation} />
                </td>
                <td className="py-3 px-3 text-center">
                  <StatusCell value={row.value} status={row.status} />
                </td>
                <td className="py-3 pl-3 font-serif text-[14px] text-brand-slate leading-[1.5]">
                  {row.whatThisMeans || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stack each row as a card */}
      <div className={`${mobileClass} space-y-3 border-t border-brand-charcoal/15 pt-3`}>
        {rows.map((row, idx) => (
          <div
            key={`m-${row.feature}-${idx}`}
            className={`pb-3 ${
              idx < rows.length - 1 ? "border-b border-brand-charcoal/10" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-serif font-medium text-[15px] text-brand-charcoal">
                {row.feature}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <RecommendationChip recommendation={row.recommendation} />
                <StatusCell value={row.value} status={row.status} />
              </div>
            </div>
            {row.whatThisMeans && (
              <p className="mt-1 font-serif text-[13.5px] text-brand-slate leading-[1.5]">
                {row.whatThisMeans}
              </p>
            )}
          </div>
        ))}
      </div>

      <LegendBar />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Multi-doc rendering — used by /reports (Phase 2b)
// ---------------------------------------------------------------------------

function MultiDocTable({
  rows,
  documents,
  vehicleLabel,
  printMode,
}: MultiDocProps) {
  if (!rows || rows.length === 0) return null;
  if (documents.length === 0) return null;
  // Print mode forces the desktop columnar layout — the only one that
  // shows docs as columns. Mobile layout stacks docs vertically per
  // feature, which destroys the whole point of a comparison.
  const desktopClass = printMode ? "block" : "hidden md:block";
  const mobileClass = printMode ? "hidden" : "md:hidden";

  return (
    <section className="mb-10">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-2">
        · Side-by-side ·
      </div>
      <h2 className="font-serif font-medium text-[22px] md:text-[26px] leading-[1.2] tracking-[-0.015em] text-brand-charcoal m-0 mb-4">
        Coverage across your{" "}
        <span className="italic text-brand-plum">{vehicleLabel}</span>{" "}
        documents.
      </h2>

      {/* Desktop: comparison grid */}
      <div className={`${desktopClass} border-y border-brand-charcoal/15 overflow-x-auto`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-brand-charcoal/15">
              <th className="text-left py-2.5 pr-4 font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-slate w-[24%]">
                Feature
              </th>
              <th className="text-center py-2.5 px-3 font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-slate w-[14%]">
                Recommended
              </th>
              {documents.map((doc, i) => (
                <th
                  key={`hdr-${i}`}
                  className="text-center py-2.5 px-3 font-serif font-semibold text-[13px] text-brand-charcoal"
                >
                  <div>{doc.label}</div>
                  {doc.sublabel && (
                    <div className="font-mono text-[9.5px] font-normal uppercase tracking-[0.1em] text-brand-slate mt-0.5">
                      {doc.sublabel}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={`${row.feature}-${idx}`}
                className={`align-middle ${
                  idx < rows.length - 1
                    ? "border-b border-brand-charcoal/10"
                    : ""
                }`}
              >
                <td className="py-3 pr-4 font-serif font-medium text-[14.5px] text-brand-charcoal">
                  {row.feature}
                </td>
                <td className="py-3 px-3 text-center">
                  <RecommendationChip recommendation={row.recommendation} />
                </td>
                {row.cells.map((cell, c) => (
                  <td key={`c-${idx}-${c}`} className="py-3 px-3 text-center">
                    <StatusCell value={cell.value} status={cell.status} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: per-row card, with each doc's value shown inline.
       *  Labels include the coverage period (sublabel) so the customer
       *  can tell two policies apart even when they're from the same
       *  insurer. */}
      <div className={`${mobileClass} space-y-3 border-t border-brand-charcoal/15 pt-3`}>
        {rows.map((row, idx) => (
          <div
            key={`mm-${row.feature}-${idx}`}
            className={`pb-3 ${
              idx < rows.length - 1 ? "border-b border-brand-charcoal/10" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-serif font-medium text-[15px] text-brand-charcoal">
                {row.feature}
              </span>
              <RecommendationChip recommendation={row.recommendation} />
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1.5">
              {row.cells.map((cell, c) => {
                const docLabel = documents[c]?.label ?? `Doc ${c + 1}`;
                const docSub = documents[c]?.sublabel ?? "";
                return (
                  <div
                    key={`mc-${idx}-${c}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-slate">
                      {docLabel}
                      {docSub ? ` · ${docSub}` : ""}
                    </span>
                    <StatusCell value={cell.value} status={cell.status} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <LegendBar />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Shared status cell
// ---------------------------------------------------------------------------

function StatusCell({ value, status }: { value: string; status: Status }) {
  // Tick / cross / scalar rendering.
  // ✓ and ✗ get the colour-coded chip treatment so they read across the
  // table. Scalar values (₹8.5L, 50%, etc.) get a subtler treatment so
  // the eye doesn't read them as "missing" by mistake.
  const isCheck = value === "✓";
  const isCross = value === "✗";

  if (isCheck) {
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
          status === "good"
            ? "bg-brand-sage/15 text-brand-sage"
            : "bg-brand-slate/10 text-brand-slate"
        }`}
        aria-label="Present"
      >
        <Check className="w-4 h-4" strokeWidth={2.5} />
      </span>
    );
  }
  if (isCross) {
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
          status === "missing"
            ? "bg-brand-alert/15 text-brand-alert"
            : status === "warn"
              ? "bg-amber-100 text-amber-700"
              : "bg-brand-slate/10 text-brand-slate"
        }`}
        aria-label="Absent"
      >
        <X className="w-4 h-4" strokeWidth={2.5} />
      </span>
    );
  }
  // Scalar value (IDV amount, NCB %, policy type, etc.)
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded font-mono text-[13px] tabular-nums ${
        status === "good"
          ? "bg-brand-sage/10 text-brand-charcoal"
          : status === "warn"
            ? "bg-amber-50 text-amber-900"
            : status === "missing"
              ? "bg-brand-alert/10 text-brand-alert"
              : "text-brand-charcoal"
      }`}
    >
      {value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Recommendation chip — "Must have / Good to have / May have" pill
// ---------------------------------------------------------------------------

/**
 * Tells the customer what to scout for, not just what's present. This is
 * RightOffer's editorial pick per feature, distinct from the per-doc
 * status (which describes the current document). For anchor rows like
 * IDV / NCB / Policy type the recommendation is implicit — those are
 * always relevant — so we render an em-dash placeholder.
 */
function RecommendationChip({
  recommendation,
}: {
  recommendation?: CoverageSnapshotRow["recommendation"];
}) {
  if (!recommendation) {
    return (
      <span className="font-mono text-[11px] text-brand-slate/60">—</span>
    );
  }
  const config = {
    "must-have": {
      label: "Must have",
      classes: "bg-brand-alert/12 text-brand-alert border-brand-alert/30",
    },
    "good-to-have": {
      label: "Good to have",
      classes: "bg-amber-100 text-amber-800 border-amber-300/50",
    },
    "may-have": {
      label: "May have",
      classes: "bg-brand-slate/10 text-brand-slate border-brand-slate/25",
    },
  }[recommendation];
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full border font-mono text-[10.5px] font-bold uppercase tracking-[0.06em] whitespace-nowrap ${config.classes}`}
    >
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Colour legend — explains what the ticks, crosses and chip colours mean
// ---------------------------------------------------------------------------

/**
 * Without this legend, the customer sees red/amber/green ticks and
 * crosses but has no anchor for what they signify. The legend sits
 * directly below the table so the eye picks it up on the same scan.
 */
function LegendBar() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] font-mono text-brand-slate">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-sage/15 text-brand-sage">
          <Check className="w-2.5 h-2.5" strokeWidth={3} />
        </span>
        Covered
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-alert/15 text-brand-alert">
          <X className="w-2.5 h-2.5" strokeWidth={3} />
        </span>
        Missing &amp; matters
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700">
          <X className="w-2.5 h-2.5" strokeWidth={3} />
        </span>
        Worth considering
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-slate/10 text-brand-slate">
          <X className="w-2.5 h-2.5" strokeWidth={3} />
        </span>
        Skippable
      </span>
      <span className="inline-flex items-center gap-1.5 ml-1">
        <span className="inline-block px-1.5 py-0.5 rounded-full border bg-brand-alert/12 text-brand-alert border-brand-alert/30 text-[9.5px] font-bold uppercase tracking-[0.06em]">
          Must
        </span>
        /
        <span className="inline-block px-1.5 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-300/50 text-[9.5px] font-bold uppercase tracking-[0.06em]">
          Good
        </span>
        /
        <span className="inline-block px-1.5 py-0.5 rounded-full border bg-brand-slate/10 text-brand-slate border-brand-slate/25 text-[9.5px] font-bold uppercase tracking-[0.06em]">
          May
        </span>
        <span>= RightOffer&rsquo;s advice for this profile</span>
      </span>
    </div>
  );
}

export type { MultiDocRow };
