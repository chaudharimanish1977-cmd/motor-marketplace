import { ImageResponse } from "next/og";

// Route segment config — Next.js renders this as /icon (PNG) and uses it as
// the site favicon, replacing the default Vercel mark in Google search.
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
          background: "#1a3470",
          color: "#ff5a30",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 900,
          fontStyle: "italic",
          fontFamily: "Arial, Helvetica, sans-serif",
          letterSpacing: -1,
        }}
      >
        R
      </div>
    ),
    { ...size },
  );
}
