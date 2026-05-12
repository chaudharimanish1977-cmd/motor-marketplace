"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

const COMPARISONS: { emoji: string; text: string; theme: ThemeKey }[] = [
  { emoji: "🍜", text: "Faster than your Maggi finishes cooking", theme: "amber" },
  { emoji: "🍵", text: "Quicker than your morning chai brews", theme: "emerald" },
  { emoji: "🛺", text: "Faster than waiting for an auto on Ola", theme: "yellow" },
  { emoji: "📞", text: "Less time than an insurance call-centre IVR menu", theme: "rose" },
  { emoji: "☕", text: "Quicker than your Starbucks order", theme: "orange" },
  { emoji: "🚦", text: "Shorter than two Mumbai traffic signals", theme: "red" },
  { emoji: "🍕", text: "Half the time of a Domino's promised delivery", theme: "rose" },
  { emoji: "🎵", text: "Less than 2 Bollywood song hooks", theme: "purple" },
  { emoji: "🛒", text: "Faster than a Zepto 10-minute delivery", theme: "indigo" },
  { emoji: "📱", text: "Quicker than UPI&apos;s busy-hour timeout", theme: "blue" },
  { emoji: "🍳", text: "Shorter than scrambling 2 eggs", theme: "yellow" },
  { emoji: "🧋", text: "Less than your bubble tea queue", theme: "fuchsia" },
];

type ThemeKey =
  | "amber"
  | "emerald"
  | "yellow"
  | "rose"
  | "orange"
  | "red"
  | "purple"
  | "indigo"
  | "blue"
  | "fuchsia";

const THEMES: Record<ThemeKey, string> = {
  amber:
    "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-300 text-amber-900",
  emerald:
    "bg-gradient-to-r from-emerald-100 to-emerald-50 border-emerald-300 text-emerald-900",
  yellow:
    "bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300 text-yellow-900",
  rose:
    "bg-gradient-to-r from-rose-100 to-rose-50 border-rose-300 text-rose-900",
  orange:
    "bg-gradient-to-r from-orange-100 to-orange-50 border-orange-300 text-orange-900",
  red: "bg-gradient-to-r from-red-100 to-red-50 border-red-300 text-red-900",
  purple:
    "bg-gradient-to-r from-purple-100 to-purple-50 border-purple-300 text-purple-900",
  indigo:
    "bg-gradient-to-r from-indigo-100 to-indigo-50 border-indigo-300 text-indigo-900",
  blue:
    "bg-gradient-to-r from-blue-100 to-blue-50 border-blue-300 text-blue-900",
  fuchsia:
    "bg-gradient-to-r from-fuchsia-100 to-fuchsia-50 border-fuchsia-300 text-fuchsia-900",
};

interface Props {
  className?: string;
  /** ms between rotations. Default 3500. */
  intervalMs?: number;
}

/**
 * Light, playful "while you wait" banner — Zomato-style copy that frames the
 * <2 min latency in everyday Indian terms (chai, Maggi, traffic signals).
 * Picks a random subset on mount and cycles them; each line carries its own
 * colour theme so the banner feels alive instead of one static pill.
 */
export function TimeComparison({ className, intervalMs = 3500 }: Props) {
  const picks = useMemo(() => pickRandom(COMPARISONS, 5), []);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % picks.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [picks.length, intervalMs]);

  const current = picks[idx];
  const themeClass = THEMES[current.theme];

  return (
    <div
      key={idx}
      className={clsx(
        "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 text-xs shadow-soft animate-in fade-in slide-in-from-bottom-1 duration-300",
        themeClass,
        className
      )}
      aria-live="polite"
    >
      <span className="text-lg leading-none" aria-hidden>
        {current.emoji}
      </span>
      <span
        className="font-semibold"
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
