import { ImageResponse } from "next/og";

// 1200×630 Open Graph card — shown when rightoffer.in is shared on
// WhatsApp, LinkedIn, Twitter, Slack, etc. Twitter's `summary_large_image`
// card also resolves to this file.
export const runtime = "edge";
export const alt = "RightOffer — AI motor insurance review in under 2 minutes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1a3470",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 96px",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "white",
        }}
      >
        {/* Brand wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 64,
          }}
        >
          <div
            style={{
              fontSize: 84,
              fontWeight: 900,
              fontStyle: "italic",
              color: "white",
              letterSpacing: -2,
            }}
          >
            right
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 900,
              fontStyle: "italic",
              color: "#ff5a30",
              letterSpacing: -2,
            }}
          >
            offer
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 900,
              color: "white",
              marginLeft: 4,
              marginBottom: -28,
            }}
          >
            .in
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.1,
            marginBottom: 24,
            maxWidth: 1000,
          }}
        >
          AI motor insurance review
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#5EC8E6",
            lineHeight: 1.1,
            marginBottom: 48,
            maxWidth: 1000,
          }}
        >
          in under 2 minutes.
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 30,
            color: "#DFE6E9",
            lineHeight: 1.3,
            maxWidth: 980,
          }}
        >
          Free, independent. See coverage gaps, get add-on advice, and find
          better renewal offers — without a single sales call.
        </div>
      </div>
    ),
    { ...size },
  );
}
