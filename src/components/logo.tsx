/**
 * RightOffer brand mark.
 *
 * - Car silhouette + wordmark layout, modeled on the founder's reference image
 * - Heart-shaped "o" between "right" and "ffer" — the visual hook
 * - Brand colours pulled from the design system:
 *     Deep blue  #0A2463  — car silhouette, "right", ".in"
 *     Orange     #FF6B35  — heart, "ffer"
 *
 * Renders cleanly at any size because the wordmark uses live Inter typography
 * (already loaded in the app shell) and the car silhouette is a pure SVG path.
 */

import clsx from "clsx";

const DEEP = "#0A2463";
const ORANGE = "#FF6B35";

interface Props {
  className?: string;
  /** Hide the car silhouette and show only the wordmark. */
  wordmarkOnly?: boolean;
  /** Hide the .in TLD (useful in cramped headers). */
  hideTld?: boolean;
}

export function RightOfferLogo({
  className,
  wordmarkOnly = false,
  hideTld = false,
}: Props) {
  return (
    <div className={clsx("inline-flex flex-col items-center", className)}>
      {!wordmarkOnly && <CarSilhouette />}
      <Wordmark hideTld={hideTld} />
    </div>
  );
}

function CarSilhouette() {
  return (
    <svg
      viewBox="0 0 320 90"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto block"
      style={{ maxWidth: "90%" }}
      aria-hidden
    >
      {/* Sleek coupe profile — sloping roofline, long hood, raked rear.
       *  Drawn as a single fill path so the silhouette stays clean at any size. */}
      <path
        d="
          M 15 78
          Q 22 55, 60 50
          L 80 50
          Q 90 26, 130 22
          L 180 22
          Q 220 24, 250 50
          L 290 56
          Q 305 60, 308 72
          L 308 78
          L 295 78
          A 14 14 0 0 0 268 78
          L 90 78
          A 14 14 0 0 0 63 78
          Z
        "
        fill={DEEP}
      />
      {/* Window cutout — gives the silhouette air and reads as a cabin */}
      <path
        d="
          M 100 48
          Q 108 32, 130 30
          L 180 30
          Q 198 32, 215 48
          Z
        "
        fill="#FFFFFF"
      />
      {/* Subtle accent line under the body — premium feel */}
      <path
        d="M 70 64 Q 160 60, 285 64"
        stroke={DEEP}
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      {/* Wheel hubs — circular punchouts inside the wheel arches */}
      <circle cx="77" cy="78" r="6" fill="#FFFFFF" />
      <circle cx="282" cy="78" r="6" fill="#FFFFFF" />
      <circle cx="77" cy="78" r="3" fill={DEEP} />
      <circle cx="282" cy="78" r="3" fill={DEEP} />
    </svg>
  );
}

function Wordmark({ hideTld }: { hideTld: boolean }) {
  return (
    <div
      className="inline-flex items-center font-extrabold tracking-tight leading-none"
      style={{
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        fontSize: "1em",
      }}
    >
      <span style={{ color: DEEP }}>right</span>
      <HeartO />
      <span style={{ color: ORANGE }}>ffer</span>
      {!hideTld && (
        <span style={{ color: DEEP, fontWeight: 700 }}>
          <span style={{ fontSize: "0.85em" }}>.</span>
          <span style={{ fontSize: "0.6em", letterSpacing: "-0.02em" }}>in</span>
        </span>
      )}
    </div>
  );
}

/**
 * Heart that visually replaces the "o" in "offer". Sized to roughly match the
 * x-height of the surrounding letters; vertical alignment tuned so it sits
 * on the baseline like a real letter.
 */
function HeartO() {
  return (
    <svg
      viewBox="0 0 32 28"
      xmlns="http://www.w3.org/2000/svg"
      className="block"
      style={{
        width: "0.62em",
        height: "0.62em",
        margin: "0 0.03em",
        transform: "translateY(0.05em)",
      }}
      aria-hidden
    >
      <path
        d="M 16 27
           C 16 27, 2 18, 2 9.5
           A 7 7 0 0 1 16 6
           A 7 7 0 0 1 30 9.5
           C 30 18, 16 27, 16 27 Z"
        fill={ORANGE}
      />
    </svg>
  );
}
