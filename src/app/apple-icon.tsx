import { ImageResponse } from "next/og";

// Apple touch icon — used by iOS home-screen "Add to Home Screen" and many
// link-preview services. Same editorial car-on-plum mark as the
// favicon, scaled to 180×180 with the wheels detailed (cross spokes
// render legibly at this size where they don't at 32×32).
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          width="140"
          height="70"
          viewBox="0 0 220 110"
          fill="none"
          stroke="#f3eef0"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="14" y="56" width="192" height="34" rx="12" />
          <rect x="52" y="24" width="116" height="34" rx="10" />
          <line x1="110" y1="24" x2="110" y2="58" />
          <line x1="80" y1="60" x2="80" y2="88" />
          <line x1="140" y1="60" x2="140" y2="88" />
          <circle cx="18" cy="66" r="3" fill="#f3eef0" stroke="none" />
          <circle cx="202" cy="66" r="3" fill="#f3eef0" stroke="none" />
          <circle cx="60" cy="94" r="14" />
          <line x1="50" y1="94" x2="70" y2="94" />
          <line x1="60" y1="84" x2="60" y2="104" />
          <circle cx="160" cy="94" r="14" />
          <line x1="150" y1="94" x2="170" y2="94" />
          <line x1="160" y1="84" x2="160" y2="104" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
