/**
 * ActError — the journey's failure surface.
 *
 * Rendered by Journey when /api/parse fails mid-flight. Keeps the same
 * editorial frame so the customer doesn't feel yanked out of the
 * experience — just told, in our voice, that we hit a wall and offered
 * a retry. The Awful CarSmiley (rating=1) is the canonical metaphor for
 * uncovered / failed moments per DESIGN-LANGUAGE.md.
 *
 * Two CTAs:
 *   · Try again — re-opens the file picker for a different PDF
 *   · Start over — bails out to the upload landing
 *
 * The progress dots are intentionally omitted because the journey has
 * been cut short; rendering them would mis-suggest "you can still get
 * to the end."
 */
"use client";

import { CarSmiley } from "@/components/car-smiley";

interface ActErrorProps {
  /** Plain-English error headline (e.g. "Couldn't read this PDF"). */
  headline: string;
  /** Body line — usually a "try the original from your insurer" hint. */
  body: string;
  /** Fired when the customer taps "Try a different file". */
  onRetry?: () => void;
  /** Fired when the customer taps the secondary escape ("Start over"). */
  onAbandon?: () => void;
}

export function ActError({
  headline,
  body,
  onRetry,
  onAbandon,
}: ActErrorProps) {
  return (
    <div className="relative w-full">
      {/* No persistent loader — we've stopped reading. */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-coral font-bold">
          · Reading interrupted ·
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-slate">
          we hit a wall
        </span>
      </div>

      <div className="text-center min-h-[260px] md:min-h-[320px] flex flex-col items-center">
        <CarSmiley rating={1} width={140} />
        <h2 className="mt-5 font-serif font-medium text-3xl md:text-[40px] leading-[1.1] tracking-[-0.02em] text-brand-charcoal max-w-2xl">
          {headline}
        </h2>
        <p className="mt-3 font-serif italic text-base md:text-lg leading-[1.55] text-brand-slate max-w-xl text-balance">
          {body}
        </p>

        <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-1 bg-brand-plum text-brand-offwhite px-6 py-3 rounded-full font-serif italic font-medium text-[15px] hover:opacity-90 transition-opacity"
            >
              Try a different file <span aria-hidden>→</span>
            </button>
          )}
          {onAbandon && (
            <button
              type="button"
              onClick={onAbandon}
              className="inline-flex items-center justify-center font-serif italic text-[14px] text-brand-slate hover:text-brand-charcoal transition-colors py-2 px-4"
            >
              Start over
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
