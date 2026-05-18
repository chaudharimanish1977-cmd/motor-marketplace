/**
 * NCB Protection insight for customers with meaningful NCB (≥25%) and
 * recent claim history. The math gets sharper when claims have been
 * frequent — NCB Protection earns its keep harder.
 */

import type { Insight } from "@/lib/insights/types";

const insight: Insight = {
  id: "ncb-protection-claims-q2-2026",
  title: "Your NCB is doing more work than you realise",
  oneLiner:
    "Hard-earned discount stacks compound; one careless claim erases years of accumulation.",
  kicker: "Discount math",
  publishedAt: "2026-05-12",
  urgent: false,
  audience: {
    missingAddOns: ["NCB Protection"],
    minNcbPercent: 25,
    pastClaims: ["once", "frequent"],
  },
  reportAttach: { section: "gaps", gap: "NCB Protection" },
  body: `
    <p>
      You told us you'd filed a claim recently. That matters here.
    </p>
    <p>
      Most customers think of NCB as a flat discount. It isn't —
      it's a <strong>compounding multiplier</strong> on the own-damage
      portion of next year's premium. Year-on-year, the discount stacks
      from 20% to 25%, 35%, 45%, and tops out at 50% after five
      claim-free years. A claim — any claim, any size — drops you back
      to <strong>0%</strong> at the next renewal. The five years you
      spent earning your way up the ladder reset.
    </p>
    <p>
      The rebuild matters as much as the loss. Once you're at 0%, the
      ladder starts over: 20% next year, 25% the year after, and so on.
      You won't be back at your current discount level for
      <strong>4–5 claim-free years</strong>.
    </p>
    <p>
      NCB Protection — typically ₹500/year — keeps the discount intact
      after one (sometimes two) claims, depending on the insurer's
      variant. At your current discount level, the premium you save
      across the next renewal alone usually pays for the add-on three
      times over.
    </p>
    <p>
      A specific suggestion: ask your insurer whether their NCB
      Protection variant allows <em>two</em> claims (some do — IFFCO
      Tokio, Bajaj Allianz, ICICI Lombard have versions of this).
      Given you've filed once recently, the two-claim variant
      protects you from a second one too.
    </p>
  `,
};

export default insight;
