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

import { CarSmiley } from "@/components/car-smiley";
import type { ActContent } from "@/lib/journey-copy";

interface ActDestinationProps {
  content: ActContent;
  /** Total wall-clock time the journey took, captured by the
   *  orchestrator at the moment we arrived. null = unknown (e.g.
   *  sandbox / state-restored mounts) → static footer. */
  elapsedMs?: number | null;
  onAdvance?: () => void;
}

/**
 * Build the dynamic "you arrived" footer line. Two regimes:
 *
 *   ≤ 120s — celebrate speed: "We drove fast — reached in 1m 47s ·"
 *   > 120s — lean light:      "Traffic was heavy out there — we
 *                              still got you here in 2m 31s ·"
 *
 * If `elapsedMs` is null OR < 30s (unrealistically fast → probably
 * jumpToPhase in the sandbox), fall back to the original static line
 * so we don't render nonsense like "we drove fast — 3s".
 */
function buildArrivalFooter(elapsedMs: number | null | undefined): string {
  if (elapsedMs == null || elapsedMs < 30_000) {
    return "· A 2-min journey well spent ·";
  }
  const seconds = Math.round(elapsedMs / 1000);
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  const timeStr =
    mm > 0
      ? ss === 0
        ? `${mm}m flat`
        : `${mm}m ${ss}s`
      : `${ss}s`;
  if (seconds <= 120) {
    return `· We drove fast — reached in ${timeStr} ·`;
  }
  return `· Traffic was heavy out there — we still got you here in ${timeStr} ·`;
}

export function ActDestination({
  content,
  elapsedMs,
  onAdvance,
}: ActDestinationProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold">
        · Destination ·
      </div>

      {/* Hero illustration — the Delighted CarSmiley (rating 5) pops
       *  in with a brief overshoot. Replaces the SketchCar with the
       *  emotional payoff: a smiling face that says "your car is in
       *  good hands". The pulse rings stay — they read as "you've
       *  arrived" energy. */}
      <div className="mt-3 relative text-brand-plum">
        <span
          className="absolute inset-0 -m-6 rounded-full bg-brand-plum/8 animate-roadpulse"
          aria-hidden
        />
        <div className="relative animate-smiley-pop">
          <CarSmiley rating={5} width={170} />
        </div>
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
        {buildArrivalFooter(elapsedMs)}
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
