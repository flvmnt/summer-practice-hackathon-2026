import { ImageResponse } from "next/og";

// Next.js dynamic Apple touch icon. 180x180 PNG used when iOS users add the
// site to their home screen. Same s2m wordmark as the favicon, scaled up so
// the brand is readable on a phone tile and stays on-theme inside iOS's
// rounded-rectangle mask (iOS applies the mask itself).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f1e8",
          fontSize: 116,
          fontWeight: 800,
          letterSpacing: "-0.06em",
          fontFamily: "system-ui, sans-serif",
          color: "#0c0c0c",
        }}
      >
        s<span style={{ color: "#ff6a00" }}>2</span>m
      </div>
    ),
    { ...size },
  );
}
