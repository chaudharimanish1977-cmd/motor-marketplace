"use client";

import { useEffect, useState } from "react";

/**
 * Thin top progress bar that tracks scroll depth on long pages.
 * Adds a sense of progress + signals "this is a deep page worth scrolling".
 */
export function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY;
      const height =
        document.documentElement.scrollHeight - window.innerHeight;
      setPct(height > 0 ? Math.min(100, (top / height) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 bg-transparent z-50 pointer-events-none print:hidden">
      <div
        className="h-full bg-gradient-to-r from-brand-charcoal via-brand-plum to-brand-sage transition-[width] duration-100 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
