/**
 * ActFrame — shared layout shell for each stop in the journey.
 *
 * Phase 5 rebuild:
 *   · Fixed-height shell so content NEVER causes the frame to grow or
 *     shrink between stops. No more layout shift.
 *   · RoadBar pinned at the top (replaces the old kicker text +
 *     progress dots). Spatial progress is the chapter heading.
 *   · Middle content area is min-height-locked. Heading anchors to a
 *     consistent Y position; illustration always renders in the same
 *     box.
 *   · Each rendered act animates in via `animate-act-fade-in` —
 *     a 380ms slide-up + opacity tween — so the hand-off feels smooth
 *     and visible.
 */
"use client";

import type React from "react";
import { RoadBar } from "./road-bar";

interface ActFrameProps {
  /** Conversational masthead pinned above the road bar — the "Let's
   *  take a 2-min test drive together" line that sets the tone for
   *  the whole journey. Stays put across every stop. */
  masthead?: string;
  /** Ordered list of stops + their tiny labels for the road bar. */
  stops: { key: string; label: string }[];
  /** Index of the stop currently being rendered. */
  currentIndex: number;
  /** Forwarded to RoadBar — when true, freezes the scrolling dashes
   *  and the car-hover loop. Set by the orchestrator at Destination. */
  parked?: boolean;
  /** Body content — heading, illustration, chips, etc. */
  children: React.ReactNode;
  /** Optional override for the fixed body min-height (px). */
  bodyMinHeight?: number;
}

export function ActFrame({
  masthead,
  stops,
  currentIndex,
  parked,
  children,
  bodyMinHeight,
}: ActFrameProps) {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Masthead — conversational invitation that frames the journey */}
      {masthead && (
        <div className="text-center mb-3 md:mb-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold">
          {masthead}
        </div>
      )}

      {/* Road bar (pinned, never moves between stops) */}
      <RoadBar stops={stops} currentIndex={currentIndex} parked={parked} />

      {/* Fixed-height body. The key on the inner wrapper drives the
       *  fade-in animation when phase changes. */}
      <div
        className="relative mt-4 md:mt-6 flex items-center justify-center px-1"
        style={{ minHeight: bodyMinHeight ?? 360 }}
      >
        <div
          key={stops[currentIndex]?.key ?? "frame"}
          className="w-full animate-act-fade-in"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * The editorial-style heading + body pair used inside every act.
 * Exported so individual acts can use it consistently.
 */
export function ActHeading({
  heading,
  body,
}: {
  heading: string;
  body?: string;
}) {
  return (
    <div className="text-center">
      <h2 className="font-serif font-medium text-[28px] md:text-[40px] leading-[1.1] tracking-[-0.02em] text-brand-charcoal m-0 max-w-2xl mx-auto">
        {renderHighlightedHeading(heading)}
      </h2>
      {body && (
        <p className="mt-3 font-serif italic text-[15px] md:text-lg leading-[1.55] text-brand-slate max-w-xl mx-auto text-balance">
          {body}
        </p>
      )}
    </div>
  );
}

/**
 * Heuristic — if the heading contains a period mid-sentence, the
 * phrase before the final period becomes the italic-plum accent. Lets
 * us write copy like "Reading your Audi A6." and get the cadence
 * we want without templating special markers in each entry.
 */
function renderHighlightedHeading(heading: string): React.ReactNode {
  const m = heading.match(/^(.*?)\s+([^.\s][^.]*\.)$/);
  if (!m) return heading;
  const [, lead, accent] = m;
  return (
    <>
      {lead}{" "}
      <span className="italic text-brand-plum">{accent}</span>
    </>
  );
}
