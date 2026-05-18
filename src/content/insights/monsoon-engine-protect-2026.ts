/**
 * Monsoon-onset insight for CNG / LPG cars in flood-prone metros with
 * no engine protection cover. Fires inline on the Engine Protector gap
 * card.
 *
 * Published 2026-05-18 — IMD's southwest monsoon onset forecast for
 * Kerala is May 27 (early by 2 days vs the normal June 1 onset). For
 * Mumbai, monsoon typically arrives 10-12 days later.
 */

import type { Insight } from "@/lib/insights/types";

const insight: Insight = {
  id: "monsoon-engine-protect-2026",
  title: "Monsoon's two weeks early — your engine cover gap matters now",
  oneLiner:
    "Hydrostatic lock claims peak between July and September; your CNG car is the highest-risk profile in the book.",
  kicker: "Monsoon watch",
  publishedAt: "2026-05-18",
  urgent: false,
  audience: {
    missingAddOns: ["Engine Protector"],
    isCngOrLpg: true,
    isFloodProneCity: true,
  },
  reportAttach: { section: "gaps", gap: "Engine Protector" },
  body: `
    <p>
      IMD's revised forecast has the southwest monsoon hitting Kerala on
      <strong>May 27</strong> — two days earlier than the long-period
      average. Mumbai typically sees onset 10–12 days after Kerala, so
      your city is looking at the first heavy showers around the
      <strong>second week of June</strong>.
    </p>
    <p>
      The CNG / LPG combination changes the maths on engine protection.
      The intake manifold sits lower on dual-fuel cars; standing water
      reaches it sooner, and the hydrostatic lock window — where water
      enters the cylinder and the engine seizes if you crank — opens
      faster than on a petrol-only equivalent.
    </p>
    <p>
      The base comprehensive policy you currently hold does not cover
      consequential damage from water ingress. If you drove through
      standing water in last year's monsoon and got away with it, that's
      not evidence of safety — it's how survivorship bias reads on a bad
      data point.
    </p>
    <p>
      Engine Protect adds <strong>~₹1,500/year</strong> on most CNG
      cars. The typical workshop bill for a hydrostatic-locked engine
      sits at <strong>₹60,000–₹1,20,000</strong>. The trade is not subtle.
    </p>
    <p>
      <em>If you renew before monsoon hits</em>, ask your insurer to add
      Engine Protect to the current policy — most carriers allow mid-term
      add-on additions on a pro-rated basis. We can review the revised
      quote if you upload it.
    </p>
  `,
};

export default insight;
