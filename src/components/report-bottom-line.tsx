/**
 * BottomLineBanner — the Big-4-style executive summary at the top of
 * every report. 80% of customers will read this and nothing else;
 * everything below is the defence of this verdict.
 *
 * Layout intent:
 *   · Plum mono kicker — "Aryan's bottom line"
 *   · Large serif body — the verdict itself, 1-2 sentences
 *   · Light hairline rule below to separate from the table that follows
 *
 * Falls back to using the report's existing keyTakeaway content when
 * bottomLine is missing (older reports generated before Phase 1 ship).
 */

import type { PolicyReport } from "@/lib/types";

interface Props {
  report: PolicyReport;
}

export function BottomLineBanner({ report }: Props) {
  // Prefer the new bottomLine field; fall back to the legacy
  // keyTakeaway body for older reports so the section renders
  // something useful even before regeneration.
  const text =
    report.bottomLine?.trim() ||
    report.keyTakeaway?.body?.trim() ||
    "";

  if (!text) return null;

  return (
    <section className="pl-5 border-l-2 border-brand-plum mb-8">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold">
        · Aryan&rsquo;s bottom line ·
      </div>
      <p className="mt-2 font-serif text-[18px] md:text-[22px] leading-[1.4] text-brand-charcoal m-0">
        {text}
      </p>
    </section>
  );
}
