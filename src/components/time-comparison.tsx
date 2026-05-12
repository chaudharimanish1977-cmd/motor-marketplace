"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

const COMPARISONS: { emoji: string; text: string }[] = [
  { emoji: "🍜", text: "Faster than your Maggi finishes cooking" },
  { emoji: "🍵", text: "Quicker than your morning chai brews" },
  { emoji: "🛺", text: "Faster than waiting for an auto on Ola" },
  { emoji: "📞", text: "Less time than an insurance call-centre IVR menu" },
  { emoji: "☕", text: "Quicker than your Starbucks order" },
  { emoji: "🚦", text: "Shorter than two Mumbai traffic signals" },
  { emoji: "🍕", text: "Half the time of a Domino's promised delivery" },
  { emoji: "🎵", text: "Less than 2 Bollywood song hooks" },
  { emoji: "🛒", text: "Faster than a Zepto 10-minute delivery" },
  { emoji: "📱", text: "Quicker than UPI&apos;s busy-hour timeout" },
  { emoji: "🍳", text: "Shorter than scrambling 2 eggs" },
  { emoji: "🧋", text: "Less than your bubble tea queue" },
];

interface Props {
  className?: string;
  /** ms between rotations. Default 3500. */
  intervalMs?: number;
}

/**
 * Light, playful "while you wait" banner — Zomato-style copy that frames the
 * <2 min latency in everyday Indian terms (chai, Maggi, traffic signals).
 * Picks a random subset on mount and cycles them so repeat views feel fresh.
 */
export function TimeComparison({ className, intervalMs = 3500 }: Props) {
  const picks = useMemo(() => pickRandom(COMPARISONS, 4), []);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % picks.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [picks.length, intervalMs]);

  const current = picks[idx];

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur border border-brand-light-gray/60 text-xs text-brand-charcoal shadow-soft",
        className
      )}
      aria-live="polite"
    >
      <span className="text-base leading-none" aria-hidden>
        {current.emoji}
      </span>
      <span
        key={idx}
        className="font-medium animate-pulse-soft"
        // dangerouslySetInnerHTML to render `&apos;` HTML entity correctly
        dangerouslySetInnerHTML={{ __html: current.text }}
      />
    </div>
  );
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
