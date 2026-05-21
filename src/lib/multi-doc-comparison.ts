/**
 * Multi-document comparison data layer for /reports.
 *
 * Takes the collection of ParsedPolicy + PolicyReport for a customer's
 * forwarded documents and produces the structured data the multi-doc
 * UnifiedReport renders.
 *
 * No LLM calls live here — those are in report-generator.ts. This file
 * is pure deterministic joining + labelling logic.
 */

import type {
  CoverageSnapshotRow,
  FeatureInsight,
  ParsedPolicy,
  PolicyReport,
} from "@/lib/types";
import type { MultiDocRow } from "@/components/report-coverage-snapshot";

/**
 * A single document's pair (the parsed source + the generated audit).
 * Used everywhere a multi-doc operation needs both.
 */
export interface DocPair {
  parsed: ParsedPolicy;
  report: PolicyReport;
}

/**
 * Display label for a document, used as a column header in the
 * Coverage Snapshot table and as anchor copy in the body.
 *
 * Sublabel uses coverage period to disambiguate "old policy 2023" vs
 * "new policy 2024" cleanly — that's the difference that matters.
 */
export interface DocLabel {
  /** Primary label e.g. "Tata AIG Policy" or "Acko Quote". */
  label: string;
  /** Secondary line e.g. "Apr '23 — Mar '24" — coverage period. */
  sublabel: string;
}

export interface MultiDocComparison {
  /** Document used as the source for owner/vehicle anchor + RCP basis.
   *  Selection rule: most recent policy if any, else most recent doc. */
  anchor: DocPair;
  /** All docs in display order (anchor first, then chronological). */
  ordered: DocPair[];
  /** Column header labels matched 1:1 with `ordered`. */
  labels: DocLabel[];
  /** Joined snapshot — each feature is a row, cells map 1:1 with `ordered`. */
  table: MultiDocRow[];
  /** Combined glossary blob — text content across all docs, used by
   *  the glossary-detection logic so the per-report glossary at the
   *  bottom shows all terms actually referenced anywhere on the page. */
  glossaryBlob: string;
}

/**
 * Build the joined comparison structure.
 *
 * Doc ordering inside the table:
 *   1. Pick anchor: most-recent policy if any (sorted by odPeriodStart
 *      desc), else most-recent doc overall.
 *   2. Anchor sits in the LEFTMOST column (the "what you have today"
 *      reference).
 *   3. Other docs follow, sorted: policies first (chronological), then
 *      quotes (chronological).
 *
 * Why anchor-first column order: the eye reads left-to-right; the
 * comparison reads "this is what you have → here's the alternative".
 */
export function buildMultiDocComparison(
  docPairs: DocPair[]
): MultiDocComparison {
  if (docPairs.length === 0) {
    throw new Error("buildMultiDocComparison requires at least one doc");
  }

  // 1. Anchor selection
  const policies = docPairs.filter(
    (d) => (d.parsed.documentType ?? "policy") === "policy"
  );
  const sortByMostRecent = (a: DocPair, b: DocPair) =>
    new Date(b.parsed.odPeriodStart ?? 0).getTime() -
    new Date(a.parsed.odPeriodStart ?? 0).getTime();

  const anchor =
    policies.sort(sortByMostRecent)[0] ?? [...docPairs].sort(sortByMostRecent)[0];

  // 2. Order: anchor first, then policies (most-recent first), then quotes
  const others = docPairs.filter((d) => d !== anchor);
  const otherPolicies = others
    .filter((d) => (d.parsed.documentType ?? "policy") === "policy")
    .sort(sortByMostRecent);
  const quotes = others
    .filter((d) => (d.parsed.documentType ?? "policy") === "quote")
    .sort(sortByMostRecent);
  const ordered = [anchor, ...otherPolicies, ...quotes];

  // 3. Labels — each doc gets a primary label + period sublabel.
  const labels = ordered.map(buildDocLabel);

  // 4. Joined table. Feature universe = union of features across docs.
  // We canonicalise on the anchor's feature set first (so the order
  // matches what the customer's "current" doc has), then append any
  // features unique to other docs.
  const table = joinSnapshots(ordered);

  // 5. Glossary blob — concatenated user-visible content across all docs.
  const glossaryBlob = ordered
    .flatMap((d) => [
      // bottomLine is string | { verdict, action } | undefined.
      // Flatten the structured shape into a search blob.
      typeof d.report.bottomLine === "string"
        ? d.report.bottomLine
        : [
            d.report.bottomLine?.verdict ?? "",
            d.report.bottomLine?.action ?? "",
          ]
            .filter(Boolean)
            .join(" "),
      d.parsed.policyType,
      d.parsed.insurerName,
      ...(d.report.coverageSnapshot ?? []).flatMap((r) => [
        r.feature,
        r.whatThisMeans,
      ]),
      ...(d.report.featureInsights ?? []).flatMap((i) => [i.feature, i.body]),
      ...(d.report.whatCoversWell?.items ?? []).flatMap((x) => [
        x.title,
        x.description,
      ]),
      ...(d.report.keyGaps?.items ?? []).flatMap((x) => [
        x.title,
        x.description,
      ]),
    ])
    .filter(Boolean)
    .join(" \n ");

  return { anchor, ordered, labels, table, glossaryBlob };
}

/** "Tata AIG Policy" + "Apr '23 — Mar '24" sublabel.  */
function buildDocLabel(doc: DocPair): DocLabel {
  const type =
    (doc.parsed.documentType ?? "policy") === "quote" ? "Quote" : "Policy";
  const insurer = (doc.parsed.insurerName ?? "").trim();
  const insurerShort = insurer.split(" ")[0] || "Doc";
  const label = `${insurerShort} ${type}`;
  const start = formatPeriodMonth(doc.parsed.odPeriodStart);
  const end = formatPeriodMonth(doc.parsed.odPeriodEnd);
  const sublabel = start && end ? `${start} – ${end}` : start || end || "";
  return { label, sublabel };
}

function formatPeriodMonth(iso: string | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Build the joined table by walking the canonical feature ordering
 * from the anchor doc (so the row order matches the customer's
 * "current" reference) + any features uniquely in other docs.
 *
 * If a doc's snapshot doesn't have a row for a given feature (older
 * report from before the snapshot fields existed), fall back to a "—"
 * neutral cell so the column still renders predictably.
 */
function joinSnapshots(ordered: DocPair[]): MultiDocRow[] {
  // Collect feature ordering from each doc (anchor first wins).
  const seen = new Set<string>();
  const featureOrder: Array<{
    feature: string;
    category: CoverageSnapshotRow["category"];
  }> = [];
  for (const doc of ordered) {
    for (const row of doc.report.coverageSnapshot ?? []) {
      if (seen.has(row.feature)) continue;
      seen.add(row.feature);
      featureOrder.push({ feature: row.feature, category: row.category });
    }
  }

  // Index each doc's snapshot by feature for O(1) lookup.
  const indexes = ordered.map((doc) => {
    const map = new Map<string, CoverageSnapshotRow>();
    for (const row of doc.report.coverageSnapshot ?? []) {
      map.set(row.feature, row);
    }
    return map;
  });

  // Build the joined rows. Recommendation is a property of the FEATURE
  // (not the doc), so we take whichever doc's row first declares one —
  // the anchor wins, falling back to the next doc that has it.
  return featureOrder.map(({ feature, category }) => {
    let recommendation: CoverageSnapshotRow["recommendation"];
    for (const map of indexes) {
      const r = map.get(feature)?.recommendation;
      if (r) {
        recommendation = r;
        break;
      }
    }
    return {
      feature,
      category,
      recommendation,
      cells: indexes.map((map) => {
        const row = map.get(feature);
        if (!row) {
          return { value: "—", status: "neutral" as const };
        }
        return { value: row.value, status: row.status };
      }),
    };
  });
}
