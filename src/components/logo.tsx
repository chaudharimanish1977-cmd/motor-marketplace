/**
 * RightOffer brand mark.
 *
 * Matches the founder-approved reference design:
 *   - Sleek sports-coupe silhouette in brand deep blue
 *   - Italic wordmark "right ❤ ffer .in"
 *     · "right" + ".in" in deep blue
 *     · heart-shaped "o" + "ffer" in brand orange
 *
 * Brand colours locked:
 *   Deep blue  #0A2463  — car silhouette, "right", ".in"
 *   Orange     #FF6B35  — heart, "ffer"
 *
 * Live Inter Italic typography for the wordmark; the car is a pure SVG path.
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
  /** Render light variant for dark backgrounds: car silhouette + "right" + ".in" become white. */
  onDark?: boolean;
}

export function RightOfferLogo({
  className,
  wordmarkOnly = false,
  hideTld = false,
  onDark = false,
}: Props) {
  return (
    <div className={clsx("inline-flex flex-col items-center", className)}>
      {!wordmarkOnly && <CarSilhouette onDark={onDark} />}
      <Wordmark hideTld={hideTld} onDark={onDark} />
    </div>
  );
}

function CarSilhouette({ onDark }: { onDark: boolean }) {
  const bodyColor = onDark ? "#FFFFFF" : DEEP;
  const cutoutColor = onDark ? "#0A2463" : "#FFFFFF";
  return (
    <svg
      viewBox="0 0 400 100"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto block"
      style={{ maxWidth: "92%" }}
      aria-hidden
    >
      {/* Sleek sports-coupe body — long, low-slung, sharp lines. */}
      <path
        d="M 22 82
           Q 28 64, 58 60
           L 90 56
           Q 110 36, 165 30
           L 240 30
           Q 300 32, 340 58
           L 376 64
           Q 388 70, 388 82
           L 354 82
           A 14 14 0 0 0 312 82
           L 88 82
           A 14 14 0 0 0 46 82
           Z"
        fill={bodyColor}
      />
      {/* Cabin / greenhouse cutout — gives the silhouette its modern coupe profile */}
      <path
        d="M 108 56
           Q 120 40, 168 34
           L 235 34
           Q 285 36, 322 56
           Z"
        fill={cutoutColor}
      />
      {/* Subtle accent line under the body for premium feel */}
      <path
        d="M 64 70 Q 200 64, 332 70"
        stroke={bodyColor}
        strokeWidth="1.2"
        fill="none"
        opacity="0.35"
      />
      {/* Wheel hubs */}
      <circle cx="67" cy="82" r="9" fill={cutoutColor} />
      <circle cx="333" cy="82" r="9" fill={cutoutColor} />
      <circle cx="67" cy="82" r="4" fill={bodyColor} />
      <circle cx="333" cy="82" r="4" fill={bodyColor} />
    </svg>
  );
}

function Wordmark({
  hideTld,
  onDark,
}: {
  hideTld: boolean;
  onDark: boolean;
}) {
  const blueText = onDark ? "#FFFFFF" : DEEP;
  return (
    <div
      className="inline-flex items-center font-extrabold italic tracking-tight leading-none"
      style={{
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        fontSize: "1em",
      }}
    >
      <span style={{ color: blueText }}>right</span>
      <HeartO />
      <span style={{ color: ORANGE }}>ffer</span>
      {!hideTld && (
        <span
          style={{ color: blueText, fontWeight: 700 }}
          className="ml-[0.02em]"
        >
          <span style={{ fontSize: "0.85em" }}>.</span>
          <span style={{ fontSize: "0.6em", letterSpacing: "-0.02em" }}>
            in
          </span>
        </span>
      )}
    </div>
  );
}

/**
 * Heart that visually replaces the "o" in "offer". Sized to the x-height
 * of the surrounding italic letters and slightly raised so it reads as a
 * letter on the baseline.
 */
function HeartO() {
  return (
    <svg
      viewBox="0 0 32 28"
      xmlns="http://www.w3.org/2000/svg"
      className="block"
      style={{
        width: "0.68em",
        height: "0.68em",
        margin: "0 0.04em",
        transform: "translateY(0.05em) skewX(-6deg)",
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
