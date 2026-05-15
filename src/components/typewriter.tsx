"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

interface Props {
  text: string;
  speed?: number; // ms per character
  className?: string;
  caretClassName?: string;
  startDelay?: number;
}

/**
 * Reveals text character-by-character with a blinking caret.
 * Use sparingly — best for hero/takeaway moments. The caret disappears
 * once typing completes.
 */
export function Typewriter({
  text,
  speed = 30,
  className,
  caretClassName,
  startDelay = 200,
}: Props) {
  const [visibleLen, setVisibleLen] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setVisibleLen(0);
    setDone(false);
    const startTimer = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setVisibleLen(i);
        if (i >= text.length) {
          clearInterval(interval);
          setTimeout(() => setDone(true), 800);
        }
      }, speed);
    }, startDelay);

    return () => clearTimeout(startTimer);
  }, [text, speed, startDelay]);

  return (
    <span className={className}>
      {text.slice(0, visibleLen)}
      {!done && (
        <span
          className={clsx(
            "inline-block w-[2px] h-[1em] align-middle ml-0.5 -mt-0.5 bg-current animate-caret",
            caretClassName
          )}
        />
      )}
    </span>
  );
}

interface CycleProps {
  messages: string[];
  /** ms per character while typing forward */
  typeSpeed?: number;
  /** ms per character while erasing */
  eraseSpeed?: number;
  /** ms to hold the fully-typed message before erasing */
  holdMs?: number;
  className?: string;
  caretClassName?: string;
}

/**
 * Loops through `messages`, typing each one, holding, erasing, and moving
 * to the next. Used as a working/loading indicator in place of a spinner —
 * the active caret + visible progress carries the same "we're working"
 * read, but lets us communicate WHAT we're working on, not just that we
 * are. Caret stays visible throughout (unlike single-shot `<Typewriter/>`).
 */
export function TypewriterCycle({
  messages,
  typeSpeed = 38,
  eraseSpeed = 22,
  holdMs = 1400,
  className,
  caretClassName,
}: CycleProps) {
  const [idx, setIdx] = useState(0);
  const [visibleLen, setVisibleLen] = useState(0);
  const [phase, setPhase] = useState<"typing" | "hold" | "erasing">("typing");

  const current = messages[idx] ?? "";

  useEffect(() => {
    if (!messages.length) return;
    if (phase === "typing") {
      if (visibleLen < current.length) {
        const t = setTimeout(() => setVisibleLen((l) => l + 1), typeSpeed);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("hold"), 0);
      return () => clearTimeout(t);
    }
    if (phase === "hold") {
      const t = setTimeout(() => setPhase("erasing"), holdMs);
      return () => clearTimeout(t);
    }
    // erasing
    if (visibleLen > 0) {
      const t = setTimeout(() => setVisibleLen((l) => l - 1), eraseSpeed);
      return () => clearTimeout(t);
    }
    setIdx((i) => (i + 1) % messages.length);
    setPhase("typing");
  }, [phase, visibleLen, current, messages.length, typeSpeed, eraseSpeed, holdMs]);

  return (
    <span className={className} aria-live="polite">
      {current.slice(0, visibleLen)}
      <span
        className={clsx(
          "inline-block w-[2px] h-[1em] align-middle ml-0.5 -mt-0.5 bg-current animate-caret",
          caretClassName,
        )}
      />
    </span>
  );
}
