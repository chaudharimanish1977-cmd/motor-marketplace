/**
 * Editorial testimonial carousel — replaces the earlier marketing-style
 * TestimonialCarousel. Mounts inside V7Quote on the home page.
 *
 * Behaviour:
 *   · Auto-rotates every 6s. Pauses on hover (desktop) and during keyboard
 *     focus inside the card (accessibility).
 *   · Dot indicators below the quote let the user jump to a specific story.
 *   · Prev/next chevron buttons sit on either side of the dot row for
 *     linear navigation. Kept small and ink-line so they read as marginalia
 *     rather than a slider widget.
 *
 * Visual treatment matches the static V7Quote it replaces: large italic
 * serif body, plum open/close quote marks, italic sage emphasis on the
 * highlight phrase (typically a ₹ amount), uppercase mono byline.
 */
"use client";

import { useEffect, useState } from "react";

interface Story {
  /** Plain text before the highlight phrase. */
  before: string;
  /** Italic-sage phrase, usually a ₹ amount or product name. */
  highlight: string;
  /** Plain text after the highlight phrase. */
  after: string;
  /** Reviewer name. */
  byline: string;
  /** City and vehicle, e.g. "Bengaluru · Sedan owner". */
  where: string;
}

const STORIES: Story[] = [
  {
    before: "Saved me ",
    highlight: "₹35,000 out of pocket",
    after:
      " when my claim happened — entirely borne by the insurer because of an add-on RightOffer recommended. Had I continued with my old policy, that would have been my loss.",
    byline: "Arjun M.",
    where: "Pune · SUV owner",
  },
  {
    before:
      "RightOffer flagged that my engine protector was missing. Two months later when my car got water-logged in the monsoon, the entire ",
    highlight: "₹85,000 repair",
    after:
      " was borne by the insurer. Without their advice I'd have paid it out of pocket.",
    byline: "Nikhil R.",
    where: "Mumbai · Hatchback owner",
  },
  {
    before:
      "I was about to auto-renew. The review showed my IDV was undervalued by ",
    highlight: "₹2.4 lakh",
    after:
      ". Switched to a properly-priced policy at the same premium.",
    byline: "Priya S.",
    where: "Bengaluru · Sedan owner",
  },
  {
    before:
      "Two minutes to know exactly what was missing in my policy. The claim simulator made the gaps real — I added ",
    highlight: "NCB Protection and Zero Dep",
    after: " at renewal. Worth every second.",
    byline: "Rohan K.",
    where: "Hyderabad · Compact SUV owner",
  },
];

const AUTOPLAY_MS = 6000;

export function ReadingQuoteCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(
      () => setIdx((i) => (i + 1) % STORIES.length),
      AUTOPLAY_MS
    );
    return () => clearInterval(id);
  }, [paused]);

  const story = STORIES[idx];

  const goTo = (n: number) =>
    setIdx(((n % STORIES.length) + STORIES.length) % STORIES.length);

  return (
    <div
      className="max-w-4xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Quote — key prop forces a re-mount on idx change so the
       *  animate-in fade kicks in for each new story. */}
      <figure key={idx} className="animate-in fade-in duration-500">
        <blockquote className="m-0 font-serif italic font-normal text-3xl md:text-[54px] leading-[1.2] tracking-[-0.025em] text-balance text-brand-charcoal">
          <span
            className="text-brand-plum text-[76px] leading-[0.4] align-[-0.2em]"
            aria-hidden
          >
            “
          </span>
          {story.before}
          <span className="italic text-brand-sage">{story.highlight}</span>
          {story.after}
          <span
            className="text-brand-plum text-[76px] leading-[0.4] align-[-0.55em]"
            aria-hidden
          >
            ”
          </span>
        </blockquote>
        <figcaption className="mt-7 font-mono text-[11px] uppercase tracking-[0.16em] text-brand-slate">
          — {story.byline}{" "}
          <span className="text-brand-plum">·</span> {story.where}
        </figcaption>
      </figure>

      {/* Navigation — prev/next chevron buttons flanking dot indicators.
       *  Chevrons kept small and ink-line so they read as marginalia,
       *  not slider chrome. Dots in between let users jump directly. */}
      <div
        className="mt-7 flex items-center justify-center gap-4"
        role="tablist"
        aria-label="Customer stories"
      >
        <button
          type="button"
          aria-label="Previous story"
          onClick={() => goTo(idx - 1)}
          className="w-8 h-8 inline-flex items-center justify-center rounded-full text-brand-plum hover:bg-brand-plum/10 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          {STORIES.map((s, i) => (
            <button
              key={s.byline}
              type="button"
              role="tab"
              aria-selected={i === idx}
              aria-label={`Story ${i + 1} of ${STORIES.length} — ${s.byline}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx
                  ? "w-8 bg-brand-plum"
                  : "w-2 bg-brand-charcoal/20 hover:bg-brand-charcoal/40"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next story"
          onClick={() => goTo(idx + 1)}
          className="w-8 h-8 inline-flex items-center justify-center rounded-full text-brand-plum hover:bg-brand-plum/10 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
