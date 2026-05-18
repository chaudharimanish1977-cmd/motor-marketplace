/**
 * Language switcher — replaces the static "EN · हिंदी" placeholder pill
 * in the home page footer.
 *
 * Behaviour:
 *   · Pill shows the currently-selected locale's native name (e.g.
 *     "हिंदी") with a small chevron.
 *   · Tap → opens a popover listing all 7 locales with their native
 *     name + English-name caption. Active one is highlighted in plum.
 *   · Tap a locale → invokes the server action `setLocaleAction`,
 *     which writes the cookie + revalidates. The page re-renders in
 *     the chosen language without a hard navigation.
 *
 * Visual treatment matches the editorial system: bordered
 * pill, mono uppercase for the EN code, serif body for native scripts,
 * subtle plum tint on the active row.
 */
"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import {
  LOCALE_OPTIONS,
  type Locale,
  type LocaleOption,
} from "@/lib/locales";
import { setLocaleAction } from "@/app/actions/set-locale";

interface Props {
  /** Locale the page is currently rendering in (resolved server-side). */
  current: Locale;
}

export function LanguageSwitcher({ current }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const currentOption: LocaleOption =
    LOCALE_OPTIONS.find((o) => o.code === current) ?? LOCALE_OPTIONS[0];

  // Close the popover when the user clicks outside or hits Escape.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (locale: Locale) => {
    if (locale === current) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await setLocaleAction(locale);
      setOpen(false);
    });
  };

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${currentOption.english}. Tap to change.`}
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="inline-flex items-center gap-2 border border-brand-charcoal/15 rounded-full px-3 py-1 normal-case tracking-normal hover:border-brand-charcoal/40 transition-colors disabled:opacity-60"
      >
        <span className="font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-brand-charcoal">
          {currentOption.code === "en" ? "EN" : currentOption.code.toUpperCase()}
        </span>
        <span className="text-brand-charcoal/30" aria-hidden>
          ·
        </span>
        <span className="font-serif text-[12px] text-brand-slate">
          {currentOption.native}
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Choose a language"
          className="absolute right-0 bottom-full mb-2 min-w-[180px] rounded-2xl border border-brand-charcoal/15 bg-brand-offwhite shadow-elevated overflow-hidden text-left z-50"
        >
          {LOCALE_OPTIONS.map((opt) => {
            const isActive = opt.code === current;
            return (
              <li key={opt.code} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => pick(opt.code)}
                  className={`w-full flex items-baseline justify-between gap-3 px-4 py-2.5 transition-colors normal-case tracking-normal ${
                    isActive
                      ? "bg-brand-plum/10 text-brand-plum"
                      : "text-brand-charcoal hover:bg-brand-charcoal/5"
                  }`}
                >
                  <span className="font-serif text-base">{opt.native}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-slate">
                    {opt.code.toUpperCase()}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`text-brand-charcoal/60 transition-transform ${
        open ? "rotate-180" : ""
      }`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
