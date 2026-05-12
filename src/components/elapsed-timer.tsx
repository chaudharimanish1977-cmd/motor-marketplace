"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Timer } from "lucide-react";

interface Props {
  /** Epoch ms when the timer should start counting from. Defaults to now. */
  startedAt?: number;
  /** When provided, the timer freezes at this elapsed value (ms). */
  frozenAtMs?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  prefix?: string;
}

/**
 * Live-counting elapsed-time display. Used during the parse + report
 * generation flow so users get a tangible "this is fast" cue, and on the
 * final report header to celebrate the actual end-to-end latency.
 */
export function ElapsedTimer({
  startedAt,
  frozenAtMs,
  className,
  size = "md",
  showIcon = true,
  prefix,
}: Props) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (frozenAtMs !== undefined) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [frozenAtMs]);

  const elapsedMs =
    frozenAtMs !== undefined ? frozenAtMs : now - (startedAt ?? now);
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const display =
    seconds < 60
      ? `${seconds}s`
      : `${Math.floor(seconds / 60)}m ${(seconds % 60).toString().padStart(2, "0")}s`;

  const sizeClass = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-2xl px-4 py-2 gap-2 font-bold tabular-nums",
  }[size];

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-5 h-5",
  }[size];

  return (
    <span
      className={clsx(
        "inline-flex items-center font-semibold tabular-nums",
        sizeClass,
        className
      )}
    >
      {showIcon && <Timer className={iconSize} />}
      {prefix && <span>{prefix}</span>}
      <span>{display}</span>
    </span>
  );
}
