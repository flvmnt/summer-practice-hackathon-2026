import type { ReactNode } from "react";
import { MapPin } from "./MapPin";

type Props = {
  /** Optional override for the children rendered inside the SVG (custom pins). */
  children?: ReactNode;
  className?: string;
  /** Show the pulsing "you are here" dot at center. Default true. */
  showMe?: boolean;
};

/**
 * Stylized abstract map background - buildings, streets, park, radius ring.
 * Ported from screens.jsx `MapBg`. Used as a placeholder before MapLibre is
 * wired up by agent A10.
 */
export function MapBg({ children, className, showMe = true }: Props) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, #EEEAE0 0%, #E8E2D2 100%)",
        overflow: "hidden",
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 390 768"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <pattern
            id="map-bldg"
            patternUnits="userSpaceOnUse"
            width="40"
            height="40"
          >
            <rect width="40" height="40" fill="none" />
            <rect x="2" y="2" width="14" height="14" fill="#D7CFBF" rx="2" />
            <rect x="22" y="6" width="14" height="20" fill="#DBD4C5" rx="2" />
            <rect x="6" y="22" width="20" height="12" fill="#D2C9B7" rx="2" />
          </pattern>
        </defs>
        <rect width="390" height="768" fill="url(#map-bldg)" opacity="0.6" />
        {/* major streets */}
        <path d="M0 320 L390 280" stroke="#FAF7F0" strokeWidth="20" />
        <path d="M120 0 L150 768" stroke="#FAF7F0" strokeWidth="14" />
        <path d="M0 540 L390 560" stroke="#FAF7F0" strokeWidth="10" />
        <path d="M270 0 L260 768" stroke="#FAF7F0" strokeWidth="10" />
        {/* park */}
        <ellipse cx="200" cy="430" rx="120" ry="70" fill="#D6E5CF" />
        <text
          x="200"
          y="435"
          textAnchor="middle"
          fontFamily="JetBrains Mono"
          fontSize="9"
          fill="#7E8E76"
          letterSpacing="0.2em"
        >
          PARK
        </text>
        {/* radius ring */}
        <circle
          cx="200"
          cy="430"
          r="110"
          fill="none"
          stroke="#FF5C2A"
          strokeOpacity="0.45"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        {showMe ? (
          <>
            <circle cx="200" cy="430" r="9" fill="#FF5C2A" />
            <circle
              cx="200"
              cy="430"
              r="9"
              fill="none"
              stroke="#FF5C2A"
              strokeWidth="2"
              opacity="0.4"
            >
              <animate
                attributeName="r"
                from="9"
                to="22"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.4"
                to="0"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        ) : null}

        {/* default sample pins (overrideable via children) */}
        {children ?? (
          <>
            <MapPin x={170} y={380} color="#FF5C2A" label="🏀" big />
            <MapPin x={260} y={460} color="#1E6E48" label="⚽" />
            <MapPin x={130} y={500} color="#0E1A1F" label="🎾" />
            <MapPin x={300} y={340} color="#0E1A1F" label="3" cluster />
          </>
        )}
      </svg>
    </div>
  );
}
