/**
 * Stop 5 · Stitching — the final ~18 seconds before the destination.
 *
 * Capability-tease + reveal hold. By now parse is usually done; we
 * stretch the time pleasantly and tell the customer what comes after
 * the verdict (marketplace quotes / renewal reminder / etc., depending
 * on state).
 *
 * Holds until BOTH conditions are met:
 *   1. Its minimum duration has elapsed
 *   2. parseComplete is true
 *
 * Driven by the Journey orchestrator; this component just renders.
 *
 * (Was the old ActAnticipate — renamed for the Phase 5 vocabulary.)
 */
"use client";

import { ActHeading } from "./act-frame";
import type { ActContent } from "@/lib/journey-copy";

interface ActStitchingProps {
  content: ActContent;
  parseComplete: boolean;
}

export function ActStitching({ content, parseComplete }: ActStitchingProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <ActHeading heading={content.heading} body={content.body} />

      {/* Pulse indicator — "we're stitching" beat */}
      <div className="mt-8 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage">
        <span className="inline-flex gap-1" aria-hidden>
          <span
            className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
            style={{ animationDelay: "120ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
            style={{ animationDelay: "240ms" }}
          />
        </span>
        <span>
          {parseComplete
            ? "Putting it together"
            : "Still reading the fine print"}
        </span>
      </div>
    </div>
  );
}
