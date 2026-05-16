/**
 * Scrolling parallax scenery for the journey loader.
 *
 * Two layers:
 *  - Background (buildings, monument) — scrolls slower (9s loop) for depth.
 *  - Foreground (trees, lampposts) — scrolls faster (4s loop) for parallax.
 *
 * City-aware: shows a recognisable monument silhouette per RTO.
 * Each strip is rendered twice side-by-side (at x=0 and x=400) so the scroll
 * loops seamlessly.
 */

import type { ReactNode } from "react";

// ============================================================================
// City monument resolver
// ============================================================================

type MonumentKind =
  | "india-gate" // Delhi + NCR
  | "gateway" // Mumbai / Thane / Kalyan
  | "charminar" // Hyderabad
  | "lighthouse" // Chennai / coastal
  | "modern-tower" // Bangalore + tech hubs
  | "howrah-bridge" // Kolkata
  | "generic-monument";

function getMonument(city?: string | null): MonumentKind {
  if (!city) return "generic-monument";
  const c = city.toLowerCase();
  if (
    c.includes("delhi") ||
    c.includes("noida") ||
    c.includes("gurgaon") ||
    c.includes("gurugram") ||
    c.includes("faridabad") ||
    c.includes("ghaziabad")
  )
    return "india-gate";
  if (
    c.includes("mumbai") ||
    c.includes("thane") ||
    c.includes("kalyan") ||
    c.includes("dombivli") ||
    c.includes("navi mumbai")
  )
    return "gateway";
  if (c.includes("hyderabad") || c.includes("secunderabad")) return "charminar";
  if (c.includes("chennai")) return "lighthouse";
  if (c.includes("bangalore") || c.includes("bengaluru")) return "modern-tower";
  if (c.includes("kolkata") || c.includes("howrah")) return "howrah-bridge";
  return "generic-monument";
}

// ============================================================================
// Background scenery strip (buildings + monument)
// All scenery sits on baseline y=135 (the ground line).
// Buildings extend UPWARD from baseline.
// ============================================================================

interface SceneryStripProps {
  city?: string | null;
}

export function BackgroundScenery({ city }: SceneryStripProps) {
  return (
    <g className="animate-scenery-scroll">
      <BackgroundStrip city={city} offsetX={0} />
      <BackgroundStrip city={city} offsetX={400} />
    </g>
  );
}

export function ForegroundScenery() {
  return (
    <g className="animate-scenery-near-scroll">
      <ForegroundStrip offsetX={0} />
      <ForegroundStrip offsetX={400} />
    </g>
  );
}

// ============================================================================

function BackgroundStrip({
  city,
  offsetX,
}: {
  city?: string | null;
  offsetX: number;
}) {
  const monument = getMonument(city);
  return (
    <g transform={`translate(${offsetX}, 0)`}>
      {/* x: 0-40 — small residential cluster */}
      <SmallBuilding x={5} h={32} />
      <SmallBuilding x={28} h={28} accentColor="#1d4ed8" />

      {/* x: 60-110 — mid office tower */}
      <MidOffice x={62} h={50} />

      {/* x: 130-200 — monument */}
      <Monument kind={monument} x={130} />

      {/* x: 220-260 — tall tower */}
      <TallTower x={220} h={68} />

      {/* x: 275-320 — mid building */}
      <MidOffice x={275} h={42} accentColor="#4338ca" />

      {/* x: 335-395 — building cluster (small + tall) */}
      <SmallBuilding x={335} h={30} />
      <TallTower x={358} h={55} />
    </g>
  );
}

function ForegroundStrip({ offsetX }: { offsetX: number }) {
  return (
    <g transform={`translate(${offsetX}, 0)`}>
      <Tree x={50} />
      <Lamppost x={120} />
      <Tree x={200} />
      <Tree x={275} />
      <Lamppost x={340} />
    </g>
  );
}

// ============================================================================
// Building components — silhouettes in muted brand-navy tones
// ============================================================================

function SmallBuilding({
  x,
  h,
  accentColor,
}: {
  x: number;
  h: number;
  accentColor?: string;
}) {
  const top = 135 - h;
  const baseColor = accentColor ?? "#1e3a8a";
  return (
    <g opacity="0.45">
      <rect x={x} y={top} width="20" height={h} fill={baseColor} />
      {/* Windows */}
      {Array.from({ length: Math.floor(h / 5) - 1 }).map((_, i) => (
        <Window key={i} x={x + 3} y={top + 4 + i * 5} w={3.5} h={2.5} />
      ))}
      {Array.from({ length: Math.floor(h / 5) - 1 }).map((_, i) => (
        <Window key={`r-${i}`} x={x + 9} y={top + 4 + i * 5} w={3.5} h={2.5} />
      ))}
      {Array.from({ length: Math.floor(h / 5) - 1 }).map((_, i) => (
        <Window key={`rr-${i}`} x={x + 15} y={top + 4 + i * 5} w={3.5} h={2.5} />
      ))}
    </g>
  );
}

function MidOffice({
  x,
  h,
  accentColor,
}: {
  x: number;
  h: number;
  accentColor?: string;
}) {
  const top = 135 - h;
  const baseColor = accentColor ?? "#0A2463";
  return (
    <g opacity="0.55">
      <rect x={x} y={top} width="28" height={h} fill={baseColor} />
      {/* Window grid */}
      {Array.from({ length: Math.floor(h / 6) - 1 }).map((_, row) =>
        [0, 1, 2, 3].map((col) => (
          <Window
            key={`${row}-${col}`}
            x={x + 3 + col * 6}
            y={top + 4 + row * 6}
            w={3.5}
            h={3.5}
          />
        ))
      )}
      {/* Rooftop antenna */}
      <line
        x1={x + 14}
        y1={top - 4}
        x2={x + 14}
        y2={top}
        stroke={baseColor}
        strokeWidth="1"
      />
    </g>
  );
}

function TallTower({ x, h }: { x: number; h: number }) {
  const top = 135 - h;
  return (
    <g opacity="0.6">
      {/* Main shaft */}
      <rect x={x} y={top} width="20" height={h} fill="#0A2463" />
      {/* Top tapered section */}
      <path
        d={`M ${x},${top} L ${x + 4},${top - 8} L ${x + 16},${top - 8} L ${x + 20},${top} Z`}
        fill="#0A2463"
      />
      {/* Glass strip down the middle */}
      <rect x={x + 8} y={top + 4} width="4" height={h - 6} fill="#247BA0" opacity="0.5" />
      {/* Windows */}
      {Array.from({ length: Math.floor(h / 5) - 1 }).map((_, row) => (
        <g key={row}>
          <Window x={x + 2} y={top + 4 + row * 5} w={4} h={3} />
          <Window x={x + 14} y={top + 4 + row * 5} w={4} h={3} />
        </g>
      ))}
      {/* Crown */}
      <rect x={x + 9} y={top - 12} width="2" height="4" fill="#0A2463" />
    </g>
  );
}

function Window({
  x,
  y,
  w,
  h,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  return <rect x={x} y={y} width={w} height={h} fill="#fde68a" opacity="0.5" />;
}

// ============================================================================
// Foreground items
// ============================================================================

function Tree({ x }: { x: number }) {
  return (
    <g opacity="0.85">
      {/* Trunk */}
      <rect x={x + 4} y={123} width="3" height="12" fill="#5c3a1e" />
      {/* Foliage — layered circles */}
      <circle cx={x + 5.5} cy={120} r="8" fill="#1f4f2b" />
      <circle cx={x + 9} cy={117} r="6" fill="#256b35" />
      <circle cx={x + 2} cy={117} r="6" fill="#1f5e30" />
      <circle cx={x + 5.5} cy={113} r="5" fill="#2d7d40" />
    </g>
  );
}

function Lamppost({ x }: { x: number }) {
  return (
    <g opacity="0.75">
      {/* Pole */}
      <rect x={x + 1} y={108} width="1.5" height="27" fill="#3a4554" />
      {/* Lamp arm */}
      <line x1={x + 2} y1="111" x2={x + 8} y2="111" stroke="#3a4554" strokeWidth="1" />
      {/* Lamp head */}
      <circle cx={x + 9} cy="112" r="2" fill="#fde68a" />
      {/* Glow */}
      <circle cx={x + 9} cy="112" r="4" fill="#fde68a" opacity="0.25" />
    </g>
  );
}

// ============================================================================
// City monuments (silhouettes positioned so bottom sits at y=135)
// ============================================================================

function Monument({ kind, x }: { kind: MonumentKind; x: number }) {
  const wrap = (children: ReactNode) => (
    <g transform={`translate(${x}, 0)`} opacity="0.7">
      {children}
    </g>
  );

  if (kind === "india-gate") {
    // Two pillars + arch + topper (India Gate, Delhi)
    return wrap(
      <g>
        {/* Wide stepped base */}
        <rect x="-2" y="130" width="64" height="5" fill="#0A2463" />
        <rect x="2" y="125" width="56" height="5" fill="#0A2463" />
        {/* Left pillar */}
        <rect x="8" y="83" width="9" height="42" fill="#0A2463" />
        {/* Right pillar */}
        <rect x="43" y="83" width="9" height="42" fill="#0A2463" />
        {/* Top horizontal */}
        <rect x="5" y="80" width="50" height="6" fill="#0A2463" />
        {/* Arch curve at top */}
        <path
          d="M 17,86 Q 30,72 43,86 L 43,90 L 17,90 Z"
          fill="#0A2463"
        />
        {/* Pinnacle (flame/lotus) */}
        <rect x="27" y="73" width="6" height="7" fill="#0A2463" />
        <circle cx="30" cy="71" r="2" fill="#0A2463" />
      </g>
    );
  }

  if (kind === "gateway") {
    // Gateway of India — central dome + side towers (Mumbai)
    return wrap(
      <g>
        {/* Base platform */}
        <rect x="-2" y="128" width="64" height="7" fill="#0A2463" />
        {/* Main central arch body */}
        <rect x="15" y="95" width="30" height="33" fill="#0A2463" />
        {/* Arch opening (cutout, drawn over base) */}
        <path d="M 22,128 L 22,108 Q 30,98 38,108 L 38,128 Z" fill="#f5fafe" opacity="0.5" />
        {/* Central dome */}
        <ellipse cx="30" cy="95" rx="16" ry="10" fill="#0A2463" />
        {/* Side mini-towers */}
        <rect x="0" y="108" width="10" height="20" fill="#0A2463" />
        <rect x="50" y="108" width="10" height="20" fill="#0A2463" />
        <ellipse cx="5" cy="108" rx="5.5" ry="3" fill="#0A2463" />
        <ellipse cx="55" cy="108" rx="5.5" ry="3" fill="#0A2463" />
        {/* Dome spires */}
        <line x1="30" y1="85" x2="30" y2="78" stroke="#0A2463" strokeWidth="1.5" />
        <line x1="5" y1="105" x2="5" y2="100" stroke="#0A2463" strokeWidth="1" />
        <line x1="55" y1="105" x2="55" y2="100" stroke="#0A2463" strokeWidth="1" />
      </g>
    );
  }

  if (kind === "charminar") {
    // 4 corner minarets + central body (Hyderabad)
    return wrap(
      <g>
        {/* Base */}
        <rect x="0" y="125" width="60" height="10" fill="#0A2463" />
        {/* Central body */}
        <rect x="10" y="95" width="40" height="30" fill="#0A2463" />
        {/* Central arch cutout */}
        <path d="M 20,125 L 20,108 Q 30,100 40,108 L 40,125 Z" fill="#f5fafe" opacity="0.5" />
        {/* Minaret bases */}
        <rect x="2" y="75" width="6" height="50" fill="#0A2463" />
        <rect x="52" y="75" width="6" height="50" fill="#0A2463" />
        <rect x="10" y="80" width="3" height="15" fill="#0A2463" />
        <rect x="47" y="80" width="3" height="15" fill="#0A2463" />
        {/* Minaret bulbs (domed tops) */}
        <ellipse cx="5" cy="75" rx="4" ry="3" fill="#0A2463" />
        <ellipse cx="55" cy="75" rx="4" ry="3" fill="#0A2463" />
        {/* Spire on minarets */}
        <line x1="5" y1="72" x2="5" y2="66" stroke="#0A2463" strokeWidth="1.5" />
        <line x1="55" y1="72" x2="55" y2="66" stroke="#0A2463" strokeWidth="1.5" />
        {/* Central crown */}
        <ellipse cx="30" cy="95" rx="6" ry="3" fill="#0A2463" />
        <line x1="30" y1="92" x2="30" y2="86" stroke="#0A2463" strokeWidth="1.5" />
      </g>
    );
  }

  if (kind === "lighthouse") {
    // Slim tall tower with lamp room (Chennai Marina)
    return wrap(
      <g>
        {/* Base */}
        <rect x="5" y="130" width="20" height="5" fill="#0A2463" />
        {/* Tower (tapered) */}
        <path
          d="M 8,130 L 12,75 L 18,75 L 22,130 Z"
          fill="#0A2463"
        />
        {/* Striped bands */}
        <rect x="9" y="95" width="12" height="3" fill="#f5fafe" opacity="0.4" />
        <rect x="9" y="110" width="12" height="3" fill="#f5fafe" opacity="0.4" />
        {/* Lamp room */}
        <rect x="9" y="70" width="12" height="6" fill="#0A2463" />
        {/* Light beam */}
        <ellipse cx="29" cy="73" rx="10" ry="2" fill="#fde68a" opacity="0.5" />
        {/* Spire */}
        <path d="M 13,70 L 15,63 L 17,70 Z" fill="#0A2463" />
      </g>
    );
  }

  if (kind === "modern-tower") {
    // Glass/concrete modern tower (Bangalore tech hubs)
    return wrap(
      <g>
        {/* Main shaft */}
        <rect x="10" y="65" width="22" height="70" fill="#0A2463" />
        {/* Glass face */}
        <rect x="13" y="68" width="16" height="64" fill="#247BA0" opacity="0.6" />
        {/* Window grid */}
        {Array.from({ length: 12 }).map((_, row) =>
          [0, 1, 2].map((col) => (
            <Window
              key={`${row}-${col}`}
              x={14 + col * 5}
              y={70 + row * 5}
              w={3.5}
              h={3}
            />
          ))
        )}
        {/* Antenna */}
        <line x1="21" y1="65" x2="21" y2="55" stroke="#0A2463" strokeWidth="1.5" />
      </g>
    );
  }

  if (kind === "howrah-bridge") {
    // Cantilever bridge silhouette (Kolkata)
    return wrap(
      <g>
        {/* Towers (two pylons) */}
        <rect x="5" y="80" width="6" height="55" fill="#0A2463" />
        <rect x="55" y="80" width="6" height="55" fill="#0A2463" />
        {/* Crossbar near top */}
        <rect x="3" y="78" width="58" height="3" fill="#0A2463" />
        {/* Diagonals on left tower */}
        <line x1="8" y1="80" x2="8" y2="135" stroke="#0A2463" strokeWidth="1" />
        <line x1="5" y1="90" x2="11" y2="100" stroke="#0A2463" strokeWidth="0.7" />
        <line x1="11" y1="90" x2="5" y2="100" stroke="#0A2463" strokeWidth="0.7" />
        {/* Diagonals on right tower */}
        <line x1="55" y1="90" x2="61" y2="100" stroke="#0A2463" strokeWidth="0.7" />
        <line x1="61" y1="90" x2="55" y2="100" stroke="#0A2463" strokeWidth="0.7" />
        {/* Bridge deck */}
        <rect x="0" y="118" width="66" height="3" fill="#0A2463" />
        {/* Suspension lines */}
        <line x1="11" y1="80" x2="55" y2="80" stroke="#0A2463" strokeWidth="1" />
        <line x1="15" y1="80" x2="15" y2="118" stroke="#0A2463" strokeWidth="0.5" />
        <line x1="25" y1="80" x2="25" y2="118" stroke="#0A2463" strokeWidth="0.5" />
        <line x1="35" y1="80" x2="35" y2="118" stroke="#0A2463" strokeWidth="0.5" />
        <line x1="45" y1="80" x2="45" y2="118" stroke="#0A2463" strokeWidth="0.5" />
      </g>
    );
  }

  // Generic monument — pillared structure with dome
  return wrap(
    <g>
      <rect x="0" y="125" width="50" height="10" fill="#0A2463" />
      <rect x="5" y="90" width="6" height="35" fill="#0A2463" />
      <rect x="20" y="90" width="6" height="35" fill="#0A2463" />
      <rect x="35" y="90" width="6" height="35" fill="#0A2463" />
      <rect x="0" y="85" width="50" height="6" fill="#0A2463" />
      <ellipse cx="25" cy="85" rx="14" ry="8" fill="#0A2463" />
      <line x1="25" y1="77" x2="25" y2="70" stroke="#0A2463" strokeWidth="1.5" />
    </g>
  );
}
