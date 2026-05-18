import { ImageResponse } from "next/og";

/**
 * GET /pwa-icon-512 — 512×512 PWA icon, required for installable
 * Progressive Web Apps (Chrome's PWA criteria need both 192 and 512).
 *
 * Same RightOffer ink-line car on plum mark as the favicon, scaled
 * for the splash screen + maskable home-screen tile. Defined as a
 * route handler so we can serve at /pwa-icon-512 and reference from
 * manifest.ts.
 */

export const runtime = "edge";

const SIZE = 512;

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#3a1e3d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="400"
          height="200"
          viewBox="0 0 220 110"
          fill="none"
          stroke="#f3eef0"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="14" y="56" width="192" height="34" rx="12" />
          <rect x="52" y="24" width="116" height="34" rx="10" />
          <line x1="110" y1="24" x2="110" y2="58" />
          <line x1="80" y1="60" x2="80" y2="88" />
          <line x1="140" y1="60" x2="140" y2="88" />
          <circle cx="60" cy="94" r="14" />
          <circle cx="160" cy="94" r="14" />
        </svg>
      </div>
    ),
    { width: SIZE, height: SIZE }
  );
}
