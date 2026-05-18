/**
 * RightOffer editorial hand-drawn sketches.
 *
 * Ink-line illustrations (pen-and-paper feel, round caps, slight stroke
 * variation) used across the editorial home page and other surfaces.
 * Direct ports of the brand mockup's sketches.jsx — same SVG paths,
 * adapted to React/TSX with brand-token colors via currentColor.
 *
 * All sketches accept `color` (stroke + primary fill) and an optional
 * `accent` (secondary fill for stamps/highlights). Default is the
 * RightOffer editorial plum accent.
 *
 * The car sketch is animated (bounce + spin + road) via the shared
 * keyframes in globals.css. Static sketches have no motion.
 */
"use client";

export interface SketchProps {
  /** Primary stroke / line color. */
  color?: string;
  /** Secondary accent for stamps, highlights, ticks. */
  accent?: string;
  /** Render width in pixels (height is proportional). */
  width?: number;
  className?: string;
}

/* ─── Static mini car (inline icon size) ─────────────────────────────────── */
/**
 * Same car shape as SketchCar but without animation classes and without
 * the dashed road strip below — sized for inline use inside buttons /
 * chips. Stroke colour inherits `currentColor` by default so the icon
 * picks up the text colour of whatever it's nested in.
 */
export function SketchCarStatic({
  color = "currentColor",
  width = 44,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.5);
  return (
    <svg
      viewBox="0 0 220 110"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={5}
      aria-hidden
    >
      <rect x="14" y="56" width="192" height="34" rx="12" />
      <rect x="52" y="24" width="116" height="34" rx="10" />
      <line x1="110" y1="24" x2="110" y2="58" />
      <line x1="80" y1="60" x2="80" y2="88" />
      <line x1="140" y1="60" x2="140" y2="88" />
      <circle cx="18" cy="66" r="3" fill={color} />
      <circle cx="202" cy="66" r="3" fill={color} />
      <g transform="translate(60 94)">
        <circle cx="0" cy="0" r="14" />
        <line x1="-10" y1="0" x2="10" y2="0" />
        <line x1="0" y1="-10" x2="0" y2="10" />
      </g>
      <g transform="translate(160 94)">
        <circle cx="0" cy="0" r="14" />
        <line x1="-10" y1="0" x2="10" y2="0" />
        <line x1="0" y1="-10" x2="0" y2="10" />
      </g>
    </svg>
  );
}

/* ─── Animated mini car ──────────────────────────────────────────────────── */
export function SketchCar({
  color = "#3a1e3d",
  width = 220,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.5);
  return (
    <div
      className={`inline-flex flex-col items-stretch ${className ?? ""}`}
      style={{ width, color }}
    >
      <svg
        viewBox="0 0 220 110"
        width={width}
        height={h}
        className="ro-car ro-ink"
        stroke={color}
        strokeWidth={2.5}
      >
        <rect x="14" y="56" width="192" height="34" rx="12" />
        <rect x="52" y="24" width="116" height="34" rx="10" />
        <line x1="110" y1="24" x2="110" y2="58" />
        <line x1="80" y1="60" x2="80" y2="88" />
        <line x1="140" y1="60" x2="140" y2="88" />
        <circle cx="18" cy="66" r="3" fill={color} />
        <circle cx="202" cy="66" r="3" fill={color} />
        <g transform="translate(60 94)">
          <circle cx="0" cy="0" r="14" />
          <g className="ro-wheel">
            <line x1="-10" y1="0" x2="10" y2="0" />
            <line x1="0" y1="-10" x2="0" y2="10" />
          </g>
        </g>
        <g transform="translate(160 94)">
          <circle cx="0" cy="0" r="14" />
          <g className="ro-wheel">
            <line x1="-10" y1="0" x2="10" y2="0" />
            <line x1="0" y1="-10" x2="0" y2="10" />
          </g>
        </g>
      </svg>
      <div className="ro-road" />
    </div>
  );
}

/* ─── Sedan in 3/4 view, ink wash ────────────────────────────────────────── */
/* Classic three-box: long hood, raked cabin, defined trunk. Standard
 * ride height. Matches a Honda City / Hyundai Verna / Skoda Slavia. */
export function SketchSedan({
  color = "#3a1e3d",
  width = 420,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.62);
  return (
    <svg
      viewBox="0 0 320 200"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
    >
      {/* Body — long, low, with a clear trunk shoulder behind the cabin */}
      <path d="M28 144 Q40 110, 80 102 L120 96 Q138 92, 168 92 L210 96 Q244 100, 270 116 L298 130 Q308 136, 308 148 L308 162 L18 162 L18 146 Z" />
      {/* Cabin — raked windshield, long greenhouse, sloping rear pillar */}
      <path d="M96 102 Q116 70, 150 68 L196 70 Q220 74, 232 102 Z" />
      <line x1="170" y1="68" x2="170" y2="102" />
      {/* Door seams */}
      <line x1="132" y1="104" x2="132" y2="158" />
      <line x1="200" y1="104" x2="200" y2="160" />
      {/* Trunk seam — distinct from rear pillar so the trunk reads as a box */}
      <line x1="232" y1="102" x2="252" y2="118" />
      {/* Handles */}
      <line x1="140" y1="124" x2="160" y2="122" />
      <line x1="206" y1="126" x2="222" y2="124" />
      {/* Front lamp */}
      <circle cx="298" cy="142" r="5" />
      {/* Wheels */}
      <g>
        <circle cx="84" cy="164" r="20" />
        <circle cx="84" cy="164" r="8" />
        <circle cx="84" cy="164" r="2" fill={color} />
      </g>
      <g>
        <circle cx="244" cy="164" r="20" />
        <circle cx="244" cy="164" r="8" />
        <circle cx="244" cy="164" r="2" fill={color} />
      </g>
      {/* Soft hatching under wheel wells */}
      <g stroke={color} strokeWidth={1} opacity={0.4}>
        <line x1="44" y1="152" x2="62" y2="152" />
        <line x1="44" y1="156" x2="66" y2="156" />
        <line x1="262" y1="152" x2="284" y2="152" />
        <line x1="266" y1="156" x2="290" y2="156" />
      </g>
      {/* Ground line */}
      <line
        x1="6"
        y1="186"
        x2="314"
        y2="186"
        strokeDasharray="4 6"
        opacity={0.6}
      />
    </svg>
  );
}

/* ─── Hatchback in 3/4 view, ink wash ────────────────────────────────────── */
/* Compact, two-box silhouette: NO trunk, near-vertical rear hatch, short
 * front overhang, wheels pushed to the corners. Visibly smaller body
 * than the sedan. Matches a Maruti Swift / Hyundai i20 / VW Polo. */
export function SketchHatchback({
  color = "#3a1e3d",
  width = 420,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.62);
  return (
    <svg
      viewBox="0 0 320 200"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
    >
      {/* Body — compact, wheels at the corners, short rear hatch */}
      <path d="M58 140 Q72 96, 116 90 L196 88 Q220 90, 234 100 L262 116 Q272 122, 272 138 L272 160 L52 160 L52 142 Z" />
      {/* Cabin — extends almost to the rear (no trunk), near-vertical
       *  rear hatch. The short A-pillar + tall C-pillar reads as
       *  "hatchback" silhouette. */}
      <path d="M104 90 Q120 56, 154 56 L218 56 Q230 60, 234 100 L234 100 Z" />
      <line x1="170" y1="56" x2="170" y2="90" />
      {/* Door seams — note: only two doors visible (3-door look) */}
      <line x1="138" y1="92" x2="138" y2="156" />
      <line x1="204" y1="92" x2="204" y2="158" />
      {/* Handles */}
      <line x1="146" y1="112" x2="166" y2="110" />
      <line x1="210" y1="114" x2="226" y2="112" />
      {/* Front lamp */}
      <circle cx="266" cy="124" r="5" />
      {/* Rear tail-lamp — vertical, sits on the C-pillar */}
      <rect x="54" y="100" width="6" height="18" />
      {/* Wheels — visibly pushed to the corners, smaller than SUV */}
      <g>
        <circle cx="100" cy="164" r="20" />
        <circle cx="100" cy="164" r="8" />
        <circle cx="100" cy="164" r="2" fill={color} />
      </g>
      <g>
        <circle cx="228" cy="164" r="20" />
        <circle cx="228" cy="164" r="8" />
        <circle cx="228" cy="164" r="2" fill={color} />
      </g>
      {/* Soft hatching */}
      <g stroke={color} strokeWidth={1} opacity={0.4}>
        <line x1="64" y1="152" x2="80" y2="152" />
        <line x1="64" y1="156" x2="82" y2="156" />
        <line x1="246" y1="152" x2="266" y2="152" />
        <line x1="248" y1="156" x2="266" y2="156" />
      </g>
      {/* Ground line */}
      <line
        x1="6"
        y1="186"
        x2="314"
        y2="186"
        strokeDasharray="4 6"
        opacity={0.6}
      />
    </svg>
  );
}

/* ─── SUV in 3/4 view, ink wash ──────────────────────────────────────────── */
/* Tall, boxy, raised ride height. Square cabin with near-vertical
 * pillars, roof rails, body-cladding strip along the lower flanks,
 * visible front grille slot. Larger wheels with arch flares. Matches a
 * Mahindra XUV700 / Hyundai Creta / Kia Seltos. */
export function SketchSUV({
  color = "#3a1e3d",
  width = 420,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.62);
  return (
    <svg
      viewBox="0 0 320 200"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
    >
      {/* Body — tall, square, sits high above the ground */}
      <path d="M24 116 Q36 70, 86 64 L228 60 Q262 62, 280 78 L300 92 Q312 100, 312 116 L312 152 L18 152 L18 118 Z" />
      {/* Cabin — square, upright A and C pillars, flat roof */}
      <path d="M88 64 Q96 28, 134 26 L222 26 Q252 28, 266 66 L266 66 Z" />
      <line x1="170" y1="26" x2="170" y2="66" />
      {/* Roof rails — distinctive SUV feature */}
      <line
        x1="98"
        y1="22"
        x2="252"
        y2="22"
        strokeWidth={1.6}
        opacity={0.7}
      />
      <line
        x1="100"
        y1="22"
        x2="100"
        y2="26"
        strokeWidth={1.2}
        opacity={0.7}
      />
      <line
        x1="250"
        y1="22"
        x2="250"
        y2="26"
        strokeWidth={1.2}
        opacity={0.7}
      />
      {/* Door seams */}
      <line x1="124" y1="68" x2="124" y2="148" />
      <line x1="216" y1="68" x2="216" y2="150" />
      {/* Handles */}
      <line x1="134" y1="98" x2="156" y2="96" />
      <line x1="222" y1="100" x2="244" y2="98" />
      {/* Body-cladding strip along the lower flanks */}
      <line
        x1="24"
        y1="138"
        x2="300"
        y2="138"
        strokeDasharray="5 3"
        opacity={0.5}
      />
      {/* Front grille slot */}
      <rect x="290" y="100" width="14" height="10" rx="1" />
      {/* Front lamp */}
      <circle cx="290" cy="86" r="5" />
      {/* Wheels — chunky, raised stance, visible arches */}
      <g>
        <circle cx="78" cy="156" r="28" />
        <circle cx="78" cy="156" r="11" />
        <circle cx="78" cy="156" r="2" fill={color} />
        <line x1="78" y1="128" x2="78" y2="138" strokeWidth={1.2} />
        <line x1="78" y1="174" x2="78" y2="184" strokeWidth={1.2} />
      </g>
      <g>
        <circle cx="242" cy="156" r="28" />
        <circle cx="242" cy="156" r="11" />
        <circle cx="242" cy="156" r="2" fill={color} />
        <line x1="242" y1="128" x2="242" y2="138" strokeWidth={1.2} />
        <line x1="242" y1="174" x2="242" y2="184" strokeWidth={1.2} />
      </g>
      {/* Soft hatching under wheel wells */}
      <g stroke={color} strokeWidth={1} opacity={0.4}>
        <line x1="32" y1="146" x2="48" y2="146" />
        <line x1="32" y1="150" x2="50" y2="150" />
        <line x1="270" y1="146" x2="288" y2="146" />
        <line x1="272" y1="150" x2="290" y2="150" />
      </g>
      {/* Ground line */}
      <line
        x1="6"
        y1="186"
        x2="314"
        y2="186"
        strokeDasharray="4 6"
        opacity={0.6}
      />
    </svg>
  );
}

/* ─── Document with paperclip + folded corner ────────────────────────────── */
export function SketchDoc({
  color = "#3a1e3d",
  width = 240,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.78);
  return (
    <svg
      viewBox="0 0 200 156"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
    >
      <path d="M28 16 L142 16 L172 46 L172 144 L28 144 Z" />
      <path d="M142 16 L142 46 L172 46" />
      <line x1="44" y1="62" x2="156" y2="62" />
      <line x1="44" y1="74" x2="142" y2="74" />
      <line x1="44" y1="86" x2="156" y2="86" />
      <line x1="44" y1="98" x2="132" y2="98" />
      <line x1="44" y1="110" x2="156" y2="110" />
      <line x1="44" y1="122" x2="120" y2="122" />
      {/* Paperclip */}
      <g transform="translate(30 8) rotate(-12)" fill="none">
        <path d="M0 0 L0 36 Q0 44, 8 44 L18 44 Q26 44, 26 36 L26 6 Q26 0, 20 0 L8 0 Q4 0, 4 4 L4 32" />
      </g>
      {/* Annotation tick */}
      <path
        d="M150 102 L156 108 L168 96"
        stroke={color}
        strokeWidth={2.4}
        opacity={0.85}
      />
    </svg>
  );
}

/* ─── Magnifying glass over text lines ───────────────────────────────────── */
export function SketchLoupe({
  color = "#3a1e3d",
  width = 240,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.78);
  return (
    <svg
      viewBox="0 0 200 156"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
    >
      {/* Paper edge */}
      <path d="M16 30 L172 30 L172 142 L16 142 Z" opacity={0.6} />
      {/* Text lines */}
      <line x1="32" y1="46" x2="156" y2="46" opacity={0.5} />
      <line x1="32" y1="60" x2="142" y2="60" opacity={0.5} />
      <line x1="32" y1="74" x2="156" y2="74" opacity={0.5} />
      <line x1="32" y1="88" x2="148" y2="88" opacity={0.5} />
      <line x1="32" y1="102" x2="156" y2="102" opacity={0.5} />
      <line x1="32" y1="116" x2="130" y2="116" opacity={0.5} />
      {/* Magnifier */}
      <circle cx="108" cy="82" r="38" />
      <line
        x1="138"
        y1="110"
        x2="178"
        y2="148"
        strokeWidth={6}
        strokeLinecap="round"
      />
      {/* Magnified text fragments */}
      <line x1="80" y1="74" x2="138" y2="74" strokeWidth={3} />
      <line x1="80" y1="88" x2="124" y2="88" strokeWidth={3} />
      <line x1="80" y1="100" x2="132" y2="100" strokeWidth={3} />
      <circle
        cx="120"
        cy="88"
        r="9"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="3 3"
        opacity={0.7}
      />
    </svg>
  );
}

/* ─── Verdict sheet with checks + score badge + seal ─────────────────────── */
export function SketchVerdict({
  color = "#3a1e3d",
  accent = "#8b9d80",
  width = 240,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.78);
  return (
    <svg
      viewBox="0 0 200 156"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
    >
      <path d="M22 14 L156 14 L178 36 L178 148 L22 148 Z" />
      <path d="M156 14 L156 36 L178 36" />
      <line x1="38" y1="38" x2="120" y2="38" strokeWidth={3} />
      <line x1="38" y1="44" x2="98" y2="44" strokeWidth={1.5} opacity={0.6} />
      {/* Findings rows */}
      <line x1="38" y1="64" x2="138" y2="64" opacity={0.5} />
      <path
        d="M150 60 L156 66 L168 54"
        stroke={accent}
        strokeWidth={2.4}
      />
      <line x1="38" y1="80" x2="138" y2="80" opacity={0.5} />
      <path
        d="M150 76 L156 82 L168 70"
        stroke={accent}
        strokeWidth={2.4}
      />
      <line x1="38" y1="96" x2="138" y2="96" opacity={0.5} />
      <path
        d="M150 90 L168 98 M168 90 L150 98"
        stroke={color}
        strokeWidth={2.4}
      />
      <line x1="38" y1="112" x2="138" y2="112" opacity={0.5} />
      <path
        d="M150 108 L156 114 L168 102"
        stroke={accent}
        strokeWidth={2.4}
      />
      {/* Score badge */}
      <rect x="38" y="124" width="56" height="18" rx="3" />
      <text
        x="66"
        y="138"
        textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), monospace"
        fontSize="12"
        fontWeight={700}
        fill={color}
        stroke="none"
      >
        SCORE 62
      </text>
      {/* Stamp seal */}
      <g transform="translate(140 132) rotate(-8)">
        <circle cx="0" cy="0" r="14" stroke={accent} strokeWidth={2} />
        <text
          x="0"
          y="3"
          textAnchor="middle"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize="8"
          fontWeight={700}
          fill={accent}
          stroke="none"
        >
          RO·24
        </text>
      </g>
    </svg>
  );
}

/* ─── Hero desk · policy folder + pen + keys ─────────────────────────────── */
export function SketchDesk({
  color = "#3a1e3d",
  accent = "#8b9d80",
  width = 480,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.66);
  return (
    <svg
      viewBox="0 0 360 240"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
    >
      {/* Desk surface */}
      <line
        x1="10"
        y1="222"
        x2="350"
        y2="222"
        strokeDasharray="4 6"
        opacity={0.5}
      />
      {/* Policy folder */}
      <g transform="translate(20 50)">
        <path d="M0 6 L18 0 L150 0 L168 6 L168 156 L0 156 Z" />
        <line x1="18" y1="0" x2="18" y2="156" opacity={0.5} />
        {/* Tab */}
        <path d="M22 -10 L66 -10 L70 6 L18 6" />
        <text
          x="44"
          y="2"
          textAnchor="middle"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize="8"
          fontWeight={700}
          fill={color}
          stroke="none"
        >
          CAR
        </text>
        {/* Stamped lines on cover */}
        <line x1="28" y1="44" x2="140" y2="44" />
        <line x1="28" y1="58" x2="118" y2="58" opacity={0.6} />
        <line x1="28" y1="82" x2="100" y2="82" opacity={0.4} />
        <line x1="28" y1="92" x2="120" y2="92" opacity={0.4} />
        <line x1="28" y1="102" x2="88" y2="102" opacity={0.4} />
        {/* Circular seal */}
        <g transform="translate(102 128)">
          <circle r="22" stroke={accent} strokeWidth={2} />
          <text
            y="3"
            textAnchor="middle"
            fontFamily="var(--font-jetbrains-mono), monospace"
            fontSize="9"
            fontWeight={700}
            fill={accent}
            stroke="none"
          >
            READ
          </text>
        </g>
      </g>
      {/* Fountain pen, gently wobbling */}
      <g className="ro-pen" transform="translate(190 110) rotate(28)">
        <path d="M0 0 L4 -6 L160 -2 L164 4 L160 10 L4 14 Z" />
        <path d="M160 -2 L184 0 L184 6 L160 10" />
        <line x1="50" y1="2" x2="50" y2="10" />
        <line x1="78" y1="2" x2="78" y2="11" />
        <path d="M4 -6 L4 14" />
      </g>
      {/* Keys */}
      <g transform="translate(248 174)">
        <circle cx="0" cy="0" r="12" />
        <line x1="10" y1="0" x2="42" y2="0" strokeWidth={3} />
        <line x1="36" y1="0" x2="36" y2="6" />
        <line x1="40" y1="0" x2="40" y2="8" />
        <circle cx="-2" cy="22" r="10" opacity={0.6} />
        <line x1="6" y1="22" x2="34" y2="22" opacity={0.6} />
      </g>
      {/* Floating ink dots */}
      <circle cx="320" cy="60" r="3" fill={accent} stroke="none" />
      <circle
        cx="332"
        cy="78"
        r="2"
        fill={accent}
        stroke="none"
        opacity={0.7}
      />
    </svg>
  );
}
