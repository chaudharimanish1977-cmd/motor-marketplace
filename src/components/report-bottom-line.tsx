/**
 * BottomLineBanner — the Big-4-style executive summary at the top of
 * every report. 80% of customers will read this and nothing else;
 * everything below is the defence of this verdict.
 *
 * Two parts when structured data is available:
 *   · verdict — the read on the situation (plain body text)
 *   · action — the recommended next step (highlighted callout, plum
 *     background, so the call-to-action doesn't get lost in prose)
 *
 * Falls back gracefully:
 *   · string bottomLine → treat as verdict-only (legacy reports)
 *   · missing bottomLine → use keyTakeaway.body (oldest reports)
 *   · missing everything → render nothing
 */

import type { PolicyReport } from "@/lib/types";

interface Props {
  report: PolicyReport;
}

interface BottomLineParts {
  verdict: string;
  action?: string;
}

function resolveBottomLine(report: PolicyReport): BottomLineParts | null {
  const bl = report.bottomLine;
  if (!bl) {
    const fallback = report.keyTakeaway?.body?.trim();
    if (fallback) return { verdict: fallback };
    return null;
  }
  if (typeof bl === "string") {
    const v = bl.trim();
    return v ? { verdict: v } : null;
  }
  const verdict = bl.verdict?.trim() ?? "";
  const action = bl.action?.trim();
  if (!verdict && !action) return null;
  return {
    verdict: verdict || "",
    action: action || undefined,
  };
}

export function BottomLineBanner({ report }: Props) {
  const parts = resolveBottomLine(report);
  if (!parts) return null;

  return (
    <section className="pl-5 border-l-2 border-brand-plum mb-8">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold">
        · Aryan&rsquo;s (Your RightOffer Advisor) bottom line ·
      </div>
      {parts.verdict && (
        <p className="mt-2 font-serif text-[18px] md:text-[22px] leading-[1.4] text-brand-charcoal m-0">
          {parts.verdict}
        </p>
      )}
      {parts.action && (
        <div className="mt-4 inline-block bg-brand-plum/10 border border-brand-plum/25 rounded-lg px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-plum font-bold mb-1">
            What to do
          </div>
          <p className="font-serif font-semibold text-[16px] md:text-[18px] leading-[1.45] text-brand-charcoal m-0">
            {parts.action}
          </p>
        </div>
      )}
    </section>
  );
}
