import { ImageResponse } from "next/og";

// Next.js dynamic icon route. Renders a 32x32 PNG so the browser
// stops 404'ing on /favicon.ico. Black "S2M" wordmark on the
// sodium-orange accent so the favicon matches the app theme.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ff6a00",
          color: "#fff",
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          fontFamily: "system-ui, sans-serif",
          borderRadius: 6,
        }}
      >
        S2M
      </div>
    ),
    { ...size },
  );
}
