/**
 * RoadBar — the journey's spatial progress indicator.
 *
 * Replaces the old progress dots. Renders a horizontal dashed road
 * with milestone markers at each stop and a checkered finish-line flag
 * at the destination. A tiny SketchCar icon hovers above the road and
 * glides between markers as the journey advances (600-800ms ease-out
 * tween, matching the cross-fade timing in the frame).
 *
 * Spatial progress > abstract progress: the customer literally sees
 * themselves moving down the road instead of dots filling. Adds to
 * the editorial "journey" framing rather than fighting it.
 *
 * Visual rhythm:
 *
 *    🚗
 *  ─●─────●─────●─────●─────●─────🏁─
 *  Hello  Read  Ask Preview Stitch
 */
"use client";

import { SketchCarStatic } from "@/components/sketches";

interface RoadBarStop {
  /** Stable key used to compute the car's position. */
  key: string;
  /** Tiny label shown under the dot. Empty string = no label. */
  label: string;
}

interface RoadBarProps {
  /** Stops along the road, in order. Final stop should be the
   *  destination (renders the checkered flag). */
  stops: RoadBarStop[];
  /** Index of the current stop the car is parked at. */
  currentIndex: number;
}

export function RoadBar({ stops, currentIndex }: RoadBarProps) {
  if (stops.length === 0) return null;

  // Position percentages — first stop at 6%, last at 94% so the
  // markers visually breathe at the edges instead of clipping.
  const left = (i: number) => {
    if (stops.length === 1) return 50;
    const min = 6;
    const max = 94;
    return min + (i / (stops.length - 1)) * (max - min);
  };

  const carX = left(Math.max(0, Math.min(currentIndex, stops.length - 1)));
  const lastIdx = stops.length - 1;

  return (
    <div className="relative w-full h-16 md:h-[72px] select-none">
      {/* The road — dashed line through the middle of the bar. */}
      <div
        className="absolute inset-x-0 top-[26px] md:top-[28px] border-t-2 border-dashed border-brand-charcoal/25"
        aria-hidden
      />

      {/* Milestone markers (dots + labels). The destination at the end
       *  swaps the dot for a tiny checkered flag. */}
      {stops.map((stop, i) => {
        const passed = i < currentIndex;
        const current = i === currentIndex;
        const isDestination = i === lastIdx;
        return (
          <div
            key={stop.key}
            className="absolute -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${left(i)}%`, top: 0 }}
          >
            {/* Marker */}
            <div
              className={`mt-[18px] md:mt-[20px] flex items-center justify-center transition-colors ${
                isDestination ? "" : "rounded-full"
              }`}
              style={{
                width: isDestination ? 18 : 12,
                height: isDestination ? 14 : 12,
              }}
            >
              {isDestination ? (
                <FinishFlag active={passed || current} />
              ) : (
                <span
                  className={`block rounded-full transition-all ${
                    passed
                      ? "w-2.5 h-2.5 bg-brand-sage"
                      : current
                        ? "w-3 h-3 bg-brand-plum animate-roadpulse"
                        : "w-2 h-2 bg-brand-charcoal/25"
                  }`}
                />
              )}
            </div>

            {/* Label */}
            {stop.label && (
              <div
                className={`mt-1.5 font-mono text-[8.5px] md:text-[9px] uppercase tracking-[0.14em] whitespace-nowrap transition-colors ${
                  current
                    ? "text-brand-plum font-bold"
                    : passed
                      ? "text-brand-sage"
                      : "text-brand-charcoal/40"
                }`}
              >
                {stop.label}
              </div>
            )}
          </div>
        );
      })}

      {/* Traveling car — sits above the road, animates between markers. */}
      <div
        className="absolute -translate-x-1/2 text-brand-plum"
        style={{
          left: `${carX}%`,
          top: 0,
          transition: "left 700ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        aria-hidden
      >
        <div className="animate-roadhover">
          <SketchCarStatic width={28} color="currentColor" />
        </div>
      </div>
    </div>
  );
}

/* ─── Finish-line flag SVG ─────────────────────────────────────────── */

function FinishFlag({ active }: { active: boolean }) {
  // Mini checkered flag on a pole — same ink-line aesthetic as the
  // rest of the sketch family. Goes plum when "reached" so the
  // destination payoff feels earned.
  return (
    <svg
      width={18}
      height={20}
      viewBox="0 0 18 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-colors ${
        active ? "text-brand-plum" : "text-brand-charcoal/35"
      }`}
    >
      {/* Pole */}
      <line x1="4" y1="2" x2="4" y2="19" />
      {/* Flag body */}
      <rect x="4" y="3" width="11" height="7" rx="0.5" fill="none" />
      {/* Checker pattern */}
      <rect x="4" y="3" width="2.75" height="1.75" fill="currentColor" />
      <rect x="9.5" y="3" width="2.75" height="1.75" fill="currentColor" />
      <rect x="6.75" y="4.75" width="2.75" height="1.75" fill="currentColor" />
      <rect x="12.25" y="4.75" width="2.75" height="1.75" fill="currentColor" />
      <rect x="4" y="6.5" width="2.75" height="1.75" fill="currentColor" />
      <rect x="9.5" y="6.5" width="2.75" height="1.75" fill="currentColor" />
    </svg>
  );
}
