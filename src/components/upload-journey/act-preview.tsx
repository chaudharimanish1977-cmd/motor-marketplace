/**
 * Stop 4 · Preview — the next ~15 seconds.
 *
 * The "sneak peek" stop. One job: hint at the Recommended Coverage
 * Profile we'll surface on the report — without giving the verdict
 * away. Modelled on a new-car-launch teaser: the customer sees one
 * spotlight at a time, each crystallising long enough to register a
 * name, then veiling out as the next slides in.
 *
 * Visual rhythm:
 *
 *   · COMING UP · 1 of 4 ·                ← mono counter at top
 *
 *           [spotlight panel]              ← single item, cycling
 *             Zero Depreciation
 *             one teasing line
 *
 *   · Full reveal on the next screen ·     ← mono footnote
 *
 * Each item is on screen for SPOTLIGHT_MS (~3.5s) then crossfades to
 * the next via the spotlight-cycle keyframe. After the queue rolls
 * once, we loop back to item 1 — the Stop 4 timer (15s) will move us
 * on before the customer notices the loop.
 */
"use client";

import { useEffect, useState } from "react";
import { ActHeading } from "./act-frame";
import type { ActContent } from "@/lib/journey-copy";

interface ActPreviewProps {
  content: ActContent;
}

// Phase 5 baseline — the four highest-leverage coverages for nearly
// every Indian private car. The "tease" copy stays generic on purpose;
// the full reasoning lives on the report page.
const TEASER_ITEMS: Array<{
  name: string;
  tease: string;
}> = [
  {
    name: "Zero Depreciation",
    tease: "Full part-price payouts. The single biggest claim multiplier.",
  },
  {
    name: "Engine Protection",
    tease: "Covers water-logging + lubrication damage. The expensive small claim.",
  },
  {
    name: "Return to Invoice",
    tease: "If the car's a total loss, your original purchase price comes back.",
  },
  {
    name: "Roadside Assistance",
    tease: "Tow · battery · fuel · lockout — 24×7 dispatch.",
  },
];

const SPOTLIGHT_MS = 3500;

export function ActPreview({ content }: ActPreviewProps) {
  // Index of the currently-spotlit item. Cycles on a timer so the
  // customer always feels something is happening; if Stop 4 runs over
  // the queue we loop seamlessly.
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % TEASER_ITEMS.length),
      SPOTLIGHT_MS
    );
    return () => clearInterval(id);
  }, []);

  const item = TEASER_ITEMS[idx];

  return (
    <div className="flex flex-col items-center">
      <ActHeading heading={content.heading} body={content.body} />

      {/* Spotlight kicker — counter ("N of M") dropped to lower
       *  cognitive load; the cycling itself + the "Full reveal on
       *  the next screen" footnote do the "more is coming" job. */}
      <div className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold">
        · Coming up ·
      </div>

      {/* Spotlight panel — single card, cycles via keyframe re-mount.
       *  We re-key on idx so React unmounts the old card and the new
       *  one mounts with the spotlight-cycle entry animation. */}
      <div className="relative mt-3 w-full max-w-md min-h-[150px] flex items-center justify-center">
        <article
          key={idx}
          className="absolute inset-0 rounded-2xl border border-brand-plum/30 bg-brand-offwhite px-6 py-5 flex flex-col items-center text-center animate-spotlight-cycle"
          style={{
            animationDuration: `${SPOTLIGHT_MS}ms`,
          }}
        >
          {/* Tiny "next reveal" tease — name of the coverage with a
           *  subtle plum underline that fades in/out via the same
           *  animation envelope. */}
          <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-brand-sage font-bold">
            · Coverage ·
          </div>
          <h3 className="mt-1.5 font-serif font-semibold text-[22px] md:text-[26px] tracking-[-0.015em] leading-[1.15] text-brand-charcoal">
            <span className="italic text-brand-plum">{item.name}</span>
          </h3>
          <p className="mt-2 font-serif italic text-[13.5px] md:text-[14.5px] text-brand-slate leading-snug max-w-sm">
            {item.tease}
          </p>
        </article>
      </div>

      {/* Footnote — tells the customer this isn't the verdict yet */}
      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate text-center">
        · Full reveal on the next screen ·
      </p>
    </div>
  );
}
