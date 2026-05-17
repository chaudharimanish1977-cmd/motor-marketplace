/**
 * Stop 4 · Preview — the next ~15 seconds.
 *
 * The new editorial beat (revived from the originally-skipped Room 4).
 * One job: tease the Recommended Coverage Profile we're about to surface
 * on the report page. Customer sees three or four named coverages with
 * a small "why" caption — builds anticipation for the verdict instead
 * of just waiting for it.
 *
 * No interactivity. No animation that demands attention. Just chips
 * gently fading in with a single illustrative coverage badge per chip.
 *
 * Phase 5 wires a generic chip list. A future pass can swap to a live
 * RCP-derived list once parse-preview surfaces enough vehicle metadata
 * (year / fuel / RTO / age) to make per-car recommendations.
 */
"use client";

import { ActHeading } from "./act-frame";
import type { ActContent } from "@/lib/journey-copy";

interface ActPreviewProps {
  content: ActContent;
}

// Phase 5 baseline — the four highest-leverage coverages for nearly
// every Indian private car. The Preview stop's job is to anchor
// vocabulary, not to commit to specifics. The full RCP lives on the
// report page where it's actually argued.
const TEASER_COVERAGES: Array<{
  name: string;
  why: string;
}> = [
  {
    name: "Zero Depreciation",
    why: "Full part-price payout instead of depreciated value.",
  },
  {
    name: "Engine Protection",
    why: "Covers water-logging + lubrication damage — the most expensive small claim.",
  },
  {
    name: "Return to Invoice",
    why: "If the car's totalled, the original purchase price comes back.",
  },
  {
    name: "Roadside Assistance",
    why: "24×7 dispatch for tow / battery / fuel / lockout.",
  },
];

export function ActPreview({ content }: ActPreviewProps) {
  return (
    <div className="flex flex-col items-center">
      <ActHeading heading={content.heading} body={content.body} />

      <ul className="mt-7 md:mt-9 w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
        {TEASER_COVERAGES.map((c, i) => (
          <li
            key={c.name}
            className="rounded-2xl border border-brand-plum/20 bg-brand-offwhite px-4 py-3 animate-towing-in"
            style={{
              animationDelay: `${i * 110}ms`,
              animationFillMode: "both",
            }}
          >
            <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-plum font-bold">
              · Recommended ·
            </div>
            <div className="mt-1 font-serif font-semibold text-[15px] text-brand-charcoal leading-tight">
              {c.name}
            </div>
            <div className="mt-1 font-serif italic text-[12.5px] text-brand-slate leading-snug">
              {c.why}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate text-center">
        · Full reasoning lands on the next screen ·
      </p>
    </div>
  );
}
