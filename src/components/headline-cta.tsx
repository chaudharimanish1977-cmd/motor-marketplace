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
import Link from "next/link";
import { LoadingLink } from "@/components/loading-link";

const FORWARD_ADDRESS = "review@rightoffer.in";
/** mailto link that opens the default mail client pre-filled with To
 *  and a draft subject. Subject is deliberately generic — the customer
 *  will likely paste/forward something inline anyway, but a pre-filled
 *  subject prevents "no subject" bounces on stricter mail servers. */
const FORWARD_MAILTO = `mailto:${FORWARD_ADDRESS}?subject=My%20motor%20insurance%20policy`;

type Priority = "pay_less" | "worry_less" | null;

const STORAGE_KEY = "ro-profile-priority";

export interface HeadlineCTALabels {
  /** Chip text — "I want to pay less" by default. */
  chipPayLess: string;
  /** Chip text — "I want to worry less" by default. */
  chipWorryLess: string;
  /** Pill button text — "Get my free 2-minute review" by default. */
  ctaPrimary: string;
  /** Trust caption — "Trusted by 1,000+ Indian car owners" by default. */
  trustLine: string;
  /** Soft link below the trust line — "or see a sample review" by default. */
  sampleLink: string;
}

const DEFAULT_LABELS: HeadlineCTALabels = {
  chipPayLess: "I want to pay less",
  chipWorryLess: "I want to worry less",
  ctaPrimary: "Get my free 2-minute review",
  trustLine: "Trusted by 1,000+ Indian car owners",
  sampleLink: "or see a sample review",
};

interface HeadlineCTAProps {
  /** Translated labels for every visible string. When unset, the
   *  component falls back to its English copy — useful for storybooks /
   *  isolated previews. */
  labels?: HeadlineCTALabels;
}

export function HeadlineCTA({ labels = DEFAULT_LABELS }: HeadlineCTAProps) {
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
          {labels.chipPayLess}
        </Chip>
        <Chip
          active={priority === "worry_less"}
          onClick={() => toggle("worry_less")}
        >
          {labels.chipWorryLess}
        </Chip>
      </div>

      <LoadingLink
        href={ctaHref}
        className="inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-7 py-4 rounded-full font-serif italic font-medium text-[18px] hover:opacity-90 transition-opacity"
      >
        {labels.ctaPrimary} <span aria-hidden>→</span>
      </LoadingLink>

      {/* "OR" divider — visually separates the two CTAs so they read
       *  as co-equal alternatives rather than primary + secondary.
       *  Light enough not to compete with either pill. */}
      <div className="flex items-center gap-3 mt-4 mb-3 max-w-[280px] w-full">
        <div className="flex-1 h-px bg-brand-charcoal/10" />
        <span className="font-serif italic text-[13px] text-brand-slate">
          or
        </span>
        <div className="flex-1 h-px bg-brand-charcoal/10" />
      </div>

      {/* Forward CTA — co-equal alternative to the upload pill.
       *  mailto link opens the customer's default mail client with
       *  To: pre-filled, which is muscle memory in a way that
       *  copy-paste isn't. Mobile mail apps honour mailto cleanly. */}
      <a
        href={FORWARD_MAILTO}
        className="inline-flex items-center gap-1 bg-brand-sage text-brand-offwhite px-7 py-4 rounded-full font-serif italic font-medium text-[18px] hover:opacity-90 transition-opacity"
      >
        Forward to {FORWARD_ADDRESS} <span aria-hidden>→</span>
      </a>
      <p className="mt-2 font-serif italic text-[13.5px] text-brand-slate max-w-md text-center text-balance">
        Drop the insurer email straight from your inbox. We&rsquo;ll
        read it and reply with the audit.
      </p>

      {/* Trust line — small mono sage caption to anchor the CTA with a
       *  proof point above the fold. */}
      <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage">
        · {labels.trustLine} ·
      </p>

      {/* Soft escape hatch for visitors who aren't ready to upload yet —
       *  small italic-serif link to three anonymised sample reviews. */}
      <Link
        href="/sample-review"
        className="mt-3 font-serif italic text-[14px] text-brand-slate hover:text-brand-plum transition-colors"
      >
        {labels.sampleLink} →
      </Link>
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
      {children}
    </button>
  );
}
