/**
 * Abstract geometric brand marks for the 3 invented insurers.
 * Each is a small SVG glyph that pairs with the insurer name in the bid feed
 * and elsewhere. Small enough to inline in a sentence (~20-24px).
 */

interface LogoProps {
  size?: number;
  className?: string;
}

export function BharatSureLogo({ size = 20, className }: LogoProps) {
  // Shield + check — "all-secure" / India's neighbourhood insurer
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bs-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A2463" />
          <stop offset="100%" stopColor="#247BA0" />
        </linearGradient>
      </defs>
      <path
        d="M 12,2 L 4,5 L 4,11 Q 4,18 12,22 Q 20,18 20,11 L 20,5 Z"
        fill="url(#bs-grad)"
      />
      <path
        d="M 8,12 L 11,15 L 16,9"
        stroke="#fff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function VahanaLogo({ size = 20, className }: LogoProps) {
  // Forward chevron — tech-forward, modern
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="va-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#247BA0" />
          <stop offset="100%" stopColor="#00B4D8" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        fill="url(#va-grad)"
      />
      <path
        d="M 6,8 L 12,14 L 18,8 M 6,14 L 12,20 L 18,14"
        stroke="#fff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SurakshaLogo({ size = 20, className }: LogoProps) {
  // Diamond/lotus — traditional protection, balanced
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="su-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6C3FA0" />
          <stop offset="100%" stopColor="#FF6B35" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        fill="url(#su-grad)"
      />
      {/* 4-petal lotus / abstract star */}
      <path
        d="M 12,5 L 14,11 L 19,12 L 14,13 L 12,19 L 10,13 L 5,12 L 10,11 Z"
        fill="#fff"
      />
    </svg>
  );
}

/**
 * Logo by insurer name — used in the live bid feed.
 */
export function InsurerLogo({
  insurerName,
  size = 20,
  className,
}: {
  insurerName: string;
  size?: number;
  className?: string;
}) {
  if (insurerName.toLowerCase().includes("bharatsure")) {
    return <BharatSureLogo size={size} className={className} />;
  }
  if (insurerName.toLowerCase().includes("vahana")) {
    return <VahanaLogo size={size} className={className} />;
  }
  if (insurerName.toLowerCase().includes("suraksha")) {
    return <SurakshaLogo size={size} className={className} />;
  }
  // Generic fallback — neutral square
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 5,
        background: "linear-gradient(135deg, #247BA0, #0A2463)",
      }}
    />
  );
}
