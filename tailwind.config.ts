import type { Config } from "tailwindcss";

/**
 * Tailwind config — Sarvsure brand tokens.
 * Color palette and typography sourced from Brand Playbook v1.0 (Apr 2026).
 */

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // === Primary ===
          deepblue: "#0A2463", // Primary brand color
          electricblue: "#247BA0", // Activator / modern energy

          // === Secondary ===
          skyblue: "#00B4D8",
          orange: "#FF6B35", // Key action CTAs per email template
          purple: "#6C3FA0",

          // === Neutral ===
          charcoal: "#2D3436", // Body text
          slate: "#636E72", // Secondary text
          "light-gray": "#DFE6E9",
          offwhite: "#F8F9FA",

          // === Functional ===
          success: "#00B894",
          alert: "#E17055",

          // === Legacy aliases (keep older code working) ===
          navy: "#0A2463", // Maps to Deep Blue
          gold: "#FF6B35", // Maps to Orange
          ink: "#2D3436", // Maps to Charcoal
        },
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
