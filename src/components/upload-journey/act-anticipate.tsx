/**
 * Act 5 · Anticipate — the final ~30 seconds.
 *
 * Job: capability-tease + reveal hold. By now the parse is usually
 * done (~30-60s) but our 90s ritual hasn't completed. This act both
 * stretches the time pleasantly and tells the customer what comes
 * after the verdict (marketplace quotes / renewal reminder / etc.,
 * depending on state).
 *
 * The act holds until BOTH conditions are met:
 *   1. Its minimum duration has elapsed
 *   2. parseComplete is true
 *
 * Driven by the Journey orchestrator; this component just renders.
 */
"use client";

import { ActFrame, ActHeading } from "./act-frame";
import type { ActContent } from "@/lib/journey-copy";

interface ActAnticipateProps {
  content: ActContent;
  parseComplete: boolean;
  progress: React.ReactNode;
}

export function ActAnticipate({
  content,
  parseComplete,
  progress,
}: ActAnticipateProps) {
  return (
    <ActFrame kicker="· Reading Room · No. 4" progress={progress}>
      <div className="flex flex-col items-center text-center">
        <ActHeading heading={content.heading} body={content.body} />

        {/* Pulse indicator — "we're stitching" beat */}
        <div className="mt-8 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage">
          <span className="inline-flex gap-1">
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
    </ActFrame>
  );
}
