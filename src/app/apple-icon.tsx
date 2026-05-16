import { ImageResponse } from "next/og";

// Apple touch icon — used by iOS home-screen "Add to Home Screen" and many
// link-preview services. Same mark as the favicon, larger and on a rounded
// brand-blue tile.
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
          background: "#1a3470",
          color: "#ff5a30",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 132,
          fontWeight: 900,
          fontStyle: "italic",
          fontFamily: "Arial, Helvetica, sans-serif",
          letterSpacing: -4,
        }}
      >
        R
      </div>
    ),
    { ...size },
  );
}
