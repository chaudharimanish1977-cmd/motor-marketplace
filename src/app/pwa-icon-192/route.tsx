import { ImageResponse } from "next/og";

/**
 * GET /pwa-icon-192 — 192×192 PWA icon, required for installable
 * Progressive Web Apps on Chrome / Android.
 *
 * Same RightOffer ink-line car on plum mark as the favicon, scaled
 * up for the home-screen tile + app launcher. Defined as a route
 * handler (not the icon.tsx file convention) because Next.js only
 * accepts ONE icon.tsx per directory; for multiple PWA sizes we
 * serve via /pwa-icon-NNN routes and reference them in manifest.ts.
 */

export const runtime = "edge";

const SIZE = 192;

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
          width="150"
          height="75"
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
