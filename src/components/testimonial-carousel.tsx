"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

interface Story {
  quote: string;
  author: string;
  cityRole: string;
}

const STORIES: Story[] = [
  {
    quote:
      "Saved me ₹35,000 out of pocket when my claim happened — entirely borne by the insurer because of an add-on RightOffer recommended. Had I continued with my old policy, that would have been my loss.",
    author: "Arjun M.",
    cityRole: "Pune · SUV owner",
  },
  {
    quote:
      "RightOffer flagged that my engine protector was missing. Two months later when my car got water-logged in the monsoon, the entire ₹85,000 repair was borne by the insurer. Without their advice I'd have paid it out of pocket.",
    author: "Nikhil R.",
    cityRole: "Mumbai · Hatchback owner",
  },
  {
    quote:
      "I was about to auto-renew with my old insurer. The review showed my IDV was undervalued by ₹2.4 lakh. Switched to a properly-priced policy at the same premium. Right advice by the RightOffer team.",
    author: "Priya S.",
    cityRole: "Bengaluru · Sedan owner",
  },
  {
    quote:
      "Two minutes to know exactly what was missing in my policy. The claim simulator made the gaps real — I added NCB Protection and Zero Dep at renewal. Worth every second.",
    author: "Rohan K.",
    cityRole: "Hyderabad · Compact SUV owner",
  },
];

const AUTOPLAY_MS = 5500;

export function TestimonialCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % STORIES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused]);

  const current = STORIES[idx];

  const goTo = (n: number) =>
    setIdx(((n % STORIES.length) + STORIES.length) % STORIES.length);

  return (
    <section className="max-w-3xl w-full mt-16">
      <div
        className="relative rounded-3xl bg-gradient-to-br from-white to-brand-offwhite border border-brand-light-gray shadow-soft p-7 md:p-9 min-h-[260px] md:min-h-[230px] overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Decorative quote mark */}
        <Quote
          className="absolute top-5 left-5 w-12 h-12 text-brand-deepblue/10"
          aria-hidden
        />

        {/* The card content — fades in on idx change */}
        <figure
          key={idx}
          className="relative animate-in fade-in duration-500"
        >
          <blockquote className="text-base md:text-lg text-brand-charcoal leading-relaxed font-medium text-center pt-2">
            &ldquo;{current.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-4 text-sm text-center">
            <span className="font-semibold text-brand-charcoal">
              {current.author}
            </span>
            <span className="text-brand-slate"> · {current.cityRole}</span>
          </figcaption>
        </figure>

        {/* Arrow controls — visible on hover (desktop) and always (mobile) */}
        <button
          type="button"
          aria-label="Previous review"
          onClick={() => goTo(idx - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-brand-light-gray shadow-soft flex items-center justify-center text-brand-slate hover:text-brand-deepblue hover:border-brand-electricblue transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Next review"
          onClick={() => goTo(idx + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-brand-light-gray shadow-soft flex items-center justify-center text-brand-slate hover:text-brand-deepblue hover:border-brand-electricblue transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {STORIES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to review ${i + 1}`}
            onClick={() => goTo(i)}
            className={clsx(
              "h-1.5 rounded-full transition-all",
              i === idx
                ? "w-8 bg-brand-deepblue"
                : "w-2 bg-brand-light-gray hover:bg-brand-slate/50"
            )}
          />
        ))}
      </div>
    </section>
  );
}
