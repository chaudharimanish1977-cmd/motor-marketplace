/**
 * ActFrame — shared layout shell for each of the 5 journey acts.
 *
 * On mobile, each act fills the viewport as a full-bleed card with
 * the persistent loader-car heartbeat at the top and the progress
 * dots pinned to the bottom. On desktop (md+), the same act renders
 * as a centred rounded card in a stacked column — no card navigation,
 * the act simply occupies its share of vertical space.
 *
 * The persistent-heartbeat car at the top of every act on mobile is
 * deliberate: it tells the customer "we're still working" even when
 * the act they're reading is conceptual (e.g. the Ask act has no
 * loader). Anchoring a small SketchCar to the top keeps the
 * narrative coherent across all 5 acts.
 */
"use client";

import type React from "react";
import { SketchCarStatic } from "@/components/sketches";

interface ActFrameProps {
  /** Mono caption above the heading — short ("WHILE WE READ", etc.). */
  kicker?: string;
  /** Acts use the `<ActHeading>` directly inside children; this is the
   *  outer ring (kicker + heartbeat + body slot + dots). */
  children: React.ReactNode;
  /** Bottom-pinned progress dots row (rendered by the Journey orchestrator). */
  progress: React.ReactNode;
}

export function ActFrame({ kicker, children, progress }: ActFrameProps) {
  return (
    <div className="relative w-full">
      {/* Persistent heartbeat — a tiny static car at the top-right of the
       *  desktop card; on mobile we keep it visible top-centre. */}
      <div className="flex items-center justify-between gap-3 mb-5 md:mb-7">
        {kicker ? (
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold">
            {kicker}
          </span>
        ) : (
          <span />
        )}
        <span className="inline-flex items-center gap-1.5 text-brand-plum">
          <SketchCarStatic width={28} color="currentColor" />
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-slate">
            still reading
          </span>
        </span>
      </div>

      {/* Body content — heading, illustration, body, chips, etc. */}
      <div className="min-h-[260px] md:min-h-[320px]">{children}</div>

      {/* Progress dots */}
      <div className="mt-7 md:mt-8">{progress}</div>
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
      <h2 className="font-serif font-medium text-3xl md:text-[40px] leading-[1.1] tracking-[-0.02em] text-brand-charcoal m-0 max-w-2xl mx-auto">
        {renderHighlightedHeading(heading)}
      </h2>
      {body && (
        <p className="mt-3 font-serif italic text-base md:text-lg leading-[1.55] text-brand-slate max-w-xl mx-auto text-balance">
          {body}
        </p>
      )}
    </div>
  );
}

/**
 * Heuristic — if the heading contains a period mid-sentence, the
 * phrase before the final period becomes the italic-plum accent. Lets
 * us write copy like "Reading your Honda City." and get the cadence
 * we want without templating special markers in each entry.
 *
 * Falls back to plain rendering when no accent is detectable.
 */
function renderHighlightedHeading(heading: string): React.ReactNode {
  // Find the LAST sentence-style phrase: chunk before the trailing period.
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
