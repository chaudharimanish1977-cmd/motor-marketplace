/**
 * Car illustrations matched to body type detected from the customer's vehicle.
 * - hatchback (Wagon R, Swift, i10) — short body, tall upright rear
 * - sedan-compact (City, Dzire, Verna) — balanced 3-box profile
 * - sedan-luxury (Audi A6, BMW 5, Mercedes E) — long, low, fastback rake
 * - suv-compact (Venue, Creta, Nexon) — boxy, tall, flat roof
 * - suv-luxury (Q5, X3, GLC) — bigger SUV with premium proportions
 *
 * Visual language matches the RightOffer brand mark (`public/logo/v1.svg`):
 * a single sweeping deep-blue stroke traces the car's side silhouette. No
 * fill on the body. Spinning wheels anchor the bottom. A small orange
 * headlight at the front + thin window line at the top complete the read.
 *
 * The personalisation hook is preserved — we still pick a body type based
 * on the customer's actual vehicle — but every variant now reads as part
 * of the same brand family rather than a different illustration style per
 * vehicle class.
 */

import type { BodyType } from "@/lib/vehicle-classifier";

interface Props {
  bodyType: BodyType;
  x?: number;
  y?: number;
}

const STROKE = "#0A2463";
const STROKE_W = 2;
const ACCENT = "#FF6B35";
const WINDOW_FILL = "rgba(36, 123, 160, 0.12)";

export function CarByBodyType({ bodyType, x = 0, y = 0 }: Props) {
  switch (bodyType) {
    case "hatchback":
      return <HatchbackCar x={x} y={y} />;
    case "suv-compact":
      return <CompactSuvCar x={x} y={y} />;
    case "suv-luxury":
      return <LuxurySuvCar x={x} y={y} />;
    case "sedan-luxury":
      return <LuxurySedanCar x={x} y={y} />;
    case "sedan-compact":
    default:
      return <CompactSedanCar x={x} y={y} />;
  }
}

// ============================================================================
// Shared decoration — soft drop shadow + spinning wheels
// ============================================================================

function CarChrome({
  shadowCx,
  shadowRx,
  wheels,
  headlightX,
  taillightX,
  windowD,
}: {
  shadowCx: number;
  shadowRx: number;
  wheels: { cx: number; cy: number; r: number; spokes?: "cross" | "multi" }[];
  headlightX: number;
  taillightX: number;
  windowD: string;
}) {
  return (
    <>
      {/* Soft brand-blue shadow */}
      <ellipse
        cx={shadowCx}
        cy={40}
        rx={shadowRx}
        ry="2"
        fill="rgba(10,36,99,0.20)"
      />
      {/* Window-glass region — softly tinted, no outline */}
      <path d={windowD} fill={WINDOW_FILL} />
      {/* Headlight accent (brand orange) */}
      <circle cx={headlightX} cy="26" r="1.6" fill={ACCENT} />
      <ellipse
        cx={headlightX + 4}
        cy="27"
        rx="4"
        ry="1.3"
        fill="#FFD68A"
        opacity="0.45"
      />
      {/* Taillight accent — small deep-blue dot (mirrors headlight position) */}
      <circle cx={taillightX} cy="26" r="1.2" fill={STROKE} />
      {/* Wheels — spin via CSS */}
      {wheels.map((w, i) => (
        <SpinningWheel key={i} {...w} />
      ))}
    </>
  );
}

// ============================================================================
// HATCHBACK — short body, tall greenhouse, near-vertical rear (Wagon R, Swift)
// ============================================================================

function HatchbackCar({ x, y }: { x: number; y: number }) {
  // Outline: rear bumper → up rear face (steep) → roof (flat-ish, short) →
  // raked windshield → hood (short) → front bumper.
  const outline =
    "M 8,36 L 8,28 Q 8,22 14,22 Q 16,8 30,7 L 70,7 Q 84,8 88,22 Q 96,22 100,26 L 100,36";
  const window =
    "M 17,22 Q 19,11 30,10 L 54,10 L 54,22 Z M 56,10 L 70,10 Q 82,11 85,22 L 56,22 Z";
  return (
    <g transform={`translate(${x}, ${y})`}>
      <CarChrome
        shadowCx={54}
        shadowRx={48}
        wheels={[
          { cx: 24, cy: 36, r: 6.5 },
          { cx: 82, cy: 36, r: 6.5 },
        ]}
        headlightX={98}
        taillightX={10}
        windowD={window}
      />
      <path
        d={outline}
        stroke={STROKE}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* B-pillar — small vertical accent at the roof break */}
      <line x1="55" y1="10" x2="55" y2="22" stroke={STROKE} strokeWidth="1" />
    </g>
  );
}

// ============================================================================
// COMPACT SEDAN — balanced 3-box (City, Dzire, Verna)
// ============================================================================

function CompactSedanCar({ x, y }: { x: number; y: number }) {
  const outline =
    "M 6,36 L 6,28 Q 6,23 14,22 L 30,20 Q 36,9 50,8 L 80,8 Q 92,9 100,20 L 116,22 Q 122,23 122,28 L 122,36";
  const window =
    "M 33,20 Q 37,11 50,10 L 62,10 L 62,20 Z M 64,10 L 80,10 Q 90,11 96,20 L 64,20 Z";
  return (
    <g transform={`translate(${x}, ${y})`}>
      <CarChrome
        shadowCx={64}
        shadowRx={56}
        wheels={[
          { cx: 28, cy: 36, r: 7 },
          { cx: 100, cy: 36, r: 7 },
        ]}
        headlightX={120}
        taillightX={8}
        windowD={window}
      />
      <path
        d={outline}
        stroke={STROKE}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="63" y1="10" x2="63" y2="20" stroke={STROKE} strokeWidth="1" />
    </g>
  );
}

// ============================================================================
// LUXURY SEDAN — long, low, fastback rake (Audi A6, BMW 5, Mercedes E)
// Reads as the brand coupe with a sedan stance.
// ============================================================================

function LuxurySedanCar({ x, y }: { x: number; y: number }) {
  const outline =
    "M 4,36 L 4,28 Q 4,24 10,24 Q 12,22 18,22 L 36,20 Q 42,12 60,9 L 76,9 Q 90,10 100,18 L 122,24 Q 128,25 128,28 L 128,36";
  const window =
    "M 39,20 Q 44,13 60,11 L 68,11 L 68,20 Z M 70,11 L 76,11 Q 88,12 96,19 L 70,20 Z";
  return (
    <g transform={`translate(${x}, ${y})`}>
      <CarChrome
        shadowCx={66}
        shadowRx={62}
        wheels={[
          { cx: 28, cy: 36, r: 7.5, spokes: "multi" },
          { cx: 104, cy: 36, r: 7.5, spokes: "multi" },
        ]}
        headlightX={124}
        taillightX={6}
        windowD={window}
      />
      <path
        d={outline}
        stroke={STROKE}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="69" y1="11" x2="69" y2="20" stroke={STROKE} strokeWidth="1" />
      {/* Chrome belt-line — luxury cue, runs along the door tops */}
      <line
        x1="12"
        y1="28"
        x2="124"
        y2="28"
        stroke={STROKE}
        strokeWidth="0.7"
        opacity="0.45"
      />
    </g>
  );
}

// ============================================================================
// COMPACT SUV — boxy, tall, flat roof (Venue, Creta, Nexon, Brezza)
// ============================================================================

function CompactSuvCar({ x, y }: { x: number; y: number }) {
  const outline =
    "M 6,36 L 6,26 Q 6,21 14,21 L 22,21 Q 24,6 36,5 L 84,5 Q 94,6 96,21 L 108,21 Q 116,22 116,27 L 116,36";
  const window =
    "M 25,21 Q 27,7 36,7 L 60,7 L 60,21 Z M 62,7 L 84,7 Q 92,8 94,21 L 62,21 Z";
  return (
    <g transform={`translate(${x}, ${y})`}>
      <CarChrome
        shadowCx={62}
        shadowRx={54}
        wheels={[
          { cx: 28, cy: 36, r: 8 },
          { cx: 96, cy: 36, r: 8 },
        ]}
        headlightX={114}
        taillightX={8}
        windowD={window}
      />
      <path
        d={outline}
        stroke={STROKE}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="61" y1="7" x2="61" y2="21" stroke={STROKE} strokeWidth="1" />
      {/* Roof rails — tiny accent bar on top, SUV signature */}
      <line
        x1="32"
        y1="5"
        x2="86"
        y2="5"
        stroke={STROKE}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </g>
  );
}

// ============================================================================
// LUXURY SUV — bigger SUV with premium proportions (Q5, X3, GLC, XC60)
// ============================================================================

function LuxurySuvCar({ x, y }: { x: number; y: number }) {
  const outline =
    "M 4,36 L 4,25 Q 4,20 12,20 L 22,20 Q 26,5 38,4 L 86,4 Q 96,5 98,20 L 112,20 Q 122,22 122,27 L 122,36";
  const window =
    "M 25,20 Q 28,6 38,6 L 62,6 L 62,20 Z M 64,6 L 86,6 Q 94,7 96,20 L 64,20 Z";
  return (
    <g transform={`translate(${x}, ${y})`}>
      <CarChrome
        shadowCx={64}
        shadowRx={60}
        wheels={[
          { cx: 28, cy: 36, r: 8.5, spokes: "multi" },
          { cx: 100, cy: 36, r: 8.5, spokes: "multi" },
        ]}
        headlightX={120}
        taillightX={6}
        windowD={window}
      />
      <path
        d={outline}
        stroke={STROKE}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="63" y1="6" x2="63" y2="20" stroke={STROKE} strokeWidth="1" />
      <line
        x1="32"
        y1="4"
        x2="92"
        y2="4"
        stroke={STROKE}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="28"
        x2="118"
        y2="28"
        stroke={STROKE}
        strokeWidth="0.7"
        opacity="0.45"
      />
    </g>
  );
}

// ============================================================================
// Reusable spinning wheel — outer tyre + inner rim + spokes spin via CSS
// Kept compatible with the existing CircularJourneyLoader scene.
// ============================================================================

function SpinningWheel({
  cx,
  cy,
  r,
  spokes = "cross",
}: {
  cx: number;
  cy: number;
  r: number;
  spokes?: "cross" | "multi";
}) {
  const inner = r * 0.65;
  const hub = r * 0.18;
  return (
    <g>
      {/* Outer tyre — static */}
      <circle cx={cx} cy={cy} r={r} fill="#0d0d0d" />
      {/* Spokes group — animated */}
      <g
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        className="animate-wheel-spin"
      >
        <circle cx={cx} cy={cy} r={inner} fill="#4a5562" />
        {spokes === "cross" && (
          <>
            <line
              x1={cx}
              y1={cy - r * 0.6}
              x2={cx}
              y2={cy + r * 0.6}
              stroke="#0d0d0d"
              strokeWidth={r * 0.18}
            />
            <line
              x1={cx - r * 0.6}
              y1={cy}
              x2={cx + r * 0.6}
              y2={cy}
              stroke="#0d0d0d"
              strokeWidth={r * 0.18}
            />
            <line
              x1={cx - r * 0.43}
              y1={cy - r * 0.43}
              x2={cx + r * 0.43}
              y2={cy + r * 0.43}
              stroke="#0d0d0d"
              strokeWidth={r * 0.13}
            />
            <line
              x1={cx + r * 0.43}
              y1={cy - r * 0.43}
              x2={cx - r * 0.43}
              y2={cy + r * 0.43}
              stroke="#0d0d0d"
              strokeWidth={r * 0.13}
            />
          </>
        )}
        {spokes === "multi" && (
          // 8-spoke alloy pattern for luxury vehicles
          <>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const x1 = cx + (hub + 1) * Math.cos(rad);
              const y1 = cy + (hub + 1) * Math.sin(rad);
              const x2 = cx + (inner - 0.3) * Math.cos(rad);
              const y2 = cy + (inner - 0.3) * Math.sin(rad);
              return (
                <line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#1a1f2c"
                  strokeWidth={r * 0.12}
                />
              );
            })}
          </>
        )}
        <circle cx={cx} cy={cy} r={hub} fill="#0d0d0d" />
      </g>
    </g>
  );
}
