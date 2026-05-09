type Props = {
  x: number;
  y: number;
  color: string;
  label?: string;
  big?: boolean;
  cluster?: boolean;
};

/**
 * SVG pin atom - render inside an existing <svg> ancestor.
 * Ported from screens.jsx `Pin`.
 */
export function MapPin({ x, y, color, label, big, cluster }: Props) {
  const r = big ? 18 : cluster ? 16 : 14;
  return (
    <g aria-hidden>
      <path
        d={`M ${x} ${y - r * 1.6} a ${r} ${r} 0 1 1 -0.01 0 Z`}
        fill={color}
      />
      <path
        d={`M ${x - r * 0.6} ${y - r * 0.7} L ${x} ${y + 2} L ${x + r * 0.6} ${y - r * 0.7} Z`}
        fill={color}
      />
      {label ? (
        <text
          x={x}
          y={y - r * 1.4}
          textAnchor="middle"
          fontSize={cluster ? 11 : 13}
          fontFamily={cluster ? "JetBrains Mono" : "system-ui"}
          fill="white"
          fontWeight={700}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
