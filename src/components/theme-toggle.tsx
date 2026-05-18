"use client";

import { useEffect, useState } from "react";

/**
 * Fixed top-right sun/moon button. Toggles `dark` class on <html> and
 * persists preference in localStorage under "ro-theme" ("light" | "dark").
 * Default is light; the inline script in layout.tsx applies the saved theme
 * before paint to avoid a flash.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const initial = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    setTheme(initial);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("ro-theme", next);
    } catch {
      // ignore — private mode etc.
    }
  };

  // Avoid hydration mismatch by rendering nothing until we know the theme.
  if (theme === null) return null;

  const isDark = theme === "dark";

  // Reading Room mode-pill: a fixed top-right monospace pill ("LIGHT · TAP"
  // / "DARK · TAP") with a small accent dot. Matches the brand mockup's
  // ModeToggle aesthetic (tokens.jsx → ModeToggle): bordered, letter-spaced,
  // tiny — feels like the masthead chip on a newspaper rather than an OS
  // affordance.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed bottom-4 right-4 md:bottom-auto md:top-4 z-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[1.5px] border-brand-charcoal/30 bg-brand-offwhite text-brand-charcoal font-mono text-[10.5px] font-bold tracking-[0.1em] uppercase hover:border-brand-charcoal/60 transition-colors print:hidden shadow-sm md:shadow-none"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isDark ? "bg-brand-plum" : "bg-brand-charcoal"
        }`}
        aria-hidden
      />
      {isDark ? "DARK" : "LIGHT"} · TAP
    </button>
  );
}
