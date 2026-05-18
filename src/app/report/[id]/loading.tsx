"use client";

import { SketchCarStatic } from "@/components/sketches";

/**
 * Report loading screen — minimal "sealing the deal" beat.
 *
 * Server-side hold (6 seconds from journey start, set in
 * /report/[id]/page.tsx) keeps this screen visible long enough that
 * the customer registers the anticipation. The page is intentionally
 * sparse: a single italic-serif line plus a small ink car gently
 * drifting along a hand-drawn road. No lists, no enumerated steps,
 * no second questionnaire — those reads as homework. This reads as
 * craft.
 */
export default function Loading() {
  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-5 md:px-6 py-12">
        <div className="max-w-md w-full text-center font-serif text-brand-charcoal">
          {/* Reading Room kicker */}
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold">
            · Reading Room ·
          </div>

          {/* The single beat — italic plum accent on "your car" makes
              the personalisation promise without spelling it out. */}
          <h1 className="mt-5 md:mt-6 font-serif font-medium text-[28px] md:text-[36px] leading-[1.15] tracking-[-0.02em] text-brand-charcoal m-0">
            Personalising the review{" "}
            <span className="italic text-brand-plum">for your car…</span>
          </h1>

          {/* Cute animation — ink car drifts gently above a dashed
              road that slides under it. Built from the existing
              brand sketch + the ro-car + ro-road animations defined
              in globals.css (already in the design vocab). */}
          <div className="mt-9 md:mt-10 flex flex-col items-center gap-2">
            <div className="text-brand-plum ro-car">
              <SketchCarStatic width={80} color="currentColor" />
            </div>
            <div
              aria-hidden
              className="w-32 md:w-40 text-brand-charcoal/60 ro-road"
            />
          </div>

          {/* Quiet "we're working" line — runs underneath the animation
              as a subtle mono kicker so the customer knows the wait is
              substance, not stall. */}
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-slate">
            · Folding in everything you told us ·
          </p>
        </div>
    </main>
  );
}
