/**
 * Scene-level ink-line sketches.
 *
 * Where sketches.tsx holds the standalone vehicles (Sedan / Hatchback
 * / SUV / Car etc.), this file holds the *scenes* — multi-element
 * compositions that anchor specific product moments in the brand's
 * visual vocabulary:
 *
 *   · SketchUploadCar      — car with paperwork strapped to roof rack
 *                            (the "you're bringing your paperwork" moment)
 *   · SketchPetrolPump     — car refuelling at a pump
 *                            (the renewal / top-up moment)
 *   · SketchTrafficJam     — cars stuck nose-to-tail
 *                            (the "old way" / pain-state visual)
 *   · SketchGarage         — car on a service lift with tools floating
 *                            (alternate parsing-screen scene)
 *   · TrafficLightDot      — inline tri-state severity light
 *                            (GAP / WATCH / OK on finding rows)
 *   · SketchSpeedometer    — vintage half-dial gauge
 *                            (report score 62/100)
 *   · SketchOpenRoad       — car on a road heading to horizon
 *                            (post-verdict thank-you / success state)
 *   · SketchRoadside       — car raised on a jack with spare tyre
 *                            (RSA / Zero-Dep / safety-net add-ons)
 *   · SketchExitSign       — highway exit sign with arrow
 *                            (switch-insurer recommendation)
 *
 * All use the same ink-line drawing conventions as sketches.tsx:
 * round-cap strokes, currentColor by default, optional accent color
 * for highlights. Strokes are 2.2 unless otherwise noted.
 */
"use client";

import type { SketchProps } from "@/components/sketches";

/* ─── Upload car (roof rack with documents) ──────────────────────────────── */
export function SketchUploadCar({
  color = "currentColor",
  accent = "currentColor",
  width = 320,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.78);
  return (
    <svg
      viewBox="0 0 320 250"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
      fill="none"
    >
      {/* Stacked documents on top of the roof rack */}
      <g>
        <rect x="106" y="38" width="100" height="40" rx="2" />
        <line x1="120" y1="50" x2="192" y2="50" strokeWidth={1.3} opacity={0.55} />
        <line x1="120" y1="58" x2="186" y2="58" strokeWidth={1.3} opacity={0.55} />
        <line x1="120" y1="66" x2="192" y2="66" strokeWidth={1.3} opacity={0.55} />
        {/* Folded corner on the top document */}
        <path d="M 198 38 L 198 50 L 206 50 Z" stroke={accent} strokeWidth={1.8} />

        {/* Second document peeking from under */}
        <rect x="116" y="22" width="92" height="20" rx="2" opacity={0.7} />
        <line x1="128" y1="32" x2="190" y2="32" strokeWidth={1.2} opacity={0.4} />
      </g>

      {/* Roof rack rails — two thin horizontal bars over the cabin */}
      <line x1="92" y1="80" x2="222" y2="80" strokeWidth={2.6} />
      {/* Strap tying everything down — diagonal cross over the load */}
      <line
        x1="98"
        y1="80"
        x2="208"
        y2="34"
        strokeDasharray="4 3"
        opacity={0.6}
      />
      <line
        x1="98"
        y1="34"
        x2="208"
        y2="80"
        strokeDasharray="4 3"
        opacity={0.6}
      />

      {/* Sedan body, shifted down */}
      <g transform="translate(0 38)">
        <path d="M28 144 Q40 110, 80 102 L120 96 Q138 92, 168 92 L210 96 Q244 100, 270 116 L298 130 Q308 136, 308 148 L308 162 L18 162 L18 146 Z" />
        <path d="M96 102 Q116 70, 150 68 L196 70 Q220 74, 232 102 Z" />
        <line x1="170" y1="68" x2="170" y2="102" />
        <line x1="132" y1="104" x2="132" y2="158" />
        <line x1="200" y1="104" x2="200" y2="160" />
        <line x1="140" y1="124" x2="160" y2="122" />
        <line x1="206" y1="126" x2="222" y2="124" />
        <circle cx="298" cy="142" r="5" />
        <g>
          <circle cx="84" cy="164" r="20" />
          <circle cx="84" cy="164" r="8" />
          <circle cx="84" cy="164" r="2" fill={color} stroke="none" />
        </g>
        <g>
          <circle cx="244" cy="164" r="20" />
          <circle cx="244" cy="164" r="8" />
          <circle cx="244" cy="164" r="2" fill={color} stroke="none" />
        </g>
      </g>

      {/* Ground line */}
      <line
        x1="6"
        y1="236"
        x2="314"
        y2="236"
        strokeDasharray="4 6"
        opacity={0.5}
      />
    </svg>
  );
}

/* ─── Petrol pump (car refuelling) ───────────────────────────────────────── */
export function SketchPetrolPump({
  color = "currentColor",
  accent = "currentColor",
  width = 380,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.55);
  return (
    <svg
      viewBox="0 0 380 220"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
      fill="none"
    >
      {/* Pump on the left — boxy column with a digital screen */}
      <g>
        {/* Body */}
        <path d="M30 60 L82 60 L82 180 L30 180 Z" />
        {/* Top cap / signage box */}
        <rect x="26" y="40" width="60" height="22" />
        <text
          x="56"
          y="56"
          textAnchor="middle"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize="10"
          fontWeight={700}
          fill={accent}
          stroke="none"
        >
          RO•FUEL
        </text>
        {/* Digital display rectangle */}
        <rect x="38" y="72" width="38" height="20" stroke={accent} />
        <text
          x="57"
          y="88"
          textAnchor="middle"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize="11"
          fontWeight={700}
          fill={accent}
          stroke="none"
        >
          ₹0.00
        </text>
        {/* Buttons row */}
        <g strokeWidth={1.4}>
          <rect x="38" y="100" width="10" height="6" />
          <rect x="52" y="100" width="10" height="6" />
          <rect x="66" y="100" width="10" height="6" />
        </g>
        {/* Hose holster */}
        <rect x="82" y="100" width="14" height="22" />
      </g>

      {/* Hose — wavy line from holster to car's filler door */}
      <path
        d="M 96 112 Q 130 110, 145 125 Q 156 135, 168 132"
        strokeWidth={2.4}
      />
      {/* Nozzle at the end */}
      <rect x="167" y="128" width="10" height="8" />

      {/* Car body — sedan, slightly smaller to share space with the pump */}
      <g transform="translate(110 50)">
        <path d="M28 100 Q40 70, 76 62 L114 56 Q132 52, 160 52 L196 56 Q224 60, 244 76 L264 92 Q272 98, 272 110 L272 122 L20 122 L20 102 Z" />
        <path d="M92 62 Q108 36, 140 34 L186 36 Q210 42, 218 62 Z" />
        <line x1="160" y1="34" x2="160" y2="64" />
        <line x1="124" y1="64" x2="124" y2="118" />
        <line x1="184" y1="64" x2="184" y2="120" />
        <circle cx="262" cy="106" r="4" />
        {/* Filler door — small open hatch where the hose meets */}
        <rect x="58" y="80" width="14" height="14" />
        <line x1="58" y1="80" x2="72" y2="94" strokeWidth={1.3} opacity={0.4} />

        <g>
          <circle cx="72" cy="124" r="16" />
          <circle cx="72" cy="124" r="6" />
          <circle cx="72" cy="124" r="2" fill={color} stroke="none" />
        </g>
        <g>
          <circle cx="208" cy="124" r="16" />
          <circle cx="208" cy="124" r="6" />
          <circle cx="208" cy="124" r="2" fill={color} stroke="none" />
        </g>
      </g>

      {/* Ground */}
      <line
        x1="10"
        y1="200"
        x2="370"
        y2="200"
        strokeDasharray="4 6"
        opacity={0.5}
      />
    </svg>
  );
}

/* ─── Traffic jam (cars stuck nose-to-tail) ──────────────────────────────── */
export function SketchTrafficJam({
  color = "currentColor",
  width = 400,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.42);
  // Small simplified car silhouette used three times, varying mood marks
  const Car = ({
    x,
    mood,
  }: {
    x: number;
    mood: "angry" | "tired" | "patient";
  }) => (
    <g transform={`translate(${x} 0)`}>
      {/* Body */}
      <path d="M10 60 Q18 36, 50 32 L92 32 Q110 38, 118 56 L130 64 Q138 70, 138 80 L138 92 L4 92 L4 64 Z" />
      <path d="M28 32 Q40 12, 70 12 L96 12 Q108 20, 118 32 Z" />
      {/* Wheels */}
      <g>
        <circle cx="34" cy="92" r="10" />
        <circle cx="34" cy="92" r="3" fill={color} stroke="none" />
      </g>
      <g>
        <circle cx="110" cy="92" r="10" />
        <circle cx="110" cy="92" r="3" fill={color} stroke="none" />
      </g>
      {/* Mood indicators above each car */}
      {mood === "angry" && (
        <g strokeWidth={1.5} opacity={0.7}>
          <line x1="40" y1="4" x2="44" y2="-2" />
          <line x1="60" y1="2" x2="62" y2="-4" />
          <line x1="80" y1="4" x2="78" y2="-2" />
        </g>
      )}
      {mood === "tired" && (
        <text
          x="70"
          y="-2"
          textAnchor="middle"
          fontFamily="var(--font-newsreader), serif"
          fontStyle="italic"
          fontSize="14"
          fill={color}
          stroke="none"
          opacity={0.7}
        >
          z
        </text>
      )}
      {mood === "patient" && (
        <g strokeWidth={1.5} opacity={0.55}>
          <circle cx="70" cy="-2" r="1.6" fill={color} stroke="none" />
        </g>
      )}
    </g>
  );
  return (
    <svg
      viewBox="0 0 400 168"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2}
      fill="none"
    >
      {/* Three cars stacked nose-to-tail with very little gap */}
      <Car x={20} mood="angry" />
      <Car x={150} mood="tired" />
      <Car x={262} mood="patient" />
      {/* Ground */}
      <line
        x1="0"
        y1="116"
        x2="400"
        y2="116"
        strokeDasharray="4 6"
        opacity={0.5}
      />
    </svg>
  );
}

/* ─── Garage (car on a service lift) ─────────────────────────────────────── */
export function SketchGarage({
  color = "currentColor",
  accent = "currentColor",
  width = 360,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.6);
  return (
    <svg
      viewBox="0 0 360 220"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
      fill="none"
    >
      {/* Floating tools (wrench, screwdriver) around the car */}
      <g stroke={accent} strokeWidth={1.8} opacity={0.7}>
        {/* Wrench — top-left */}
        <g transform="translate(38 30) rotate(-30)">
          <line x1="0" y1="0" x2="28" y2="0" strokeWidth={3} />
          <circle cx="-2" cy="0" r="5" />
        </g>
        {/* Screwdriver — top-right */}
        <g transform="translate(290 26) rotate(20)">
          <line x1="0" y1="0" x2="22" y2="0" strokeWidth={2.4} />
          <rect x="22" y="-3" width="10" height="6" />
        </g>
        {/* Sparkle */}
        <g transform="translate(180 28)">
          <line x1="0" y1="-4" x2="0" y2="4" />
          <line x1="-4" y1="0" x2="4" y2="0" />
        </g>
      </g>

      {/* Lift platform — raised above the floor */}
      <line x1="60" y1="146" x2="300" y2="146" strokeWidth={3} />
      {/* Lift columns */}
      <rect x="78" y="146" width="8" height="54" />
      <rect x="274" y="146" width="8" height="54" />

      {/* Sedan body, sitting on the lift */}
      <g transform="translate(20 -16)">
        <path d="M28 144 Q40 110, 80 102 L120 96 Q138 92, 168 92 L210 96 Q244 100, 270 116 L298 130 Q308 136, 308 148 L308 162 L18 162 L18 146 Z" />
        <path d="M96 102 Q116 70, 150 68 L196 70 Q220 74, 232 102 Z" />
        <line x1="170" y1="68" x2="170" y2="102" />
        <line x1="132" y1="104" x2="132" y2="158" />
        <line x1="200" y1="104" x2="200" y2="160" />
        <circle cx="298" cy="142" r="5" />
        <g>
          <circle cx="84" cy="164" r="20" />
          <circle cx="84" cy="164" r="8" />
          <circle cx="84" cy="164" r="2" fill={color} stroke="none" />
        </g>
        <g>
          <circle cx="244" cy="164" r="20" />
          <circle cx="244" cy="164" r="8" />
          <circle cx="244" cy="164" r="2" fill={color} stroke="none" />
        </g>
      </g>

      {/* Garage floor — dashed */}
      <line
        x1="0"
        y1="206"
        x2="360"
        y2="206"
        strokeDasharray="4 6"
        opacity={0.5}
      />
    </svg>
  );
}

/* ─── Traffic light (inline tri-state severity) ──────────────────────────── */
export function TrafficLightDot({
  severity,
  width = 14,
  className,
}: {
  severity: "high" | "mid" | "ok";
  width?: number;
  className?: string;
}) {
  // Render a tiny vertical traffic-light housing with three lamps.
  // The active lamp is filled; the others are hollow rings.
  const h = Math.round(width * 2.3);
  const cx = width / 2;
  return (
    <svg
      viewBox="0 0 14 32"
      width={width}
      height={h}
      className={className}
      role="img"
      aria-label={`Severity: ${severity}`}
    >
      {/* Housing */}
      <rect
        x="1"
        y="1"
        width="12"
        height="30"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        opacity={0.6}
      />
      {/* Red lamp (top) */}
      <circle
        cx={cx}
        cy="7"
        r="3"
        fill={severity === "high" ? "#ff5a30" : "none"}
        stroke="#ff5a30"
        strokeWidth={1.3}
        opacity={severity === "high" ? 1 : 0.35}
      />
      {/* Yellow lamp (middle) */}
      <circle
        cx={cx}
        cy="16"
        r="3"
        fill={severity === "mid" ? "#d4a017" : "none"}
        stroke="#d4a017"
        strokeWidth={1.3}
        opacity={severity === "mid" ? 1 : 0.35}
      />
      {/* Green lamp (bottom) */}
      <circle
        cx={cx}
        cy="25"
        r="3"
        fill={severity === "ok" ? "#3aa758" : "none"}
        stroke="#3aa758"
        strokeWidth={1.3}
        opacity={severity === "ok" ? 1 : 0.35}
      />
    </svg>
  );
}

/* ─── Speedometer (vintage gauge for the report score) ───────────────────── */
export function SketchSpeedometer({
  color = "currentColor",
  accent = "currentColor",
  width = 220,
  className,
  score = 62,
}: SketchProps & { score?: number }) {
  const h = Math.round(width * 0.7);
  // Map score 0-100 to angle -135° (left) to +135° (right)
  const angle = -135 + (score / 100) * 270;
  const rad = (angle * Math.PI) / 180;
  const cx = 110;
  const cy = 130;
  const needleLen = 78;
  const needleX = cx + Math.cos(rad - Math.PI / 2) * needleLen;
  const needleY = cy + Math.sin(rad - Math.PI / 2) * needleLen;
  return (
    <svg
      viewBox="0 0 220 160"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
      fill="none"
    >
      {/* Outer arc — three-quarter circle */}
      <path d="M 30 130 A 80 80 0 1 1 190 130" />
      {/* Tick marks at 0/25/50/75/100 */}
      {[0, 25, 50, 75, 100].map((v) => {
        const a = -135 + (v / 100) * 270;
        const rad2 = (a * Math.PI) / 180;
        const x1 = cx + Math.cos(rad2 - Math.PI / 2) * 70;
        const y1 = cy + Math.sin(rad2 - Math.PI / 2) * 70;
        const x2 = cx + Math.cos(rad2 - Math.PI / 2) * 80;
        const y2 = cy + Math.sin(rad2 - Math.PI / 2) * 80;
        return (
          <line
            key={v}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            strokeWidth={1.8}
          />
        );
      })}
      {/* Number labels */}
      <text
        x="32"
        y="148"
        fontFamily="var(--font-jetbrains-mono), monospace"
        fontSize="9"
        fontWeight={700}
        fill={color}
        stroke="none"
      >
        0
      </text>
      <text
        x="178"
        y="148"
        fontFamily="var(--font-jetbrains-mono), monospace"
        fontSize="9"
        fontWeight={700}
        fill={color}
        stroke="none"
      >
        100
      </text>
      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        strokeWidth={3}
        stroke={accent}
        strokeLinecap="round"
      />
      {/* Hub */}
      <circle cx={cx} cy={cy} r="5" fill={accent} stroke="none" />
      {/* Score text below */}
      <text
        x={cx}
        y="150"
        textAnchor="middle"
        fontFamily="var(--font-newsreader), serif"
        fontSize="20"
        fontWeight={600}
        fill={color}
        stroke="none"
      >
        {score}
        <tspan
          fontSize="11"
          fontStyle="italic"
          opacity="0.5"
        >
          /100
        </tspan>
      </text>
    </svg>
  );
}

/* ─── Open road (success / thank-you horizon) ────────────────────────────── */
export function SketchOpenRoad({
  color = "currentColor",
  accent = "currentColor",
  width = 400,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.55);
  return (
    <svg
      viewBox="0 0 400 220"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
      fill="none"
    >
      {/* Sun on the horizon */}
      <circle cx="200" cy="76" r="22" stroke={accent} strokeWidth={2.4} />
      {/* Sun rays */}
      <g stroke={accent} strokeWidth={1.5} opacity={0.6}>
        <line x1="200" y1="42" x2="200" y2="32" />
        <line x1="176" y1="58" x2="170" y2="52" />
        <line x1="224" y1="58" x2="230" y2="52" />
        <line x1="166" y1="76" x2="156" y2="76" />
        <line x1="234" y1="76" x2="244" y2="76" />
      </g>
      {/* Horizon line */}
      <line x1="20" y1="100" x2="380" y2="100" strokeWidth={1.4} opacity={0.45} />
      {/* Road — perspective triangle from horizon to bottom */}
      <line x1="200" y1="100" x2="40" y2="200" />
      <line x1="200" y1="100" x2="360" y2="200" />
      {/* Dashed centre line on the road */}
      <g strokeWidth={2.4} opacity={0.7}>
        <line x1="200" y1="100" x2="198" y2="116" />
        <line x1="196" y1="130" x2="192" y2="148" />
        <line x1="188" y1="162" x2="182" y2="182" />
      </g>
      {/* Sedan in the middle distance, smaller */}
      <g transform="translate(120 130) scale(0.55)">
        <path d="M28 100 Q40 70, 76 62 L114 56 Q132 52, 160 52 L196 56 Q224 60, 244 76 L264 92 Q272 98, 272 110 L272 122 L20 122 L20 102 Z" />
        <path d="M92 62 Q108 36, 140 34 L186 36 Q210 42, 218 62 Z" />
        <circle cx="72" cy="124" r="16" />
        <circle cx="208" cy="124" r="16" />
        <circle cx="72" cy="124" r="3" fill={color} stroke="none" />
        <circle cx="208" cy="124" r="3" fill={color} stroke="none" />
      </g>
    </svg>
  );
}

/* ─── Roadside (car raised on jack, spare tyre next to it) ───────────────── */
export function SketchRoadside({
  color = "currentColor",
  accent = "currentColor",
  width = 380,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.55);
  return (
    <svg
      viewBox="0 0 380 210"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
      fill="none"
    >
      {/* Sedan body — left wheel raised (slight tilt to suggest jack) */}
      <g transform="translate(20 12)">
        {/* Body — same as SketchSedan but tilted up slightly on the front */}
        <path d="M28 144 Q40 110, 80 102 L120 96 Q138 92, 168 92 L210 96 Q244 100, 270 116 L298 130 Q308 136, 308 148 L308 162 L18 162 L18 146 Z" />
        <path d="M96 102 Q116 70, 150 68 L196 70 Q220 74, 232 102 Z" />
        <line x1="170" y1="68" x2="170" y2="102" />
        <line x1="132" y1="104" x2="132" y2="158" />
        <line x1="200" y1="104" x2="200" y2="160" />
        <circle cx="298" cy="142" r="5" />
        {/* Front wheel raised (missing — the jack lifts that corner). Just an
         *  empty wheel arch with the hub visible. */}
        <g stroke={color} strokeWidth={1.8} opacity={0.4}>
          <path d="M 60 160 Q 84 142, 108 160" />
        </g>
        {/* Rear wheel — present */}
        <g>
          <circle cx="244" cy="164" r="20" />
          <circle cx="244" cy="164" r="8" />
          <circle cx="244" cy="164" r="2" fill={color} stroke="none" />
        </g>
      </g>

      {/* Jack — small triangle under the front of the car */}
      <g stroke={accent} strokeWidth={2.2}>
        <path d="M 78 174 L 104 174 L 91 162 Z" />
        <line x1="91" y1="174" x2="91" y2="184" />
      </g>

      {/* Spare tyre — leaning on the side, on the ground to the right */}
      <g transform="translate(330 156)">
        <circle r="20" />
        <circle r="8" />
        <circle r="2" fill={color} stroke="none" />
        {/* Spokes for visual detail */}
        <line x1="-15" y1="0" x2="-9" y2="0" strokeWidth={1.5} opacity={0.7} />
        <line x1="15" y1="0" x2="9" y2="0" strokeWidth={1.5} opacity={0.7} />
        <line x1="0" y1="-15" x2="0" y2="-9" strokeWidth={1.5} opacity={0.7} />
        <line x1="0" y1="15" x2="0" y2="9" strokeWidth={1.5} opacity={0.7} />
      </g>

      {/* Ground */}
      <line
        x1="6"
        y1="196"
        x2="374"
        y2="196"
        strokeDasharray="4 6"
        opacity={0.5}
      />
    </svg>
  );
}

/* ─── Exit sign (switch-insurer recommendation marker) ───────────────────── */
export function SketchExitSign({
  color = "currentColor",
  accent = "currentColor",
  width = 240,
  className,
}: SketchProps) {
  const h = Math.round(width * 0.72);
  return (
    <svg
      viewBox="0 0 240 170"
      width={width}
      height={h}
      className={`ro-ink ${className ?? ""}`}
      stroke={color}
      strokeWidth={2.2}
      fill="none"
    >
      {/* Main rectangular sign */}
      <rect x="14" y="14" width="212" height="80" rx="3" stroke={accent} />
      {/* "EXIT" text */}
      <text
        x="60"
        y="64"
        fontFamily="var(--font-newsreader), serif"
        fontSize="34"
        fontWeight={600}
        fontStyle="italic"
        fill={accent}
        stroke="none"
      >
        EXIT
      </text>
      {/* Arrow on the right */}
      <g stroke={accent} strokeWidth={3} strokeLinecap="round">
        <line x1="148" y1="54" x2="208" y2="54" />
        <line x1="190" y1="40" x2="208" y2="54" />
        <line x1="190" y1="68" x2="208" y2="54" />
      </g>
      {/* Sub-sign (smaller, below) */}
      <rect x="40" y="100" width="160" height="22" stroke={color} opacity={0.7} />
      <text
        x="120"
        y="115"
        textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), monospace"
        fontSize="9"
        fontWeight={700}
        fill={color}
        stroke="none"
      >
        BETTER-PRICED POLICY · 0.2 KM
      </text>
      {/* Posts holding up the sign */}
      <line x1="60" y1="122" x2="60" y2="164" strokeWidth={2.6} />
      <line x1="180" y1="122" x2="180" y2="164" strokeWidth={2.6} />
      {/* Ground */}
      <line
        x1="20"
        y1="164"
        x2="220"
        y2="164"
        strokeDasharray="4 6"
        opacity={0.5}
      />
    </svg>
  );
}
