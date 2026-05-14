/**
 * RightOffer brand mark — inline-SVG implementation of the founder-supplied
 * "RightOffer Brand SVG Pack" PDF. All eight variants are reproduced
 * verbatim (paths, coordinates, fonts, fills) so the on-site rendering
 * matches the brand pack pixel-for-pixel.
 *
 * Brand colours (locked):
 *   Deep Blue  #0A2463
 *   Orange     #FF6B35
 *
 * Typography in the brand pack is Arial / Helvetica italic 700 — kept
 * faithfully here. We don't substitute Inter because the spacing in the
 * pack was tuned to Arial's letter widths; swapping the font would break
 * the heart placement.
 */

import clsx from "clsx";

export type LogoVariant =
  | "full-light"
  | "full-dark"
  | "nav-24"
  | "default-40"
  | "hero-80"
  | "wordmark"
  | "wordmark-plain"
  | "header";

interface Props {
  variant?: LogoVariant;
  className?: string;
}

/**
 * Default export: variant-selecting wrapper. Pass `variant` to pick the
 * exact pack rendition you want. Default is the 640×180 full-light logo.
 */
export function RightOfferLogo({
  variant = "full-light",
  className,
}: Props = {}) {
  switch (variant) {
    case "full-dark":
      return <FullDark className={className} />;
    case "nav-24":
      return <Nav24 className={className} />;
    case "default-40":
      return <Default40 className={className} />;
    case "hero-80":
      return <Hero80 className={className} />;
    case "wordmark":
      return <Wordmark className={className} />;
    case "wordmark-plain":
      return <WordmarkPlain className={className} />;
    case "header":
      return <HeaderPreview className={className} />;
    case "full-light":
    default:
      return <FullLight className={className} />;
  }
}

// ============================================================================
// 1. Full logo · light background (640×180)
// ============================================================================

function FullLight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("block w-full h-auto", className)}
    >
      <rect width="640" height="180" fill="white" />
      <path
        d="M40 95C85 50 170 45 240 48C320 10 430 10 545 55C565 63 585 72 600 78"
        stroke="#0A2463"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <text
        x="40"
        y="138"
        fontSize="88"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontStyle="italic"
        fill="#0A2463"
      >
        right
      </text>
      <path
        d="M308 116 C308 96 334 92 346 108 C358 92 384 96 384 116 C384 136 346 160 346 160 C346 160 308 136 308 116Z"
        fill="#FF6B35"
      />
      <text
        x="390"
        y="138"
        fontSize="88"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontStyle="italic"
        fill="#FF6B35"
      >
        ffer
      </text>
      <text
        x="555"
        y="138"
        fontSize="44"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fill="#0A2463"
      >
        .in
      </text>
    </svg>
  );
}

// ============================================================================
// 2. Full logo · deep-blue background (700×240)
// ============================================================================

function FullDark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 700 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("block w-full h-auto", className)}
    >
      <rect width="700" height="240" rx="24" fill="#0A2463" />
      <rect x="24" y="24" width="652" height="192" rx="18" fill="white" />
      <path
        d="M70 120C115 75 200 70 270 73C350 35 460 35 575 80C595 88 615 97 630 103"
        stroke="#0A2463"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <text
        x="70"
        y="165"
        fontSize="88"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontStyle="italic"
        fill="#0A2463"
      >
        right
      </text>
      <path
        d="M338 143 C338 123 364 119 376 135 C388 119 414 123 414 143 C414 163 376 187 376 187 C376 187 338 163 338 143Z"
        fill="#FF6B35"
      />
      <text
        x="420"
        y="165"
        fontSize="88"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontStyle="italic"
        fill="#FF6B35"
      >
        ffer
      </text>
      <text
        x="585"
        y="165"
        fontSize="44"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fill="#0A2463"
      >
        .in
      </text>
    </svg>
  );
}

// ============================================================================
// 3a. 24px navigation version (180×24)
// ============================================================================

function Nav24({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 24"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("block w-full h-auto", className)}
    >
      <text
        x="0"
        y="18"
        fontSize="18"
        fontFamily="Arial, Helvetica, sans-serif"
        fontStyle="italic"
        fontWeight="700"
        fill="#0A2463"
      >
        right
      </text>
      <path
        d="M72 11C72 8 76 7 78 10C80 7 84 8 84 11C84 14 78 18 78 18C78 18 72 14 72 11Z"
        fill="#FF6B35"
      />
      <text
        x="88"
        y="18"
        fontSize="18"
        fontFamily="Arial, Helvetica, sans-serif"
        fontStyle="italic"
        fontWeight="700"
        fill="#FF6B35"
      >
        ffer
      </text>
      <text
        x="122"
        y="18"
        fontSize="10"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fill="#0A2463"
      >
        .in
      </text>
    </svg>
  );
}

// ============================================================================
// 3b. 40px default version (300×40)
// ============================================================================

function Default40({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 40"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("block w-full h-auto", className)}
    >
      <path
        d="M10 18C40 2 90 2 130 8C170 -5 225 -3 280 16"
        stroke="#0A2463"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <text
        x="10"
        y="34"
        fontSize="32"
        fontFamily="Arial, Helvetica, sans-serif"
        fontStyle="italic"
        fontWeight="700"
        fill="#0A2463"
      >
        right
      </text>
      <path
        d="M132 22C132 17 138 16 141 20C144 16 150 17 150 22C150 27 141 32 141 32C141 32 132 27 132 22Z"
        fill="#FF6B35"
      />
      <text
        x="155"
        y="34"
        fontSize="32"
        fontFamily="Arial, Helvetica, sans-serif"
        fontStyle="italic"
        fontWeight="700"
        fill="#FF6B35"
      >
        ffer
      </text>
      <text
        x="215"
        y="34"
        fontSize="16"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fill="#0A2463"
      >
        .in
      </text>
    </svg>
  );
}

// ============================================================================
// 3c. 80px hero version (520×80)
// ============================================================================

function Hero80({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 80"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("block w-full h-auto", className)}
    >
      <path
        d="M20 38C75 5 160 5 225 15C295 -10 390 -5 485 32"
        stroke="#0A2463"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <text
        x="20"
        y="68"
        fontSize="62"
        fontFamily="Arial, Helvetica, sans-serif"
        fontStyle="italic"
        fontWeight="700"
        fill="#0A2463"
      >
        right
      </text>
      <path
        d="M255 44C255 34 267 32 273 40C279 32 291 34 291 44C291 54 273 66 273 66C273 66 255 54 255 44Z"
        fill="#FF6B35"
      />
      <text
        x="300"
        y="68"
        fontSize="62"
        fontFamily="Arial, Helvetica, sans-serif"
        fontStyle="italic"
        fontWeight="700"
        fill="#FF6B35"
      >
        ffer
      </text>
      <text
        x="420"
        y="68"
        fontSize="28"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fill="#0A2463"
      >
        .in
      </text>
    </svg>
  );
}

// ============================================================================
// 4. Wordmark only · with .in (520×120)
// ============================================================================

function Wordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 120"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("block w-full h-auto", className)}
    >
      <rect width="520" height="120" fill="white" />
      <text
        x="20"
        y="82"
        fontSize="72"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontStyle="italic"
        fill="#0A2463"
      >
        right
      </text>
      <path
        d="M245 60 C245 44 265 42 274 55 C283 42 303 44 303 60 C303 76 274 95 274 95 C274 95 245 76 245 60Z"
        fill="#FF6B35"
      />
      <text
        x="315"
        y="82"
        fontSize="72"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontStyle="italic"
        fill="#FF6B35"
      >
        ffer
      </text>
      <text
        x="448"
        y="82"
        fontSize="36"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fill="#0A2463"
      >
        .in
      </text>
    </svg>
  );
}

// ============================================================================
// 5. Wordmark only · without .in (420×120)
// ============================================================================

function WordmarkPlain({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 120"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("block w-full h-auto", className)}
    >
      <rect width="420" height="120" fill="white" />
      <text
        x="20"
        y="82"
        fontSize="72"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontStyle="italic"
        fill="#0A2463"
      >
        right
      </text>
      <path
        d="M245 60 C245 44 265 42 274 55 C283 42 303 44 303 60 C303 76 274 95 274 95 C274 95 245 76 245 60Z"
        fill="#FF6B35"
      />
      <text
        x="315"
        y="82"
        fontSize="72"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontStyle="italic"
        fill="#FF6B35"
      >
        ffer
      </text>
    </svg>
  );
}

// ============================================================================
// 6. Header preview — full sample header with nav + login (1200×110)
// ============================================================================

function HeaderPreview({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 110"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("block w-full h-auto", className)}
    >
      <rect width="1200" height="110" fill="#F5F7FA" />
      <rect
        x="20"
        y="15"
        width="1160"
        height="80"
        rx="16"
        fill="white"
      />
      <path
        d="M45 48C65 35 105 35 135 40C165 28 205 28 245 45"
        stroke="#0A2463"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <text
        x="45"
        y="72"
        fontSize="38"
        fontFamily="Arial, Helvetica, sans-serif"
        fontStyle="italic"
        fontWeight="700"
        fill="#0A2463"
      >
        right
      </text>
      <path
        d="M188 57C188 52 194 50 197 54C200 50 206 52 206 57C206 62 197 68 197 68C197 68 188 62 188 57Z"
        fill="#FF6B35"
      />
      <text
        x="214"
        y="72"
        fontSize="38"
        fontFamily="Arial, Helvetica, sans-serif"
        fontStyle="italic"
        fontWeight="700"
        fill="#FF6B35"
      >
        ffer
      </text>
      <text
        x="286"
        y="72"
        fontSize="18"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fill="#0A2463"
      >
        .in
      </text>
      <text
        x="420"
        y="68"
        fontSize="24"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="#0A2463"
      >
        Buy Cars
      </text>
      <text
        x="560"
        y="68"
        fontSize="24"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="#0A2463"
      >
        Sell Cars
      </text>
      <text
        x="720"
        y="68"
        fontSize="24"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="#0A2463"
      >
        Compare
      </text>
      <text
        x="870"
        y="68"
        fontSize="24"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="#0A2463"
      >
        Deals
      </text>
      <text
        x="980"
        y="68"
        fontSize="24"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="#0A2463"
      >
        Insurance
      </text>
      <rect x="1080" y="38" width="80" height="36" rx="8" fill="#0A2463" />
      <text
        x="1103"
        y="62"
        fontSize="18"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="white"
      >
        Login
      </text>
    </svg>
  );
}
