"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

type AnimKey = "bob" | "wobble" | "spin" | "shake" | "pulse";

const ANIM_CLASS: Record<AnimKey, string> = {
  bob: "animate-emoji-bob",
  wobble: "animate-emoji-wobble",
  spin: "animate-emoji-spin",
  shake: "animate-emoji-shake",
  pulse: "animate-emoji-pulse",
};

const COMPARISONS: {
  emoji: string;
  text: string;
  theme: ThemeKey;
  anim: AnimKey;
}[] = [
  // Food + drinks
  { emoji: "🍜", text: "Faster than your Maggi finishes cooking", theme: "amber", anim: "bob" },
  { emoji: "🍵", text: "Quicker than your morning chai brews", theme: "emerald", anim: "wobble" },
  { emoji: "☕", text: "Quicker than your Starbucks order", theme: "orange", anim: "bob" },
  { emoji: "🧋", text: "Less than your bubble tea queue", theme: "fuchsia", anim: "wobble" },
  { emoji: "🍳", text: "Shorter than scrambling 2 eggs", theme: "yellow", anim: "shake" },
  { emoji: "🍕", text: "Half the time of a Domino's promised delivery", theme: "rose", anim: "spin" },
  { emoji: "🍦", text: "Quicker than a kulfi melts in May", theme: "fuchsia", anim: "bob" },
  { emoji: "🍪", text: "Quicker than dunking a Parle-G in chai", theme: "amber", anim: "bob" },
  { emoji: "🥥", text: "Faster than cracking a tender coconut", theme: "emerald", anim: "wobble" },
  { emoji: "🌶️", text: "Faster than the burn from a green-chilli bite", theme: "red", anim: "shake" },
  { emoji: "🥟", text: "Quicker than a momo cools down", theme: "amber", anim: "bob" },
  { emoji: "🧊", text: "Less time than ice melts in nimbu pani", theme: "blue", anim: "wobble" },
  { emoji: "🍯", text: "Less than honey drips off a spoon", theme: "amber", anim: "bob" },

  // Tech + apps
  { emoji: "📱", text: "Quicker than UPI&apos;s busy-hour timeout", theme: "blue", anim: "pulse" },
  { emoji: "💸", text: "Quicker than typing your UPI PIN twice", theme: "emerald", anim: "bob" },
  { emoji: "📺", text: "Faster than skipping a YouTube ad", theme: "blue", anim: "pulse" },
  { emoji: "🎟️", text: "Quicker than a BookMyShow OTP arrives", theme: "orange", anim: "wobble" },
  { emoji: "📦", text: "Quicker than opening an Amazon parcel", theme: "yellow", anim: "shake" },
  { emoji: "📨", text: "Less than Gmail's smart-reply suggestion", theme: "indigo", anim: "pulse" },
  { emoji: "🛒", text: "Faster than a Zepto 10-minute delivery", theme: "indigo", anim: "shake" },
  { emoji: "🛵", text: "Shorter than the Swiggy rider call-back", theme: "red", anim: "shake" },

  // Travel + everyday
  { emoji: "🛺", text: "Faster than waiting for an auto on Ola", theme: "yellow", anim: "shake" },
  { emoji: "🚦", text: "Shorter than two Mumbai traffic signals", theme: "red", anim: "pulse" },
  { emoji: "🚂", text: "Less than the IRCTC session timer", theme: "indigo", anim: "shake" },
  { emoji: "🚎", text: "Less than the BEST bus wait at peak hour", theme: "red", anim: "shake" },
  { emoji: "📞", text: "Less than an insurance call-centre IVR menu", theme: "rose", anim: "shake" },
  { emoji: "🚿", text: "Less than a quick monsoon shower", theme: "blue", anim: "bob" },

  // Sports + entertainment
  { emoji: "🏏", text: "Shorter than one T20 over", theme: "emerald", anim: "shake" },
  { emoji: "⚽", text: "Faster than a football half-time break", theme: "emerald", anim: "spin" },
  { emoji: "🎵", text: "Less than 2 Bollywood song hooks", theme: "purple", anim: "bob" },
  { emoji: "🎤", text: "Less than your antakshari turn", theme: "purple", anim: "pulse" },
  { emoji: "🎢", text: "Faster than a Wonderla queue moves an inch", theme: "rose", anim: "bob" },

  // Misc India-life
  { emoji: "🪁", text: "Faster than a Sankranti patang dives", theme: "fuchsia", anim: "wobble" },
  { emoji: "🚀", text: "Quicker than a Diwali rocket fizzles", theme: "orange", anim: "spin" },
  { emoji: "🌧️", text: "Quicker than Mumbai's first monsoon shower", theme: "blue", anim: "bob" },
  { emoji: "🛏️", text: "Faster than your morning snooze button", theme: "indigo", anim: "bob" },
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
  /** "horizontal" (default): emoji left, text pill right.
   *  "vertical": emoji big at top centred, text pill below — used on the
   *  /report/[id] loading screen where the emoji is the hero. */
  layout?: "horizontal" | "vertical";
}

/**
 * Light, playful "while you wait" banner — Zomato-style copy that frames the
 * <2 min latency in everyday Indian terms (chai, Maggi, traffic signals).
 * Picks a random subset on mount and cycles them; each line carries its own
 * colour theme so the banner feels alive instead of one static pill.
 */
export function TimeComparison({
  className,
  intervalMs = 3500,
  layout = "horizontal",
}: Props) {
  // Shuffle the FULL pool once on mount. At ~3.5s per rotation and 35+
  // entries we cycle for ~2 minutes before any repeat — enough to cover
  // the longest parse + report-gen wait.
  const picks = useMemo(
    () => pickRandom(COMPARISONS, COMPARISONS.length),
    []
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % picks.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [picks.length, intervalMs]);

  const current = picks[idx];
  const themeClass = THEMES[current.theme];

  const animClass = ANIM_CLASS[current.anim];

  if (layout === "vertical") {
    return (
      <div
        className={clsx(
          "flex flex-col items-center justify-center gap-2 w-full min-h-[7rem]",
          className
        )}
      >
        {/* Outer span handles the one-shot zoom-in entrance; inner span runs
         *  the per-emoji continuous animation (bob, wobble, spin, etc). */}
        <span
          key={`emoji-${idx}`}
          className="inline-block leading-none animate-in zoom-in-50 duration-300"
          aria-hidden
        >
          <span
            className={clsx(
              "inline-block text-6xl md:text-7xl leading-none",
              animClass
            )}
          >
            {current.emoji}
          </span>
        </span>
        <span
          key={`text-${idx}`}
          className={clsx(
            "inline-flex items-center px-4 py-2 rounded-2xl border-2 text-sm shadow-soft animate-in fade-in duration-300 max-w-[20rem]",
            themeClass
          )}
          aria-live="polite"
        >
          <span
            className="font-semibold leading-snug text-center"
            dangerouslySetInnerHTML={{ __html: current.text }}
          />
        </span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex items-center justify-center gap-3 min-h-[4rem] w-full",
        className
      )}
    >
      <span
        key={`emoji-${idx}`}
        className="inline-block leading-none shrink-0 animate-in zoom-in-50 duration-300"
        aria-hidden
      >
        <span
          className={clsx(
            "inline-block text-4xl md:text-5xl leading-none",
            animClass
          )}
        >
          {current.emoji}
        </span>
      </span>
      <span
        key={`text-${idx}`}
        className={clsx(
          "inline-flex items-center px-3.5 py-2 rounded-2xl border-2 text-xs sm:text-sm shadow-soft animate-in fade-in slide-in-from-left-2 duration-300 max-w-[16rem] sm:max-w-[18rem]",
          themeClass
        )}
        aria-live="polite"
      >
        <span
          className="font-semibold leading-snug"
          dangerouslySetInnerHTML={{ __html: current.text }}
        />
      </span>
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
