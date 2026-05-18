/**
 * RightOffer wordmark — text-based mixed-medium signature.
 *
 * The brand mark is:
 *   · italic serif lowercase "r"   (plum accent · A1)
 *   · small-caps "RightOffer"      (body fg · charcoal)
 *   · uppercase mono "CAR" pill    (sage bg · A2, body bg · fg)
 *
 * No SVG logo, no stamp-ring. The wordmark IS the typography.
 *
 * The pill is optional — used in the marketing brand row (home, /upload),
 * dropped in deeper app surfaces where the section name takes its place.
 */
import Link from "next/link";

interface ReadingWordmarkProps {
  /** Show the "CAR" sage pill alongside the wordmark. Default: true. */
  showPill?: boolean;
  /** Wrap the wordmark in a Link to "/". Default: true. */
  asLink?: boolean;
  /** Visual scale — "sm" for headers/footers, "md" for hero areas. */
  size?: "sm" | "md";
  className?: string;
}

export function ReadingWordmark({
  showPill = true,
  asLink = true,
  size = "sm",
  className,
}: ReadingWordmarkProps) {
  const rSize = size === "md" ? "text-3xl" : "text-2xl";
  const wordSize = size === "md" ? "text-xl" : "text-lg";
  const pillSize = size === "md" ? "text-xs" : "text-[10px]";

  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      {/* italic serif "r" in plum */}
      <span
        className={`font-serif italic font-semibold ${rSize} text-brand-plum leading-none`}
        aria-hidden
      >
        r
      </span>
      {/* small-caps RightOffer */}
      <span
        className={`font-serif font-medium ${wordSize} text-brand-charcoal leading-none tracking-tight`}
        style={{ fontVariant: "small-caps" }}
      >
        RightOffer
      </span>
      {showPill && (
        <span
          className={`ml-1 px-2 py-0.5 font-mono ${pillSize} font-bold tracking-[0.12em] bg-brand-sage text-brand-offwhite rounded-sm`}
        >
          CAR
        </span>
      )}
      {/* Screen-reader full name */}
      <span className="sr-only">RightOffer Car</span>
    </span>
  );

  if (!asLink) return content;
  return (
    <Link href="/" className="inline-flex hover:opacity-80 transition-opacity">
      {content}
    </Link>
  );
}
