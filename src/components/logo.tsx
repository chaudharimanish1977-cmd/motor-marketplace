/**
 * RightOffer brand mark — wraps the v2.0 SVG pack
 * (`public/logo/full.svg`, `wordmark.svg`, etc.) sourced from the
 * "Editorial reviewer / round-seal" brand identity.
 *
 * Each source SVG has a small "section heading" caption baked in at
 * the top (e.g. "1. FULL LOGO · LIGHT BACKGROUND"). We crop that out
 * at the React layer using `overflow:hidden` on the wrapper + a
 * negative `top` shift on the inner `<img>`, so the rendered logo
 * is just the mark.
 *
 * Dark-mode handling: the full lockup ships with a dedicated
 * dark-bg variant (full-dark.svg, the olive-on-deep-plum lockup).
 * For wordmark variants, the same SVG works on both backgrounds
 * (the olive + plum chroma reads against both); same file is
 * used in both themes for those.
 *
 * Brand colours (locked, v2.0):
 *   Navy        #1a3470
 *   Olive       #424D1F
 *   Coral       #ff5a30
 *   Deep plum   #3A1E3D
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
  | "wordmark-with-in"
  | "header";

interface Props {
  variant?: LogoVariant;
  className?: string;
}

interface SourceSpec {
  /** SVG path used in light mode. */
  light: string;
  /** SVG path used in dark mode. Either a dedicated dark-bg variant
   *  or the same file when the mark works on both backgrounds. */
  dark: string;
  /** Native SVG width / height (sets the aspect ratio of the wrapper). */
  width: number;
  height: number;
  /** Fraction of `height` at the top occupied by the section caption
   *  baked into the source SVG — cropped via overflow:hidden + a
   *  negative top shift on the inner <img>. */
  headingPct: number;
}

// v2.0 pack — the same vector strokes as the v1 set, recoloured to
// the Editorial Reviewer palette (olive ink + plum stamp-ring +
// coral signature accent).
const SOURCES: Record<LogoVariant, SourceSpec> = {
  // Full lockup (sedan + wordmark + dashed ground line).
  "full-light": {
    light: "/logo/full.svg",
    dark: "/logo/full-dark.svg",
    width: 752,
    height: 368,
    headingPct: 0.19,
  },
  "full-dark": {
    light: "/logo/full-dark.svg",
    dark: "/logo/full-dark.svg",
    width: 768,
    height: 368,
    headingPct: 0.19,
  },
  // Header lockup — horizontal layout with the wordmark and a small
  // car. Used in the site header on most pages.
  "nav-24": {
    light: "/logo/wordmark.svg",
    dark: "/logo/wordmark.svg",
    width: 768,
    height: 185,
    headingPct: 0.28,
  },
  "default-40": {
    light: "/logo/full.svg",
    dark: "/logo/full-dark.svg",
    width: 752,
    height: 368,
    headingPct: 0.19,
  },
  "hero-80": {
    light: "/logo/full.svg",
    dark: "/logo/full-dark.svg",
    width: 752,
    height: 368,
    headingPct: 0.19,
  },
  // Wordmark only — preferred for tight rows. "wordmark" includes the
  // ".in" suffix per the v2.0 spec; "wordmark-plain" drops it for
  // body-copy / signage contexts where the suffix would be redundant.
  wordmark: {
    light: "/logo/wordmark-with-in.svg",
    dark: "/logo/wordmark-with-in.svg",
    width: 752,
    height: 185,
    headingPct: 0.28,
  },
  "wordmark-with-in": {
    light: "/logo/wordmark-with-in.svg",
    dark: "/logo/wordmark-with-in.svg",
    width: 752,
    height: 185,
    headingPct: 0.28,
  },
  "wordmark-plain": {
    light: "/logo/wordmark.svg",
    dark: "/logo/wordmark.svg",
    width: 768,
    height: 185,
    headingPct: 0.28,
  },
  header: {
    light: "/logo/header.svg",
    dark: "/logo/header.svg",
    width: 1536,
    height: 205,
    headingPct: 0.18,
  },
};

/**
 * Renders the brand mark, cropping the section heading from the source SVG.
 * Stacks the light and dark variants and toggles visibility via Tailwind
 * `dark:` so the right one renders for the current theme.
 */
export function RightOfferLogo({
  variant = "full-light",
  className,
}: Props = {}) {
  const spec = SOURCES[variant];

  // Special-case the dark-bg variant: it's always on deep plum, so no
  // light/dark swap needed.
  const isAlwaysDark = variant === "full-dark";

  // Same file in both themes (wordmark variants) — no need to render
  // a second <img>; the single instance works for both.
  const sameForBothThemes = spec.light === spec.dark;

  const cropH = spec.height * (1 - spec.headingPct);
  const aspect = `${spec.width} / ${cropH}`;
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
        className={
          isAlwaysDark || sameForBothThemes ? undefined : "dark:hidden"
        }
        style={imgStyle}
      />
      {!isAlwaysDark && !sameForBothThemes && (
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
