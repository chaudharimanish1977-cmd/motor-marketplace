"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

interface Props {
  /** Epoch ms when the timer started counting from. */
  startedAt: number;
  /** Outer diameter in pixels. */
  size?: number;
  className?: string;
}

/**
 * Stopwatch-style elapsed-time indicator: a circular ring that sweeps
 * clockwise over each 60-second cycle, with the live elapsed time in the
 * centre. The ring fills, hits 12 o'clock at the full minute, then resets —
 * mimicking a real stopwatch's second hand so users intuit "time is
 * counting" without having to read the number.
 */
export function StopwatchChip({ startedAt, size = 54, className }: Props) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const elapsedSec = Math.max(0, Math.floor((now - startedAt) / 1000));
  const display =
    elapsedSec < 60
      ? `${elapsedSec}s`
      : `${Math.floor(elapsedSec / 60)}:${(elapsedSec % 60)
          .toString()
          .padStart(2, "0")}`;

  // Progress within the current minute, 0..1, sweeping clockwise
  const progress = (((now - startedAt) % 60000) + 60000) % 60000;
  const sweep = progress / 60000;

  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // dashoffset goes from full circumference (empty ring) to 0 (full ring)
  const offset = circumference * (1 - sweep);

  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={`Elapsed time ${display}`}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="block"
      >
        {/* Background track — theme-aware via CSS vars so it flips
            with light/dark mode (surface = white in light, dark slate
            in dark). */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="rgb(var(--color-surface))"
          stroke="rgb(var(--color-charcoal) / 0.12)"
          strokeWidth={stroke}
        />
        {/* Sweeping progress ring — plum so it stays the editorial
            accent across both themes (was orange, now matches the
            Reading Room palette). */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgb(var(--color-plum))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
        {/* Subtle centre dot, like a watch pivot. Uses charcoal token
            so it flips light in dark mode and stays visible. */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={1.5}
          fill="rgb(var(--color-charcoal))"
          opacity="0.5"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums text-brand-navy">
        {display}
      </span>
    </div>
  );
}
