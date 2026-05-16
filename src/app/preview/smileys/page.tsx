/* eslint-disable react/no-unescaped-entities */
/**
 * /preview/smileys — internal preview of the 5-point CarSmiley rating
 * scale.
 *
 * Lays the five smileys out three ways:
 *   1. Full row, large size, plum stroke (canonical use)
 *   2. Smaller inline size, same row (e.g. inline in a sentence)
 *   3. Selected/unselected mock — what a rating widget looks like
 *      mid-tap, with one smiley active (plum + bg tint) and the rest
 *      muted (slate)
 *
 * Each rating has its label below + a one-line note on how we expect
 * to use it.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  CarSmiley,
  ThankYouCar,
  type SmileyRating,
} from "@/components/car-smiley";

export const metadata: Metadata = {
  title: "Car-smiley rating preview",
  description: "Internal preview of the 5-point car-smiley rating scale.",
};

const RATINGS: Array<{
  rating: SmileyRating;
  label: string;
  note: string;
}> = [
  { rating: 1, label: "Awful", note: "X-eyes · angry brows · steam lines" },
  { rating: 2, label: "Bad", note: "Sad eye-arcs · light frown" },
  { rating: 3, label: "Okay", note: "Dot eyes · straight mouth" },
  { rating: 4, label: "Good", note: "Dot eyes · gentle smile" },
  { rating: 5, label: "Delighted", note: "Closed-eye smiles · grin · sparkles" },
];

export default function SmileysPreviewPage() {
  return (
    <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      <header className="border-b border-brand-charcoal/15 pb-5 mb-8">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-3">
          · Internal preview ·
        </div>
        <h1 className="font-serif font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
          Car-smiley{" "}
          <span className="italic text-brand-plum">rating scale</span>
        </h1>
        <p className="mt-3 font-serif italic text-[15.5px] md:text-[17px] leading-[1.55] text-brand-slate max-w-xl">
          Five ink-line car expressions for the thank-you / feedback flow.
          Same Reading-Room language as the rest of the brand sketches.
        </p>
      </header>

      {/* Canonical row — large + plum */}
      <section className="mb-12">
        <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage mb-4">
          · Canonical row · plum · 96px
        </div>
        <div className="grid grid-cols-5 gap-3 md:gap-4 text-brand-plum">
          {RATINGS.map(({ rating, label, note }) => (
            <div
              key={rating}
              className="flex flex-col items-center gap-2 text-center"
            >
              <CarSmiley rating={rating} width={96} />
              <div className="font-serif font-semibold text-[15px] tracking-[-0.01em] text-brand-charcoal">
                {label}
              </div>
              <div className="font-serif italic text-xs text-brand-slate leading-snug max-w-[120px]">
                {note}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Inline row — small */}
      <section className="mb-12">
        <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage mb-4">
          · Compact inline · 56px
        </div>
        <div className="flex flex-wrap items-center gap-4 text-brand-plum">
          {RATINGS.map(({ rating }) => (
            <div key={rating} className="flex flex-col items-center gap-1">
              <CarSmiley rating={rating} width={56} />
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand-slate">
                {rating}/5
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive mock — active vs muted states */}
      <section className="mb-12">
        <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage mb-4">
          · Rating widget mock · "4 of 5 selected"
        </div>
        <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 py-7">
          <p className="font-serif italic text-lg text-brand-charcoal text-center mb-5">
            How was your review?
          </p>
          <div className="grid grid-cols-5 gap-3 md:gap-4">
            {RATINGS.map(({ rating, label }) => {
              const active = rating === 4;
              return (
                <div
                  key={rating}
                  className={`flex flex-col items-center gap-2 text-center rounded-2xl px-2 py-3 transition-colors cursor-pointer ${
                    active
                      ? "bg-brand-plum/10 text-brand-plum"
                      : "text-brand-charcoal/30 hover:text-brand-charcoal/60"
                  }`}
                >
                  <CarSmiley rating={rating} width={64} />
                  <div
                    className={`font-mono text-[9px] uppercase tracking-[0.12em] ${
                      active ? "text-brand-plum" : "text-brand-slate"
                    }`}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Thank-you car — separate from the rating scale, but family. */}
      <section className="mb-12">
        <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage mb-4">
          · Thank-you car · plum · 120px
        </div>
        <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 py-8 flex flex-col items-center gap-3 text-brand-plum">
          <ThankYouCar width={120} />
          <h2 className="font-serif font-medium text-2xl tracking-[-0.015em] text-brand-charcoal m-0">
            Thank you.
          </h2>
          <p className="font-serif italic text-sm text-brand-slate text-center max-w-sm">
            Use anywhere we need to say thanks — post-upload, post-feedback,
            email confirmation, receipt screens.
          </p>
        </div>
      </section>

      <footer className="mt-12 pt-6 border-t border-brand-charcoal/15 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate text-center">
        <Link href="/" className="text-brand-plum hover:underline">
          ← Back to RightOffer
        </Link>
      </footer>
    </article>
  );
}
