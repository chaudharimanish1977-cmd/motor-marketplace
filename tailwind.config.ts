import type { Config } from "tailwindcss";

/**
 * Tailwind config — Sarvsure brand tokens.
 * Color palette and typography sourced from Brand Playbook v1.0 (Apr 2026).
 *
 * Dark mode: class-based. The "semantic" brand tokens (offwhite, charcoal,
 * slate, light-gray, and their aliases ink) are wired to CSS variables in
 * globals.css so they flip automatically when the `dark` class is on <html>.
 * Brand-identity colors (deepblue, orange, electricblue, etc.) stay fixed.
 */

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // === Primary (brand identity — never flip) ===
          deepblue: "#0A2463",
          electricblue: "#247BA0",

          // === Secondary (brand identity — never flip) ===
          skyblue: "#00B4D8",
          orange: "#FF6B35",
          purple: "#6C3FA0",

          // === Neutral (semantic — flip with theme via CSS vars) ===
          charcoal: "rgb(var(--color-charcoal) / <alpha-value>)", // Body text
          slate: "rgb(var(--color-slate) / <alpha-value>)", // Secondary text
          "light-gray": "rgb(var(--color-light-gray) / <alpha-value>)",
          offwhite: "rgb(var(--color-offwhite) / <alpha-value>)",

          // === Functional ===
          success: "#00B894",
          alert: "#E17055",

          // === Legacy aliases (keep older code working) ===
          navy: "#0A2463", // Maps to Deep Blue (brand identity, no flip)
          gold: "#FF6B35", // Maps to Orange (brand identity, no flip)
          ink: "rgb(var(--color-charcoal) / <alpha-value>)", // Maps to Charcoal (flips)
        },
        // Semantic surface token for cards/panels that today use bg-white.
        // Stays white in light mode, dark slate in dark mode.
        surface: "rgb(var(--color-surface) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "Calibri",
          "Arial",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        // Sarvsure-tuned layered shadows for modern depth
        soft: "0 1px 2px rgb(10 36 99 / 0.04), 0 2px 8px rgb(10 36 99 / 0.06)",
        elevated:
          "0 4px 6px rgb(10 36 99 / 0.05), 0 12px 24px rgb(10 36 99 / 0.10)",
        glow: "0 8px 32px rgb(10 36 99 / 0.18)",
      },
      backgroundImage: {
        "gradient-radial":
          "radial-gradient(circle, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
