"use client";

/**
 * ShowUp2Move — mono symbolic glyph family.
 * Single weight, single optical size — all 24×24 grid.
 * Stroke from CSS (currentColor) so they recolor with brand swap.
 *
 * Ported from ShowUp2Move/icons.jsx (Direction B canvas).
 */

import type { FC } from "react";

type GlyphProps = {
  size?: number;
  className?: string;
};

type InternalProps = {
  d?: string;
  paths?: string[];
  fill?: boolean;
  size: number;
  className?: string;
};

function GlyphSvg({ d, paths, fill = false, size, className }: InternalProps) {
  const stroke = fill ? "none" : "currentColor";
  const fillAttr = fill ? "currentColor" : "none";
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        flex: "none",
        verticalAlign: "-0.15em",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        stroke={stroke}
        fill={fill ? fillAttr : "none"}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths
          ? paths.map((p, i) => <path key={i} d={p} />)
          : d
            ? <path d={d} />
            : null}
      </svg>
    </span>
  );
}

const make = (def: { d?: string; paths?: string[]; fill?: boolean }): FC<GlyphProps> => {
  const Component: FC<GlyphProps> = ({ size = 20, className }) => (
    <GlyphSvg
      d={def.d}
      paths={def.paths}
      fill={def.fill}
      size={size}
      className={className}
    />
  );
  return Component;
};

export const Glyph = {
  // nav
  today: make({ paths: ["M4 12 L12 5 L20 12", "M6 11 V20 H18 V11"] }),
  groups: make({
    paths: [
      "M8 11 a3 3 0 1 0 0 -6 a3 3 0 1 0 0 6",
      "M16 12 a2.5 2.5 0 1 0 0 -5 a2.5 2.5 0 1 0 0 5",
      "M2 20 c1 -3 4 -4.5 6 -4.5 s5 1.5 6 4.5",
      "M14 20 c1 -3 3.5 -4 5.5 -4 c1 0 2 .3 2.5 .8",
    ],
  }),
  map: make({
    paths: ["M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z", "M9 4 V18", "M15 6 V20"],
  }),
  profile: make({
    paths: [
      "M12 12 a4 4 0 1 0 0 -8 a4 4 0 1 0 0 8",
      "M4 21 c1 -4 4.5 -6 8 -6 s7 2 8 6",
    ],
  }),
  // verbs
  arrow: make({ paths: ["M5 12 H19", "M13 6 L19 12 L13 18"] }),
  check: make({ d: "M5 12 L10 17 L19 7" }),
  close: make({ paths: ["M6 6 L18 18", "M18 6 L6 18"] }),
  plus: make({ paths: ["M12 5 V19", "M5 12 H19"] }),
  bell: make({
    paths: ["M6 16 V11 a6 6 0 1 1 12 0 V16 L20 18 H4 Z", "M10 21 a2 2 0 1 0 4 0"],
  }),
  back: make({ paths: ["M19 12 H5", "M11 6 L5 12 L11 18"] }),
  more: make({
    paths: [
      "M5 12 a1 1 0 1 0 0 -.1",
      "M12 12 a1 1 0 1 0 0 -.1",
      "M19 12 a1 1 0 1 0 0 -.1",
    ],
  }),
  send: make({ paths: ["M3 12 L21 4 L13 21 L11 13 Z"] }),
  mic: make({
    paths: [
      "M12 15 a3 3 0 0 0 3 -3 V6 a3 3 0 1 0 -6 0 V12 a3 3 0 0 0 3 3 Z",
      "M6 12 a6 6 0 0 0 12 0",
      "M12 18 V21",
      "M9 21 H15",
    ],
  }),
  lock: make({
    paths: [
      "M6 11 H18 V20 H6 Z",
      "M9 11 V8 a3 3 0 1 1 6 0 V11",
      "M12 14 V17",
    ],
  }),
  key: make({
    paths: [
      "M14 14 a4 4 0 1 0 0 -8 a4 4 0 1 0 0 8",
      "M11 13 L4 20",
      "M7 17 L9 19",
    ],
  }),
  chevron: make({ paths: ["M9 6 L15 12 L9 18"] }),
  chat: make({
    paths: [
      "M4 6 H20 V17 H13 L8 21 V17 H4 Z",
      "M8 11 H8.01",
      "M12 11 H12.01",
      "M16 11 H16.01",
    ],
  }),
  vote: make({ paths: ["M4 11 L9 16 L20 5", "M4 19 H20"] }),
  // info
  pin: make({
    paths: [
      "M12 21 C7 15 5 12 5 9 a7 7 0 1 1 14 0 c0 3 -2 6 -7 12 Z",
      "M12 11 a2 2 0 1 0 0 -4 a2 2 0 1 0 0 4",
    ],
  }),
  clock: make({
    paths: ["M12 21 a9 9 0 1 0 0 -18 a9 9 0 1 0 0 18", "M12 7 V12 L15 14"],
  }),
  cloud: make({
    d: "M7 18 a4 4 0 0 1 0 -8 a5 5 0 0 1 9.6 -1.5 A4 4 0 0 1 17 18 Z",
  }),
  sun: make({
    paths: [
      "M12 16 a4 4 0 1 0 0 -8 a4 4 0 1 0 0 8",
      "M12 3 V5",
      "M12 19 V21",
      "M3 12 H5",
      "M19 12 H21",
      "M5.6 5.6 L7 7",
      "M17 17 L18.4 18.4",
      "M5.6 18.4 L7 17",
      "M17 7 L18.4 5.6",
    ],
  }),
  rain: make({
    paths: [
      "M7 14 a4 4 0 0 1 0 -8 a5 5 0 0 1 9.6 -1.5 A4 4 0 0 1 17 14 Z",
      "M9 18 L8 21",
      "M13 18 L12 21",
      "M17 18 L16 21",
    ],
  }),
  wind: make({
    paths: [
      "M3 9 H14 a3 3 0 1 0 -3 -3",
      "M3 15 H17 a3 3 0 1 1 -3 3",
    ],
  }),
  shield: make({ d: "M12 3 L20 6 V12 c0 4 -3 7 -8 9 c-5 -2 -8 -5 -8 -9 V6 Z" }),
  copy: make({ paths: ["M9 8 H19 V20 H9 Z", "M5 16 H4 V4 H15 V5"] }),
  search: make({
    paths: ["M11 19 a8 8 0 1 0 0 -16 a8 8 0 1 0 0 16", "M17 17 L21 21"],
  }),
  filter: make({ paths: ["M3 5 H21", "M6 12 H18", "M10 19 H14"] }),
  crown: make({ d: "M3 8 L7 13 L12 6 L17 13 L21 8 V18 H3 Z" }),
  cal: make({
    paths: ["M4 6 H20 V20 H4 Z", "M4 10 H20", "M8 4 V8", "M16 4 V8"],
  }),
  car: make({
    paths: [
      "M4 16 V12 L6 7 H18 L20 12 V16",
      "M4 16 H20 V19 H17 V16",
      "M4 16 V19 H7 V16",
      "M7 12 H17",
    ],
  }),
  pulse: make({ d: "M3 12 H7 L9 6 L13 18 L15 12 H21" }),
  spark: make({ paths: ["M5 12 H11", "M14 6 L19 12 L14 18", "M14 12 H19"] }), // chevron-burst
  camera: make({
    paths: [
      "M4 8 H8 L10 6 H14 L16 8 H20 V18 H4 Z",
      "M12 16 a3 3 0 1 0 0 -6 a3 3 0 1 0 0 6",
    ],
  }),
  upload: make({
    paths: ["M12 4 V16", "M7 9 L12 4 L17 9", "M5 20 H19"],
  }),
  globe: make({
    paths: [
      "M12 21 a9 9 0 1 0 0 -18 a9 9 0 1 0 0 18",
      "M3 12 H21",
      "M12 3 c3 3 4.5 6 4.5 9 s -1.5 6 -4.5 9",
      "M12 3 c-3 3 -4.5 6 -4.5 9 s 1.5 6 4.5 9",
    ],
  }),
  // sport — single family of mono glyphs
  football: make({
    paths: [
      "M12 21 a9 9 0 1 0 0 -18 a9 9 0 1 0 0 18",
      "M12 7 L8 10 L9.5 14.5 H14.5 L16 10 Z",
      "M12 3 V7",
      "M12 14.5 V20",
      "M3.5 9 L8 10",
      "M16 10 L20.5 9",
      "M9.5 14.5 L5 17",
      "M14.5 14.5 L19 17",
    ],
  }),
  basketball: make({
    paths: [
      "M12 21 a9 9 0 1 0 0 -18 a9 9 0 1 0 0 18",
      "M3 12 H21",
      "M12 3 V21",
      "M5.5 5.5 c3.5 2 5 4 5 6.5 s -1.5 4.5 -5 6.5",
      "M18.5 5.5 c-3.5 2 -5 4 -5 6.5 s 1.5 4.5 5 6.5",
    ],
  }),
  tennis: make({
    paths: [
      "M12 21 a9 9 0 1 0 0 -18 a9 9 0 1 0 0 18",
      "M5 5 c4 4 4 10 0 14",
      "M19 5 c-4 4 -4 10 0 14",
    ],
  }),
  padel: make({
    paths: [
      "M5 4 H14 V13 H5 Z M5 4 a4 4 0 0 0 0 8 H5",
      "M9 13 L8 21 H11 L11 13",
      "M7 7 H12",
      "M7 10 H12",
    ],
  }),
  running: make({
    paths: [
      "M14 5 a1.5 1.5 0 1 0 0 -3 a1.5 1.5 0 1 0 0 3",
      "M9 21 L11 14 L8 11 L10 6 L14 8 L17 11",
      "M13 14 L17 17",
      "M4 13 L7 11",
    ],
  }),
  volley: make({
    paths: [
      "M12 21 a9 9 0 1 0 0 -18 a9 9 0 1 0 0 18",
      "M12 3 c3 4 4 8 3 18",
      "M3.5 9 c5 -1 9 0 14 5",
      "M5 18 c2 -5 5 -8 12 -10",
    ],
  }),
} satisfies Record<string, FC<GlyphProps>>;

export type GlyphName = keyof typeof Glyph;
export type { GlyphProps };
