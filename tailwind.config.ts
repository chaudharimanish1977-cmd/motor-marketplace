import type { Config } from "tailwindcss";

/**
 * Tailwind config — RightOffer brand tokens · Reading Room v3 (May 2026).
 *
 * The Reading Room is an editorial newspaper-style brand system:
 *   · Background = pure white (light) / warm near-black #0e0a10 (dark)
 *   · Foreground = warm near-black #1a1218 (light) / cream #f3eef0 (dark)
 *   · Accent A1  = deep plum #3a1e3d (light) / lifted plum #c485c9 (dark)
 *   · Accent A2  = muted sage #8b9d80 (light) / lifted sage #a8baa0 (dark)
 *   · Typography = Newsreader serif (body + headlines, italic for accent
 *     words) + JetBrains Mono (mastheads, footnotes, all-caps labels)
 *
 * Dark mode: class-based. All semantic tokens (offwhite/charcoal/slate/
 * light-gray/surface, plum, sage) are wired to CSS variables in globals.css
 * so they flip automatically when the `dark` class is on <html>.
 *
 * The older brand.* aliases (deepblue, orange, electricblue, gold, ink) are
 * kept temporarily so existing class references don't break mid-migration
 * but they now resolve to Reading Room values (navy=plum, olive=plum,
 * coral=sage, etc.) so the visual palette is consistent everywhere.
 */

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // === Reading Room v3 canonical tokens (May 2026) ===
          // Editorial reading-room palette. All semantic colors flip with
          // theme via CSS variables in globals.css.
          plum: "rgb(var(--color-plum) / <alpha-value>)", // Accent A1 — primary editorial accent + CTAs
          sage: "rgb(var(--color-sage) / <alpha-value>)", // Accent A2 — secondary editorial accent

          // === Neutral (semantic — flip with theme via CSS vars) ===
          // offwhite = page background (pure white light, near-black dark)
          // charcoal = body text (near-black light, cream dark)
          // slate    = muted text (warm gray light, lifted muted dark)
          // surface  = card background (light cream light, plum-tinted dark)
          // light-gray = rule/hairline borders
          charcoal: "rgb(var(--color-charcoal) / <alpha-value>)",
          slate: "rgb(var(--color-slate) / <alpha-value>)",
          "light-gray": "rgb(var(--color-light-gray) / <alpha-value>)",
          offwhite: "rgb(var(--color-offwhite) / <alpha-value>)",

          // === Functional ===
          success: "#00B894",
          alert: "#E17055",

          // === Legacy aliases — remap onto Reading Room semantics so
          // existing class references (bg-brand-navy, bg-brand-olive,
          // text-brand-coral, etc.) keep working but adopt the new palette
          // automatically. Will be swept out in a later commit.
          //   Heading color (navy) → charcoal so headings stay readable.
          //   CTA / surface fill (olive, orange) → plum (CTAs are plum).
          //   Warm accent (coral, gold) → sage (the editorial accent).
          //   Deep/tier accents (plum, deepblue, electricblue, etc.) → plum. ===
          navy: "rgb(var(--color-charcoal) / <alpha-value>)", // → body fg
          olive: "rgb(var(--color-plum) / <alpha-value>)", // → plum (CTAs)
          coral: "rgb(var(--color-sage) / <alpha-value>)", // → sage
          deepblue: "rgb(var(--color-plum) / <alpha-value>)", // → plum
          electricblue: "rgb(var(--color-sage) / <alpha-value>)", // → sage
          skyblue: "rgb(var(--color-sage) / <alpha-value>)", // → sage
          orange: "rgb(var(--color-plum) / <alpha-value>)", // → plum
          purple: "rgb(var(--color-plum) / <alpha-value>)", // → plum
          gold: "rgb(var(--color-sage) / <alpha-value>)", // → sage
          ink: "rgb(var(--color-charcoal) / <alpha-value>)",
        },
        // Semantic surface token for cards/panels that today use bg-white.
        // Stays white in light mode, dark slate in dark mode.
        surface: "rgb(var(--color-surface) / <alpha-value>)",
      },
      fontFamily: {
        // The Reading Room brand voice IS the serif — body text, headlines,
        // italics for accent words. font-sans is kept for legacy components
        // but the canonical default for new work is font-serif (Newsreader).
        serif: [
          "var(--font-newsreader)",
          "Newsreader",
          "Times New Roman",
          "Georgia",
          "Cambria",
          "serif",
        ],
        sans: [
          "var(--font-inter)",
          "Inter",
          "Calibri",
          "Arial",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        // JetBrains Mono for mastheads ("LETTER № 06 · MAY 2026"), section
        // markers (§ I., · 03 STEPS ·), letter-spaced UPPERCASE technical
        // metadata, and small footnotes. Pairs visually with the editorial
        // serif as its technical counterpoint.
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        // Layered shadows tinted in the new navy (#1a3470 = rgb(26 52 112))
        // for visual coherence with the v2.0 palette. The `glow` shadow
        // sits behind primary CTAs (now olive bg) — the navy tint gives
        // the button a subtle "editorial ink" feel rather than the
        // bluish drop of the old deep-blue palette.
        soft: "0 1px 2px rgb(26 52 112 / 0.04), 0 2px 8px rgb(26 52 112 / 0.06)",
        elevated:
          "0 4px 6px rgb(26 52 112 / 0.05), 0 12px 24px rgb(26 52 112 / 0.10)",
        glow: "0 8px 32px rgb(26 52 112 / 0.18)",
      },
      backgroundImage: {
        "gradient-radial":
          "radial-gradient(circle, var(--tw-gradient-stops))",
      },
      keyframes: {
        // Journey ambient motion — small, calm, never anxious. The car
        // micro-hovers above the road; the current-stop dot breathes;
        // act content fades-in on phase swap.
        roadhover: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-2px)" },
        },
        roadpulse: {
          "0%, 100%": {
            transform: "scale(1)",
            opacity: "1",
          },
          "50%": {
            transform: "scale(1.18)",
            opacity: "0.85",
          },
        },
        actFadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0px)" },
        },
        towingIn: {
          "0%": {
            opacity: "0",
            transform: "translateX(40px)",
          },
          "60%": {
            opacity: "1",
            transform: "translateX(-4px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0px)",
          },
        },
        // The road dashes scroll continuously from right to left
        // beneath the (visually stationary) car, selling forward
        // motion even when the car is "parked" at a milestone. Cartoon
        // trick — calmest way to guarantee the journey never feels
        // stopped. Slow + gentle: 6s per cycle.
        roadscroll: {
          "0%": { backgroundPosition: "0 50%" },
          "100%": { backgroundPosition: "-22px 50%" },
        },
        // Spotlight cycle for Stop 4 — each item fades in, holds, then
        // veils back out. Used by act-preview's rotating teaser.
        spotlightCycle: {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.985)" },
          "12%": { opacity: "1", transform: "translateY(0px) scale(1)" },
          "84%": { opacity: "1", transform: "translateY(0px) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-6px) scale(0.985)" },
        },
        // Big payoff entrance for the Destination smiley — pop-in
        // with a soft overshoot then settle. Bigger gesture than the
        // standard act-fade-in because Destination is the emotional
        // climax of the journey, not just another stop.
        smileyPop: {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "55%": { opacity: "1", transform: "scale(1.08)" },
          "75%": { opacity: "1", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        roadhover: "roadhover 2.8s ease-in-out infinite",
        roadpulse: "roadpulse 1.6s ease-in-out infinite",
        roadscroll: "roadscroll 0.9s linear infinite",
        "act-fade-in": "actFadeIn 380ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "towing-in": "towingIn 520ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "spotlight-cycle":
          "spotlightCycle 3500ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "smiley-pop": "smileyPop 760ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
