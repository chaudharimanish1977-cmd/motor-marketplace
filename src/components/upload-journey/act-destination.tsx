/**
 * Destination — the verdict-reveal beat at the end of the journey.
 *
 * After the 90-second discipline + the parse completes, the customer
 * arrives here. Instead of the old 250ms "your verdict is ready" flash
 * that auto-navigated, we now hand the wheel over: an explicit "See
 * the verdict →" button. Tap-to-advance turns the last moment into
 * a payoff the customer chose.
 *
 * Visual: the SketchCar parked at the finish-line flag. A faint pulse
 * dot stream behind it suggests the journey has settled. Personalised
 * headline + body anchor the moment to their car.
 *
 * Fallback: if the customer doesn't tap within ~30 seconds we
 * auto-advance so the journey eventually terminates (handled by the
 * orchestrator, not this component).
 */
"use client";

import { SketchCar } from "@/components/sketches";
import type { ActContent } from "@/lib/journey-copy";

interface ActDestinationProps {
  content: ActContent;
  onAdvance?: () => void;
}

export function ActDestination({ content, onAdvance }: ActDestinationProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold">
        · Destination ·
      </div>

      {/* Hero illustration — car parked at the finish line */}
      <div className="mt-3 relative text-brand-plum">
        {/* Subtle pulse rings behind the car */}
        <span
          className="absolute inset-0 -m-4 rounded-full bg-brand-plum/8 animate-roadpulse"
          aria-hidden
        />
        <SketchCar width={210} color="currentColor" />
      </div>

      <h2 className="mt-5 font-serif font-medium text-[28px] md:text-[40px] leading-[1.1] tracking-[-0.02em] text-brand-charcoal m-0 max-w-2xl">
        {renderHeading(content.heading)}
      </h2>
      {content.body && (
        <p className="mt-3 font-serif italic text-[15px] md:text-lg leading-[1.55] text-brand-slate max-w-xl">
          {content.body}
        </p>
      )}

      {/* CTA — tap-to-advance */}
      <button
        type="button"
        onClick={onAdvance}
        className="mt-7 inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3.5 rounded-full font-serif italic font-medium text-[16px] min-h-[48px] hover:opacity-90 transition-opacity"
      >
        See the verdict <span aria-hidden>→</span>
      </button>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
        · 90 seconds well spent ·
      </p>
    </div>
  );
}

/** Heading highlight heuristic — same as ActHeading but inlined so we
 *  can render a slightly bigger size on this final moment. */
function renderHeading(heading: string): React.ReactNode {
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
