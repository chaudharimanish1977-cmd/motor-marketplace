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
