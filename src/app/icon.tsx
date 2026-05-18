import { ImageResponse } from "next/og";

// Route segment config — Next.js renders this as /icon (PNG) and uses it
// as the site favicon, replacing the default Vercel mark in Google search.
//
// RightOffer favicon: same ink-line car the home page uses as an inline
// icon, scaled into a 32×32 tile on the deep-plum brand surface. Sage
// stroke + plum bg lifts off the dark Chrome tab strip and stays
// recognisable at favicon resolution.
export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
        {/* Car ink-line — same paths as SketchCarStatic in
            src/components/sketches.tsx but with a heavier stroke so it
            holds together at 32×32. */}
        <svg
          width="26"
          height="13"
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
    { ...size }
  );
}
