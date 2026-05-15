/**
 * RightOffer brand mark — wraps the designer-supplied SVG pack
 * (`public/logo/v1.svg` … `v6.svg`).
 *
 * Each source SVG has a small "section heading" caption baked in at the
 * top (e.g. "1. FULL LOGO · LIGHT BACKGROUND"). We crop that out at the
 * React layer using `overflow:hidden` on the wrapper + a negative `top`
 * shift on the inner `<img>`, so the rendered logo is just the mark.
 *
 * Dark-mode handling: the light-bg variants (v1, v3, v4, v5) use deep-
 * blue strokes that vanish against the dark page bg. We render BOTH the
 * light and the dark variant stacked, and toggle visibility via Tailwind
 * `dark:` classes so the right one is visible in each theme.
 *
 * Brand colours (locked):
 *   Deep Blue  #0A2463
 *   Orange     #FF6B35
 */

import clsx from "clsx";

export type LogoVariant =
  | "full-light"
  | "full-dark"
  | "nav-24"
  | "default-40"
  | "hero-80"
  | "wordmark"
  | "wordmark-plain"
  | "header";

interface Props {
  variant?: LogoVariant;
  className?: string;
}

interface SourceSpec {
  /** SVG path used in light mode. Native bg already stripped to transparent. */
  light: string;
  /** SVG path used in dark mode. Keeps its deep-blue card so the white logo
   *  inside has enough contrast against slate-900 page bg. */
  dark: string;
  /** Native SVG width / height (sets the aspect ratio of the wrapper). */
  width: number;
  height: number;
  /** Fraction of `height` at the top occupied by the section caption. */
  headingPct: number;
}

const SOURCES: Record<LogoVariant, SourceSpec> = {
  "full-light": { light: "/logo/v1.svg", dark: "/logo/v2.svg", width: 752, height: 368, headingPct: 0.19 },
  "full-dark": { light: "/logo/v2.svg", dark: "/logo/v2.svg", width: 768, height: 368, headingPct: 0.19 },
  "nav-24": { light: "/logo/v4.svg", dark: "/logo/v2.svg", width: 752, height: 185, headingPct: 0.28 },
  "default-40": { light: "/logo/v1.svg", dark: "/logo/v2.svg", width: 752, height: 368, headingPct: 0.19 },
  "hero-80": { light: "/logo/v1.svg", dark: "/logo/v2.svg", width: 752, height: 368, headingPct: 0.19 },
  wordmark: { light: "/logo/v4.svg", dark: "/logo/v2.svg", width: 752, height: 185, headingPct: 0.28 },
  "wordmark-plain": { light: "/logo/v5.svg", dark: "/logo/v2.svg", width: 768, height: 185, headingPct: 0.28 },
  header: { light: "/logo/v6.svg", dark: "/logo/v6.svg", width: 1536, height: 205, headingPct: 0.18 },
};

/**
 * Renders the brand mark, cropping the section heading from the source SVG.
 * Stacks the light and dark variants and toggles visibility via Tailwind
 * `dark:` so the right one renders for the current theme.
 */
export function RightOfferLogo({ variant = "full-light", className }: Props = {}) {
  const spec = SOURCES[variant];

  // Special-case the dark-bg variant: it's always v2 with its deep-blue card,
  // so no light/dark swap is needed and the dark variant has a different
  // aspect (slightly wider). We use the dark spec's geometry throughout.
  const isAlwaysDark = variant === "full-dark";

  // Cropped aspect (without the heading band).
  const cropH = spec.height * (1 - spec.headingPct);
  const aspect = `${spec.width} / ${cropH}`;
  // The image's natural rendered height overflows the wrapper top by this
  // percentage of the wrapper height (where the heading caption lives).
  const overflowPct = spec.headingPct / (1 - spec.headingPct);
  const topShift = `-${(overflowPct * 100).toFixed(3)}%`;

  const imgStyle = {
    position: "absolute" as const,
    left: 0,
    right: 0,
    width: "100%",
    height: "auto",
    top: topShift,
  };

  return (
    <span
      className={clsx("relative block overflow-hidden w-full", className)}
      style={{ aspectRatio: aspect }}
    >
      <img
        src={spec.light}
        alt="RightOffer"
        loading="eager"
        decoding="async"
        className={isAlwaysDark ? undefined : "dark:hidden"}
        style={imgStyle}
      />
      {!isAlwaysDark && (
        <img
          src={spec.dark}
          alt=""
          aria-hidden
          loading="eager"
          decoding="async"
          className="hidden dark:block"
          style={imgStyle}
        />
      )}
    </span>
  );
}
