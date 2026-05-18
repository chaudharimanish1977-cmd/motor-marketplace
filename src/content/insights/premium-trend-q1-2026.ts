/**
 * Generic market-context insight on premium price movement in Q1 2026.
 * Targets older vehicles (5+ years) which see steeper YoY premium
 * volatility. Attaches to §03 At Renewal where it complements the
 * existing Pricing Snapshot block.
 */

import type { Insight } from "@/lib/insights/types";

const insight: Insight = {
  id: "premium-trend-q1-2026",
  title: "Motor premiums moved 4–6% this quarter — here's the texture",
  oneLiner:
    "Q1 2026 OD pricing on cars 5+ years old crept up 4–6% across most metros; renewal due in the next 90 days deserves a quote refresh.",
  kicker: "Market move",
  publishedAt: "2026-04-28",
  urgent: false,
  audience: {
    minVehicleAge: 5,
  },
  reportAttach: { section: "renewal" },
  body: `
    <p>
      The General Insurance Council's Q1 2026 motor portfolio data
      showed own-damage premiums on private cars 5+ years old rising
      <strong>4–6%</strong> across the major metros, with Mumbai and
      Bengaluru leading at ~6% and tier-2 cities trending closer to 3%.
    </p>
    <p>
      Three things are pushing this:
    </p>
    <ul>
      <li>
        Workshop labour rates went up ~8% YoY — claim costs follow
        labour, premiums follow claim costs
      </li>
      <li>
        Spare-part inflation on imported components (electronics
        modules in particular) is well above general inflation, which
        is feeding back into total-loss valuations
      </li>
      <li>
        Insurers are repricing older cars more aggressively as the
        claim-frequency curve climbs after the 5-year mark
      </li>
    </ul>
    <p>
      The practical read: if your renewal is due in the next 90 days,
      <strong>don't accept your insurer's auto-renewal quote without
      a fresh comparison</strong>. The 4–6% bump isn't uniform —
      individual carriers vary by 2–3% across the same risk profile.
      The carrier you renewed with last year may not be the best
      number this year.
    </p>
    <p>
      When you have your renewal quote, drop it back in here and we'll
      score it against the market for your car profile.
    </p>
  `,
};

export default insight;
