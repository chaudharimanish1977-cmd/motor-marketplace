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
          // === New palette (Brand Playbook v2.0, May 2026) ===
          // Editorial reviewer / round-seal identity. These are the
          // canonical tokens going forward. The legacy ones below are
          // kept temporarily so existing class references don't break
          // mid-migration; Commit 2 will sweep them out.
          navy: "#1a3470", // Primary — was #0A2463
          olive: "#424D1F", // Primary CTAs (replaces orange)
          coral: "#ff5a30", // Warm accents (savings, "best deal")
          plum: "#3A1E3D", // Dark surfaces, stamp-ring

          // === Legacy palette (retiring in Commit 2) ===
          deepblue: "#0A2463", // → will be replaced by `navy`
          electricblue: "#247BA0", // → being retired entirely
          skyblue: "#00B4D8",
          orange: "#FF6B35", // → will be replaced by `olive` (primary CTAs)
          purple: "#6C3FA0", // → will be replaced by `plum` (tier accents)

          // === Neutral (semantic — flip with theme via CSS vars) ===
          charcoal: "rgb(var(--color-charcoal) / <alpha-value>)", // Body text
          slate: "rgb(var(--color-slate) / <alpha-value>)", // Secondary text
          "light-gray": "rgb(var(--color-light-gray) / <alpha-value>)",
          offwhite: "rgb(var(--color-offwhite) / <alpha-value>)",

          // === Functional ===
          success: "#00B894",
          alert: "#E17055",

          // === Legacy aliases (retiring in Commit 2) ===
          gold: "#FF6B35", // → was orange alias
          ink: "rgb(var(--color-charcoal) / <alpha-value>)",
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
        // Editorial italic-serif for headings + the wordmark treatment
        // ("italic-serif olive 'rightoffer'"). Always rendered italic
        // per the brand misuse rule.
        serif: [
          "var(--font-lora)",
          "Lora",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
        // Monospace for ".in" suffix, language pills, technical labels.
        mono: [
          "var(--font-plex-mono)",
          "IBM Plex Mono",
          "Menlo",
          "Consolas",
          "monospace",
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
