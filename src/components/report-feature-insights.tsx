/**
 * FeatureInsightList — Aryan-voice per-feature insights anchored to
 * rows in the Coverage Snapshot table. Reader's eye moves from the
 * "✗" cell to the matching paragraph here for context.
 *
 * Visual: numbered list, plum left-rule for editorial weight. Same
 * vocabulary as the existing report sections (whatCoversWell etc.)
 * just consolidated into one feature-by-feature pass.
 */

import type { FeatureInsight } from "@/lib/types";

interface Props {
  insights: FeatureInsight[] | undefined;
}

export function FeatureInsightList({ insights }: Props) {
  if (!insights || insights.length === 0) return null;

  return (
    <section className="mb-10 pl-5 border-l-2 border-brand-plum">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold">
        · Insights ·
      </div>
      <ol className="mt-4 space-y-5 max-w-2xl">
        {insights.map((item, i) => (
          <li key={`${item.feature}-${i}`} className="flex gap-3">
            <span
              aria-hidden
              className="shrink-0 font-mono text-[11px] font-bold text-brand-plum pt-1"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="font-serif font-semibold text-[15px] text-brand-charcoal leading-snug">
                {item.feature}
              </div>
              <p className="mt-1 font-serif text-[14.5px] leading-[1.6] text-brand-slate">
                {item.body}
              </p>
              {item.evidence && (
                <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-brand-slate/70">
                  Found in {item.evidence}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
