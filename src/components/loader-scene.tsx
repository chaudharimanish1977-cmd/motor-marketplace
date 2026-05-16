/**
 * LoaderScene — the cutest loader the brand has.
 *
 * Layered scene composed of:
 *   · Soft cream / surface background panel
 *   · Sparkle accents scattered across the panel (ambient)
 *   · The animated SketchCar bouncing in the centre, with its dashed
 *     road moving underneath (existing motion from sketches.tsx)
 *   · Three floating ink-line "clause badges" (IDV, NCB, Zero-Dep)
 *     drifting up around the car
 *   · A monospace status caption that cycles through the parsing
 *     stages ("Reading your policy", "Checking IDV", "Looking for
 *     gaps", "Almost done")
 *
 * Mounted on the upload page during the parsing wait — replaces the
 * generic spinner moment with the highest-anxiety-to-delight swap in
 * the funnel.
 *
 * The loader is *intentionally* over the top — it's the place where
 * customer trust gets built or broken, so we lean cute hard.
 */
"use client";

import { useEffect, useState } from "react";
import { SketchCar } from "@/components/sketches";

const STATUS_MESSAGES = [
  "Reading your policy",
  "Checking your IDV",
  "Looking for gaps",
  "Reviewing add-ons",
  "Almost done",
];

const CLAUSE_BADGES = [
  { label: "IDV", angle: "-rotate-3" },
  { label: "NCB", angle: "rotate-2" },
  { label: "Zero-Dep", angle: "-rotate-1" },
];

const ROTATE_MS = 1800;

export interface LoaderSceneProps {
  /** Render width of the inner stage. Default 520. */
  width?: number;
  className?: string;
}

export function LoaderScene({ width = 520, className }: LoaderSceneProps) {
  const [messageIdx, setMessageIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setMessageIdx((i) => (i + 1) % STATUS_MESSAGES.length),
      ROTATE_MS
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-brand-surface border border-brand-charcoal/10 ${className ?? ""}`}
      style={{ maxWidth: width }}
    >
      {/* ── Decorative sparkles ───────────────────────────────────── */}
      <Sparkle className="absolute top-6 left-10 text-brand-sage" />
      <Sparkle className="absolute top-10 right-14 text-brand-plum" />
      <Sparkle small className="absolute top-20 left-1/3 text-brand-sage" />
      <Sparkle small className="absolute bottom-20 right-12 text-brand-plum" />
      <Sparkle className="absolute bottom-10 left-16 text-brand-sage" />

      {/* ── Floating clause badges ────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {CLAUSE_BADGES.map((badge, i) => (
          <div
            key={badge.label}
            className={`absolute inline-flex items-center gap-1 px-2 py-1 rounded-full border border-brand-plum/40 bg-brand-offwhite font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-brand-plum ${badge.angle} ro-float`}
            style={{
              top: i === 0 ? "20%" : i === 1 ? "32%" : "58%",
              left: i === 0 ? "12%" : i === 2 ? "8%" : "auto",
              right: i === 1 ? "14%" : undefined,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            {badge.label}
          </div>
        ))}
      </div>

      {/* ── The car (centred, bouncing) ───────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-12 pb-10 px-8 text-brand-plum">
        <SketchCar width={220} color="currentColor" />

        {/* ── Cycling status caption ───────────────────────────────── */}
        <div className="mt-6 text-center min-h-[28px]">
          <div
            key={messageIdx}
            className="inline-flex items-center gap-2 font-serif italic text-base md:text-lg text-brand-charcoal animate-in fade-in duration-500"
          >
            <span>{STATUS_MESSAGES[messageIdx]}</span>
            <Dots />
          </div>
        </div>

        {/* ── Reassurance line ─────────────────────────────────────── */}
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-sage">
          · Usually under 2 minutes ·
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────── */

function Sparkle({
  small = false,
  className,
}: {
  small?: boolean;
  className?: string;
}) {
  const size = small ? 10 : 14;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      className={`opacity-60 ${className ?? ""}`}
      aria-hidden
    >
      <line x1="7" y1="1" x2="7" y2="13" />
      <line x1="1" y1="7" x2="13" y2="7" />
      <line x1="3" y1="3" x2="11" y2="11" opacity={0.6} />
      <line x1="11" y1="3" x2="3" y2="11" opacity={0.6} />
    </svg>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-0.5">
      <span
        className="w-1 h-1 rounded-full bg-current animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="w-1 h-1 rounded-full bg-current animate-bounce"
        style={{ animationDelay: "120ms" }}
      />
      <span
        className="w-1 h-1 rounded-full bg-current animate-bounce"
        style={{ animationDelay: "240ms" }}
      />
    </span>
  );
}
