/**
 * HeadlineCTA — the above-the-fold action block on the home page.
 *
 * Owns three elements that need to coordinate as a single unit:
 *
 *   1. A pair of profile chips ("Pay less" / "Worry less") that capture
 *      the customer's underlying priority before they upload. Skippable
 *      (no selection is required to click the CTA), toggleable (click
 *      again to deselect), and persisted in sessionStorage so the choice
 *      survives a refresh or browser-back. The selection is also passed
 *      as a `?priority=` query param when the user clicks the CTA so the
 *      /upload flow can read it without needing access to sessionStorage.
 *
 *   2. The primary CTA pill itself ("Get my free 2-minute review →").
 *
 *   3. The mono-sage trust caption below the pill.
 *
 * Wrapped in a single client component because the chip state needs to
 * affect the CTA's href. Keeping it as one unit also means the visual
 * grouping (chips → button → trust line) stays atomic.
 */
"use client";

import { useEffect, useState } from "react";
import { LoadingLink } from "@/components/loading-link";

type Priority = "pay_less" | "worry_less" | null;

const STORAGE_KEY = "ro-profile-priority";

export function HeadlineCTA() {
  const [priority, setPriority] = useState<Priority>(null);

  // Hydrate from sessionStorage on mount. Done in useEffect so the
  // server-rendered HTML stays neutral (avoids hydration mismatch).
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === "pay_less" || stored === "worry_less") {
        setPriority(stored);
      }
    } catch {
      // sessionStorage might be unavailable (private mode, embedded
      // contexts). Silently fall back to the unselected state.
    }
  }, []);

  const toggle = (value: Exclude<Priority, null>) => {
    setPriority((current) => {
      const next = current === value ? null : value;
      try {
        if (next) {
          sessionStorage.setItem(STORAGE_KEY, next);
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // ignore
      }
      return next;
    });
  };

  const ctaHref = priority ? `/upload?priority=${priority}` : "/upload";

  return (
    <div className="mt-7 md:mt-8 flex flex-col items-center">
      {/* Profile chips. Two toggleable, skippable choices that capture the
       *  customer's underlying priority before they upload. Italic-serif
       *  to match the editorial voice; subtle plum tint when selected. */}
      <div
        role="group"
        aria-label="What matters most to you about your insurance"
        className="flex flex-wrap items-center justify-center gap-2 mb-5"
      >
        <Chip
          active={priority === "pay_less"}
          onClick={() => toggle("pay_less")}
        >
          Pay less
        </Chip>
        <Chip
          active={priority === "worry_less"}
          onClick={() => toggle("worry_less")}
        >
          Worry less
        </Chip>
      </div>

      <LoadingLink
        href={ctaHref}
        className="inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-7 py-4 rounded-full font-serif italic font-medium text-[18px] hover:opacity-90 transition-opacity"
      >
        Get my free 2-minute review <span aria-hidden>→</span>
      </LoadingLink>

      {/* Trust line — small mono sage caption to anchor the CTA with a
       *  proof point above the fold. */}
      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage">
        · Trusted by 1,000+ Indian car owners ·
      </p>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center px-4 py-1.5 rounded-full border font-serif italic text-sm transition-all ${
        active
          ? "border-brand-plum bg-brand-plum/10 text-brand-plum"
          : "border-brand-charcoal/20 text-brand-slate hover:border-brand-charcoal/50 hover:text-brand-charcoal"
      }`}
    >
      I want to {children}
    </button>
  );
}
