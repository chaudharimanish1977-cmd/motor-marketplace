/**
 * Inline-in-report insight surface — the subtle continuation of the
 * /me/insights feed inside /report/[id].
 *
 * Two variants:
 *   - <InsightInline /> renders a single insight as a quiet editorial
 *     note tucked underneath the relevant report element (gap card,
 *     renewal section).
 *   - <InsightsDiscoveryLine /> renders the small "N updates highlighted
 *     below" beat at the top of §02 What's Missing so the customer
 *     knows the report has been enriched since last visit.
 *
 * Editorial discipline:
 *   - No card frame, no shadow
 *   - Plum left-rule (or alert when urgent) — same vocab as the audit
 *     callouts (claim simulator uses alert; profile chip uses sage)
 *   - Truncated body in the report (one-liner + first paragraph);
 *     full body lives in /me/insights. Link out reads "Read the full
 *     update →"
 *
 * Why truncate in the report: keeps the audit reading cleanly. The
 * report is the artifact; the feed is the engagement layer. Crossing
 * them too aggressively turns the report into a noisy stream.
 */

import Link from "next/link";
import type { Insight } from "@/lib/insights/types";

/* ─── Single inline insight ─────────────────────────────────────────── */

export function InsightInline({ insight }: { insight: Insight }) {
  const date = new Date(insight.publishedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const tone = insight.urgent
    ? {
        rule: "border-brand-alert",
        kicker: "text-brand-alert",
      }
    : {
        rule: "border-brand-plum",
        kicker: "text-brand-plum",
      };

  return (
    <div className={`mt-3 pl-4 border-l-2 ${tone.rule}`}>
      <div
        className={`font-mono text-[9.5px] uppercase tracking-[0.16em] font-bold ${tone.kicker}`}
      >
        · {insight.kicker} · {date}
        {insight.urgent && " · Urgent"}
        {" ·"}
      </div>
      <p className="mt-1 font-serif font-semibold text-[14px] md:text-[15px] leading-snug text-brand-charcoal">
        {insight.title}
      </p>
      <p className="mt-1 font-serif italic text-[13px] md:text-[14px] leading-[1.55] text-brand-slate">
        {insight.oneLiner}
      </p>
      <Link
        href={`/me/insights#${insight.id}`}
        className="mt-1.5 inline-block font-mono text-[10px] uppercase tracking-[0.14em] font-bold text-brand-plum hover:underline"
      >
        Read the full update →
      </Link>
    </div>
  );
}

/* ─── Discovery line at top of §02 ──────────────────────────────────── */

export function InsightsDiscoveryLine({ count }: { count: number }) {
  if (count < 1) return null;
  return (
    <Link
      href="/me/insights"
      className="block my-4 pl-4 border-l-2 border-brand-plum/40 hover:border-brand-plum transition-colors group"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-brand-plum">
        · {count}{" "}
        {count === 1 ? "update tied" : "updates tied"} to gaps below ·
      </div>
      <p className="mt-0.5 font-serif italic text-[13.5px] md:text-[14px] text-brand-slate">
        We&rsquo;ve curated{" "}
        <span className="text-brand-charcoal not-italic font-medium">
          {count === 1 ? "an insight" : "insights"}
        </span>{" "}
        for your car since this report was written.{" "}
        <span className="text-brand-plum group-hover:underline">
          See all insights →
        </span>
      </p>
    </Link>
  );
}
