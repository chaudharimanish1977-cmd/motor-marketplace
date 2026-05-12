/**
 * Car illustrations matched to body type detected from the customer's vehicle.
 * - hatchback (Wagon R, Swift, i10) — short, tall, upright rear
 * - sedan-compact (City, Dzire, Verna) — standard 3-box sedan
 * - sedan-luxury (Audi A6, BMW 5, Mercedes E) — long, low, sleek, sporty wheels + slim LED headlights + grille pattern
 * - suv-compact (Venue, Creta, Nexon) — boxy, tall, roof rails, big wheels
 * - suv-luxury (Q5, X3, GLC) — bigger SUV with premium detail
 *
 * All silhouettes share: spinning wheels (via CSS), brand-orange body (high
 * contrast against the asphalt road), headlight + red taillight + bumpers +
 * door handles. Differences are silhouette shape, wheel size/style, and
 * brand-specific cues (Audi's grille, etc.).
 */

import type { BodyType } from "@/lib/vehicle-classifier";

interface Props {
  bodyType: BodyType;
  x?: number;
  y?: number;
}

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
// HATCHBACK — short body, tall greenhouse, upright rear (Wagon R, Swift)
// ============================================================================

function HatchbackCar({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx="50" cy="40" rx="44" ry="2.5" fill="rgba(0,0,0,0.25)" />

      {/* Roof — tall, rectangular-ish */}
      <path
        d="M 25,16 C 28,6 38,5 46,5 L 70,5 C 78,5 84,7 87,16 Z"
        fill="#FF6B35"
      />

      {/* Body — short, taller */}
      <path
        d="M 6,28 Q 7,22 14,21 L 26,20 L 90,20 Q 96,21 99,24 L 102,26 Q 104,28 104,31 L 104,36 L 6,36 Z"
        fill="#FF6B35"
      />

      {/* Front windshield */}
      <path d="M 26,19 C 29,8 39,7 46,7 L 54,7 L 54,19 Z" fill="#cfe8f4" opacity="0.95" />

      {/* Rear window — UPRIGHT (hatchback hallmark) */}
      <path d="M 56,7 L 70,7 C 78,7 84,9 86,19 L 56,19 Z" fill="#cfe8f4" opacity="0.85" />

      {/* B-pillar */}
      <rect x="54" y="7" width="2" height="12" fill="#FF6B35" />

      {/* Door line */}
      <line x1="55" y1="20" x2="55" y2="36" stroke="rgba(0,0,0,0.28)" strokeWidth="0.6" />

      {/* Door handle */}
      <rect x="40" y="25" width="8" height="1.5" rx="0.6" fill="rgba(255,255,255,0.55)" />
      <rect x="66" y="25" width="8" height="1.5" rx="0.6" fill="rgba(255,255,255,0.55)" />

      {/* Mirror */}
      <path d="M 31,16 L 27,13 Q 26,13 26,14.5 L 29,17 Z" fill="#FF6B35" />

      {/* Wheel arches */}
      <circle cx="24" cy="36" r="8.5" fill="#FF6B35" />
      <circle cx="86" cy="36" r="8.5" fill="#FF6B35" />

      <SpinningWheel cx={24} cy={36} r={6.5} />
      <SpinningWheel cx={86} cy={36} r={6.5} />

      {/* Headlight + light beam */}
      <ellipse cx="100" cy="27" rx="2.8" ry="1.8" fill="#fff4c0" />
      <ellipse cx="100" cy="27" rx="1.4" ry="0.9" fill="#fff" />
      <ellipse cx="106" cy="29" rx="5" ry="1.6" fill="#fff4c0" opacity="0.4" />

      {/* Grille — simple */}
      <line x1="98" y1="30" x2="103" y2="30" stroke="rgba(0,0,0,0.4)" strokeWidth="0.7" />

      {/* Bumpers */}
      <rect x="98" y="33" width="5" height="2" rx="0.7" fill="rgba(0,0,0,0.18)" />
      <rect x="7" y="33" width="5" height="2" rx="0.7" fill="rgba(0,0,0,0.18)" />

      {/* Taillight */}
      <rect x="9" y="26" width="3.5" height="4" rx="0.7" fill="#b91c1c" />
    </g>
  );
}

// ============================================================================
// COMPACT SEDAN — standard 3-box sedan profile (City, Dzire, Verna)
// ============================================================================

function CompactSedanCar({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="60" cy="42" rx="52" ry="2.5" fill="rgba(0,0,0,0.25)" />

      {/* Roof — smoothly sloping front+rear */}
      <path
        d="M 35,18 C 38,9 49,7 56,7 L 80,7 C 88,7 96,9 100,18 Z"
        fill="#FF6B35"
      />

      {/* Body */}
      <path
        d="M 10,30 Q 11,25 17,24 L 36,22 L 100,22 Q 110,23 116,26 L 119,28 Q 121,30 121,33 L 121,38 L 10,38 Z"
        fill="#FF6B35"
      />

      <path d="M 12,25 L 119,25" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />

      <path d="M 36,21 C 39,11 49,9 56,9 L 64,9 L 64,21 Z" fill="#cfe8f4" opacity="0.95" />
      <path d="M 66,9 L 78,9 C 86,9 93,12 98,21 L 66,21 Z" fill="#cfe8f4" opacity="0.8" />

      <rect x="64" y="9" width="2" height="12" fill="#FF6B35" />
      <line x1="65" y1="22" x2="65" y2="38" stroke="rgba(0,0,0,0.28)" strokeWidth="0.6" />
      <rect x="45" y="27" width="9" height="1.6" rx="0.7" fill="rgba(255,255,255,0.55)" />
      <rect x="78" y="27" width="9" height="1.6" rx="0.7" fill="rgba(255,255,255,0.55)" />
      <path d="M 40,18 L 36,14 Q 35,14 35,15.5 L 38,19 Z" fill="#FF6B35" />

      <circle cx="30" cy="38" r="10" fill="#FF6B35" />
      <circle cx="100" cy="38" r="10" fill="#FF6B35" />
      <SpinningWheel cx={30} cy={38} r={7.5} />
      <SpinningWheel cx={100} cy={38} r={7.5} />

      <ellipse cx="118" cy="29" rx="3.2" ry="2.1" fill="#fff4c0" />
      <ellipse cx="118" cy="29" rx="1.6" ry="1.1" fill="#fff" />
      <ellipse cx="125" cy="31" rx="6" ry="2" fill="#fff4c0" opacity="0.4" />
      <line x1="116" y1="32" x2="121" y2="32" stroke="rgba(0,0,0,0.4)" strokeWidth="0.8" />
      <line x1="116" y1="33.8" x2="121" y2="33.8" stroke="rgba(0,0,0,0.4)" strokeWidth="0.8" />
      <rect x="115" y="36" width="6" height="2" rx="0.8" fill="rgba(0,0,0,0.18)" />
      <rect x="11" y="36" width="6" height="2" rx="0.8" fill="rgba(0,0,0,0.18)" />
      <rect x="13" y="28" width="3.5" height="4" rx="0.8" fill="#b91c1c" />
    </g>
  );
}

// ============================================================================
// LUXURY SEDAN — long, low, sleek (Audi A6, BMW 5, Mercedes E)
// ============================================================================

function LuxurySedanCar({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Wider, longer shadow */}
      <ellipse cx="65" cy="42" rx="58" ry="2.5" fill="rgba(0,0,0,0.28)" />

      {/* Roof — smaller, more sloped (coupe-like rear) */}
      <path
        d="M 42,18 C 46,10 56,8 64,8 L 80,8 C 86,8 92,11 96,18 Z"
        fill="#FF6B35"
      />

      {/* Body — longer + slightly lower stance */}
      <path
        d="M 4,30 Q 5,24 12,23 L 32,21 L 102,21 Q 116,22 124,26 L 128,28 Q 130,30 130,33 L 130,38 L 4,38 Z"
        fill="#FF6B35"
      />

      {/* Chrome waist strip (luxury cue) */}
      <path d="M 7,25 L 128,25" stroke="rgba(220,220,230,0.5)" strokeWidth="0.5" />

      {/* Front windshield — more raked */}
      <path
        d="M 43,21 C 47,12 57,10 64,10 L 70,10 L 70,21 Z"
        fill="#9ddafa"
        opacity="0.95"
      />
      {/* Rear window — sloping coupe-like */}
      <path
        d="M 72,10 L 78,10 C 84,10 90,12 95,21 L 72,21 Z"
        fill="#9ddafa"
        opacity="0.8"
      />

      <rect x="70" y="10" width="2" height="11" fill="#FF6B35" />
      <line x1="71" y1="22" x2="71" y2="38" stroke="rgba(0,0,0,0.28)" strokeWidth="0.6" />

      {/* Door handles — slimmer, chrome */}
      <rect x="50" y="27" width="10" height="1.4" rx="0.5" fill="#e0e6eb" />
      <rect x="82" y="27" width="10" height="1.4" rx="0.5" fill="#e0e6eb" />

      {/* Sporty side mirror */}
      <path d="M 47,18 L 42,14 Q 41,14 41,15.5 L 45,19 Z" fill="#FF6B35" />

      {/* Wheel arches — slightly smaller for low-profile stance */}
      <circle cx="28" cy="38" r="11" fill="#FF6B35" />
      <circle cx="106" cy="38" r="11" fill="#FF6B35" />

      {/* Multi-spoke alloy wheels (sportier) */}
      <SpinningWheel cx={28} cy={38} r={8.5} spokes="multi" />
      <SpinningWheel cx={106} cy={38} r={8.5} spokes="multi" />

      {/* LED-strip headlight (slim, modern) */}
      <rect x="123" y="27" width="6" height="2" rx="1" fill="#fffce0" />
      <rect x="124" y="27.5" width="4" height="1" rx="0.5" fill="#fff" />
      {/* Headlight signature — small LED dots */}
      <circle cx="123.5" cy="30.5" r="0.5" fill="#fffce0" />
      <circle cx="125" cy="30.5" r="0.5" fill="#fffce0" />
      <circle cx="126.5" cy="30.5" r="0.5" fill="#fffce0" />
      <circle cx="128" cy="30.5" r="0.5" fill="#fffce0" />
      {/* Light beam */}
      <ellipse cx="132" cy="31" rx="6" ry="1.8" fill="#fff4c0" opacity="0.4" />

      {/* Distinctive luxury grille — hexagonal pattern */}
      <g stroke="rgba(220,220,230,0.6)" strokeWidth="0.4" fill="none">
        <path d="M 121,32 L 129,32 M 121,33.5 L 129,33.5 M 121,35 L 129,35" />
        <path d="M 122,32 L 122,35 M 124,32 L 124,35 M 126,32 L 126,35 M 128,32 L 128,35" />
      </g>

      {/* Bumpers */}
      <rect x="123" y="36" width="6" height="2" rx="0.8" fill="rgba(0,0,0,0.18)" />
      <rect x="5" y="36" width="6" height="2" rx="0.8" fill="rgba(0,0,0,0.18)" />

      {/* Slim taillight — luxury style */}
      <rect x="6" y="28" width="5" height="3" rx="0.5" fill="#b91c1c" />
      <rect x="6.5" y="29" width="4" height="0.6" rx="0.3" fill="#ffb380" />
    </g>
  );
}

// ============================================================================
// COMPACT SUV — boxy, tall, roof rails (Venue, Creta, Nexon, Brezza)
// ============================================================================

function CompactSuvCar({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="62" cy="42" rx="52" ry="2.5" fill="rgba(0,0,0,0.28)" />

      {/* Roof rails — small bars on top */}
      <rect x="35" y="6" width="50" height="0.8" fill="#3a4554" rx="0.4" />

      {/* Roof — very boxy, flat */}
      <path
        d="M 28,16 C 30,8 36,6.5 42,6.5 L 84,6.5 C 92,6.5 98,8 100,16 Z"
        fill="#FF6B35"
      />

      {/* Body — taller stance, higher waistline */}
      <path
        d="M 8,32 Q 9,26 16,25 L 36,23 L 100,23 Q 110,24 117,27 L 120,29 Q 122,31 122,34 L 122,38 L 8,38 Z"
        fill="#FF6B35"
      />

      <path d="M 11,26 L 120,26" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />

      {/* Cladding strip (SUV signature) — darker plastic look at bottom */}
      <rect x="6" y="37" width="118" height="1.5" fill="rgba(0,0,0,0.25)" />

      {/* Front windshield — more vertical */}
      <path d="M 29,22 C 31,9 38,8 42,8 L 64,8 L 64,22 Z" fill="#cfe8f4" opacity="0.95" />
      {/* Rear window */}
      <path d="M 66,8 L 84,8 C 92,8 98,11 99,22 L 66,22 Z" fill="#cfe8f4" opacity="0.82" />

      <rect x="64" y="8" width="2" height="14" fill="#FF6B35" />
      <line x1="65" y1="23" x2="65" y2="38" stroke="rgba(0,0,0,0.28)" strokeWidth="0.6" />
      <rect x="44" y="28" width="9" height="1.6" rx="0.7" fill="rgba(255,255,255,0.55)" />
      <rect x="78" y="28" width="9" height="1.6" rx="0.7" fill="rgba(255,255,255,0.55)" />
      <path d="M 34,18 L 30,14 Q 29,14 29,15.5 L 32,19 Z" fill="#FF6B35" />

      {/* BIGGER wheel arches (SUV trait) */}
      <circle cx="28" cy="38" r="11.5" fill="#FF6B35" />
      <circle cx="100" cy="38" r="11.5" fill="#FF6B35" />

      {/* Bigger wheels */}
      <SpinningWheel cx={28} cy={38} r={9} />
      <SpinningWheel cx={100} cy={38} r={9} />

      {/* Headlight — wider, SUV style */}
      <ellipse cx="118" cy="28" rx="3.5" ry="2.3" fill="#fff4c0" />
      <ellipse cx="118" cy="28" rx="1.8" ry="1.2" fill="#fff" />
      <ellipse cx="125" cy="31" rx="6" ry="2" fill="#fff4c0" opacity="0.4" />

      {/* Hyundai-style cascading grille hint */}
      <path
        d="M 114,31 L 122,31 L 122,34 L 114,34 Z"
        fill="rgba(0,0,0,0.35)"
      />
      <line x1="114" y1="32.5" x2="122" y2="32.5" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" />

      {/* Bumpers + skid plate (SUV) */}
      <rect x="113" y="35.5" width="9" height="2.5" rx="0.5" fill="rgba(0,0,0,0.3)" />
      <rect x="8" y="35.5" width="9" height="2.5" rx="0.5" fill="rgba(0,0,0,0.3)" />

      {/* Taillight */}
      <rect x="10" y="28" width="4" height="4" rx="0.8" fill="#b91c1c" />
    </g>
  );
}

// ============================================================================
// LUXURY SUV — bigger SUV with premium detail (Q5, X3, GLC, XC60)
// ============================================================================

function LuxurySuvCar({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="65" cy="42" rx="56" ry="2.7" fill="rgba(0,0,0,0.28)" />
      <rect x="35" y="5.5" width="56" height="0.8" fill="#3a4554" rx="0.4" />

      <path d="M 30,15 C 33,7 40,5.5 48,5.5 L 88,5.5 C 96,5.5 102,7 104,15 Z" fill="#FF6B35" />
      <path
        d="M 5,32 Q 6,25 14,24 L 36,22 L 104,22 Q 116,23 124,27 L 128,29 Q 130,31 130,34 L 130,38 L 5,38 Z"
        fill="#FF6B35"
      />
      <path d="M 8,26 L 128,26" stroke="rgba(220,220,230,0.5)" strokeWidth="0.5" />
      <rect x="4" y="37" width="126" height="1.5" fill="rgba(0,0,0,0.22)" />

      <path d="M 31,22 C 34,8 41,7 48,7 L 64,7 L 64,22 Z" fill="#9ddafa" opacity="0.95" />
      <path d="M 66,7 L 88,7 C 96,7 102,10 103,22 L 66,22 Z" fill="#9ddafa" opacity="0.82" />

      <rect x="64" y="7" width="2" height="15" fill="#FF6B35" />
      <line x1="65" y1="23" x2="65" y2="38" stroke="rgba(0,0,0,0.28)" strokeWidth="0.6" />
      <rect x="42" y="28" width="10" height="1.4" rx="0.5" fill="#e0e6eb" />
      <rect x="84" y="28" width="10" height="1.4" rx="0.5" fill="#e0e6eb" />
      <path d="M 36,18 L 32,13 Q 31,13 31,15 L 34,19 Z" fill="#FF6B35" />

      <circle cx="30" cy="38" r="12" fill="#FF6B35" />
      <circle cx="106" cy="38" r="12" fill="#FF6B35" />
      <SpinningWheel cx={30} cy={38} r={9.5} spokes="multi" />
      <SpinningWheel cx={106} cy={38} r={9.5} spokes="multi" />

      <rect x="121" y="28" width="7" height="2" rx="1" fill="#fffce0" />
      <ellipse cx="132" cy="30" rx="6" ry="2" fill="#fff4c0" opacity="0.4" />
      <g stroke="rgba(220,220,230,0.6)" strokeWidth="0.4" fill="none">
        <path d="M 121,31 L 129,31 M 121,33 L 129,33 M 121,35 L 129,35" />
      </g>
      <rect x="120" y="36" width="9" height="2" rx="0.5" fill="rgba(0,0,0,0.28)" />
      <rect x="5" y="36" width="9" height="2" rx="0.5" fill="rgba(0,0,0,0.28)" />
      <rect x="7" y="28" width="5" height="3.5" rx="0.5" fill="#b91c1c" />
    </g>
  );
}

// ============================================================================
// Reusable spinning wheel — outer rim + inner rim + spokes that spin via CSS
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
