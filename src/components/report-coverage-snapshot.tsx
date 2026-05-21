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
}

interface MultiDocRow {
  feature: string;
  category: CoverageSnapshotRow["category"];
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

function SingleDocTable({ rows, vehicleLabel }: SingleDocProps) {
  if (!rows || rows.length === 0) return null;

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
      <div className="hidden md:block border-y border-brand-charcoal/15">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-brand-charcoal/15">
              <th className="text-left py-2.5 pr-4 font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-slate w-[34%]">
                Feature
              </th>
              <th className="text-center py-2.5 px-3 font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-slate w-[18%]">
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
      <div className="md:hidden space-y-3 border-t border-brand-charcoal/15 pt-3">
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
              <StatusCell value={row.value} status={row.status} />
            </div>
            {row.whatThisMeans && (
              <p className="mt-1 font-serif text-[13.5px] text-brand-slate leading-[1.5]">
                {row.whatThisMeans}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Multi-doc rendering — used by /reports (Phase 2b)
// ---------------------------------------------------------------------------

function MultiDocTable({ rows, documents, vehicleLabel }: MultiDocProps) {
  if (!rows || rows.length === 0) return null;
  if (documents.length === 0) return null;

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
      <div className="hidden md:block border-y border-brand-charcoal/15 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-brand-charcoal/15">
              <th className="text-left py-2.5 pr-4 font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-slate w-[28%]">
                Feature
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

      {/* Mobile: per-row card, with each doc's value shown inline */}
      <div className="md:hidden space-y-3 border-t border-brand-charcoal/15 pt-3">
        {rows.map((row, idx) => (
          <div
            key={`mm-${row.feature}-${idx}`}
            className={`pb-3 ${
              idx < rows.length - 1 ? "border-b border-brand-charcoal/10" : ""
            }`}
          >
            <div className="font-serif font-medium text-[15px] text-brand-charcoal">
              {row.feature}
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1.5">
              {row.cells.map((cell, c) => (
                <div
                  key={`mc-${idx}-${c}`}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-slate">
                    {documents[c]?.label ?? `Doc ${c + 1}`}
                  </span>
                  <StatusCell value={cell.value} status={cell.status} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
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

export type { MultiDocRow };
