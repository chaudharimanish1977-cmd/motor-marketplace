/**
 * CarSmiley — a 5-point rating scale where each point is an ink-line
 * car drawn from the front, with the headlights doubling as eyes and
 * the bumper line as a mouth. Same Reading Room visual language as
 * the rest of the brand sketches.
 *
 * Designed for use in:
 *   · Thank-you / feedback surface ("How was your review?")
 *   · Post-checkout follow-up
 *   · Anywhere we want a non-numeric satisfaction rating
 *
 * Rating semantics (1 = worst, 5 = best):
 *
 *   1  Awful       — X-eyes, deep frown, angry eyebrows, anger lines
 *                    above the roof (steam)
 *   2  Bad         — Downturned arc-eyes, light frown
 *   3  OK          — Plain dot eyes, straight-line mouth
 *   4  Good        — Plain dot eyes, gentle smile curve
 *   5  Delighted   — Closed-eye smile arcs, wide grin,
 *                    twinkles either side of the roof
 *
 * Each smiley shares the same body outline + wheel positions so they
 * read as a family across the row.
 */

export type SmileyRating = 1 | 2 | 3 | 4 | 5;

export interface CarSmileyProps {
  /** 1 (worst) – 5 (best) */
  rating: SmileyRating;
  /** Stroke color. Defaults to currentColor so the smiley inherits
   *  the text color of its container (consistent with the other
   *  Reading Room ink-line sketches). */
  color?: string;
  /** Render width in pixels. Height matches (the smiley is square). */
  width?: number;
  className?: string;
  /** ARIA label override — when omitted, defaults to a sensible
   *  "1 of 5: Awful" type label so screen readers narrate the rating. */
  "aria-label"?: string;
}

const DEFAULT_LABELS: Record<SmileyRating, string> = {
  1: "1 of 5: awful",
  2: "2 of 5: bad",
  3: "3 of 5: okay",
  4: "4 of 5: good",
  5: "5 of 5: delighted",
};

export function CarSmiley({
  rating,
  color = "currentColor",
  width = 80,
  className,
  "aria-label": ariaLabel,
}: CarSmileyProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={width}
      height={width}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.6}
      fill="none"
      role="img"
      aria-label={ariaLabel ?? DEFAULT_LABELS[rating]}
    >
      {/* Antenna — same on all five, gives the "car" cue at a glance */}
      <line x1="50" y1="14" x2="50" y2="8" />
      <circle cx="50" cy="7" r="1.4" fill={color} stroke="none" />

      {/* Body — rounded front view, identical across all ratings so the
       *  emotion-changes-only pattern reads cleanly. */}
      <path d="M14 32 Q14 18, 28 16 L72 16 Q86 18, 86 32 L86 78 L14 78 Z" />

      {/* Bonnet / windshield seam — splits the upper "face" into a
       *  forehead band where the eyebrows can sit. */}
      <line x1="14" y1="30" x2="86" y2="30" opacity={0.5} />

      {/* Wheels — half-hidden at the corners, just enough to read as a
       *  car. Filled black centres give them weight. */}
      <circle cx="22" cy="84" r="6" />
      <circle cx="22" cy="84" r="2" fill={color} stroke="none" />
      <circle cx="78" cy="84" r="6" />
      <circle cx="78" cy="84" r="2" fill={color} stroke="none" />

      {/* ─── Face details — vary per rating ─────────────────────── */}

      {rating === 1 && (
        <g>
          {/* Anger lines above the roof (steam) */}
          <g strokeWidth={1.8} opacity={0.6}>
            <line x1="32" y1="10" x2="36" y2="4" />
            <line x1="50" y1="6" x2="50" y2="0" strokeWidth={0} />
            <line x1="42" y1="10" x2="44" y2="4" />
            <line x1="58" y1="10" x2="56" y2="4" />
            <line x1="68" y1="10" x2="64" y2="4" />
          </g>
          {/* Angry eyebrows (slanting down towards centre) */}
          <line x1="22" y1="36" x2="38" y2="42" strokeWidth={2.8} />
          <line x1="78" y1="36" x2="62" y2="42" strokeWidth={2.8} />
          {/* X-eyes */}
          <path d="M26 46 L36 56" />
          <path d="M36 46 L26 56" />
          <path d="M64 46 L74 56" />
          <path d="M74 46 L64 56" />
          {/* Deep frown */}
          <path d="M30 70 Q50 58, 70 70" strokeWidth={2.8} />
        </g>
      )}

      {rating === 2 && (
        <g>
          {/* Sad downturned eye-arcs */}
          <path d="M26 50 Q32 44, 38 50" />
          <path d="M62 50 Q68 44, 74 50" />
          {/* Light frown */}
          <path d="M32 66 Q50 60, 68 66" />
        </g>
      )}

      {rating === 3 && (
        <g>
          {/* Neutral dot eyes */}
          <circle cx="32" cy="48" r="3" fill={color} stroke="none" />
          <circle cx="68" cy="48" r="3" fill={color} stroke="none" />
          {/* Straight mouth */}
          <line x1="34" y1="64" x2="66" y2="64" strokeWidth={2.6} />
        </g>
      )}

      {rating === 4 && (
        <g>
          {/* Slightly raised dot eyes (happy without being delighted) */}
          <circle cx="32" cy="46" r="3" fill={color} stroke="none" />
          <circle cx="68" cy="46" r="3" fill={color} stroke="none" />
          {/* Gentle smile */}
          <path d="M30 60 Q50 70, 70 60" strokeWidth={2.6} />
        </g>
      )}

      {rating === 5 && (
        <g>
          {/* Sparkle twinkles either side of the roof */}
          <g strokeWidth={1.4} opacity={0.7}>
            <line x1="18" y1="22" x2="22" y2="18" />
            <line x1="20" y1="18" x2="20" y2="14" />
            <line x1="78" y1="22" x2="82" y2="18" />
            <line x1="80" y1="18" x2="80" y2="14" />
          </g>
          {/* Closed-eye smile arcs */}
          <path d="M24 48 Q32 40, 40 48" />
          <path d="M60 48 Q68 40, 76 48" />
          {/* Wide grin */}
          <path d="M26 58 Q50 76, 74 58" strokeWidth={2.6} />
        </g>
      )}
    </svg>
  );
}
