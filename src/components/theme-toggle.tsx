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

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed top-3 right-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-light-gray bg-surface text-brand-charcoal shadow-soft transition hover:shadow-elevated hover:scale-105 active:scale-95 print:hidden"
    >
      {isDark ? (
        // Sun icon — clicking will switch to light
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Moon icon — clicking will switch to dark
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
