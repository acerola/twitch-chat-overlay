interface AvatarBadgeIconProps {
  className?: string;
}

const BLOOM_PALETTES = [
  ["#ffe2eb", "#ffd2e0", "#ffc1d4", "#ffb5cc", "#ffc8da"],
  ["#ffdce8", "#ffcbdc", "#ffbbd1", "#ffadc6", "#ffc3d8"],
  ["#ffe6ee", "#ffd5e3", "#ffc7d8", "#ffb8ce", "#ffd0e0"],
  ["#ffdfeb", "#ffcedf", "#ffbfd4", "#ffb0c9", "#ffc6db"],
] as const;

function SakuraBloom({
  x,
  y,
  scale = 1,
  rotate = 0,
  paletteIndex = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  paletteIndex?: number;
}) {
  const transform = `translate(${x} ${y}) rotate(${rotate}) scale(${scale})`;
  const palette = BLOOM_PALETTES[paletteIndex % BLOOM_PALETTES.length] ?? BLOOM_PALETTES[0];
  return (
    <g transform={transform}>
      <ellipse cx="0" cy="-4.05" rx="2.45" ry="2.95" fill={palette[0]} />
      <ellipse cx="3.65" cy="-1.25" rx="2.45" ry="2.95" transform="rotate(72 3.65 -1.25)" fill={palette[1]} />
      <ellipse cx="2.3" cy="3.1" rx="2.45" ry="2.95" transform="rotate(144 2.3 3.1)" fill={palette[2]} />
      <ellipse cx="-2.3" cy="3.1" rx="2.45" ry="2.95" transform="rotate(216 -2.3 3.1)" fill={palette[3]} />
      <ellipse cx="-3.65" cy="-1.25" rx="2.45" ry="2.95" transform="rotate(288 -3.65 -1.25)" fill={palette[4]} />
      <circle cx="0" cy="0" r="1.44" fill="#fff9fc" />
    </g>
  );
}

export function AvatarBadgeIcon({ className }: AvatarBadgeIconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="27.6" fill="none" stroke="#ffc9d4" strokeWidth="5.1" />
      <path
        fill="none"
        stroke="#7b563c"
        strokeWidth="1.95"
        strokeLinecap="round"
        d="M11.8 45.4c6.7-4.3 10.9-7.9 16.5-10.1M20.4 34.4c2.8-3.6 6.3-5.8 10.1-7.3M17.8 41.4c2.4-1.5 4.4-3.3 6.1-5.5M27.5 41.2c2.1-2.3 3.9-5 5.3-8.1"
      />
      <g>
        <SakuraBloom x={14.2} y={45.5} scale={1.28} rotate={-12} paletteIndex={0} />
        <SakuraBloom x={19.8} y={39.6} scale={1.04} rotate={16} paletteIndex={1} />
        <SakuraBloom x={27.2} y={33.8} scale={1.18} rotate={-18} paletteIndex={2} />
        <SakuraBloom x={35.1} y={29.2} scale={0.98} rotate={24} paletteIndex={3} />
        <SakuraBloom x={43.5} y={24.9} scale={0.9} rotate={-26} paletteIndex={1} />
        <SakuraBloom x={23.9} y={45.3} scale={0.88} rotate={10} paletteIndex={2} />
        <SakuraBloom x={32.6} y={40.1} scale={0.82} rotate={-9} paletteIndex={0} />
        <SakuraBloom x={29.5} y={36.6} scale={0.74} rotate={31} paletteIndex={3} />
      </g>
      <g fill="#ffffff" opacity="0.92">
        <circle cx="10.4" cy="20.8" r="1.8" />
        <circle cx="8.8" cy="29.9" r="1.2" />
        <circle cx="12" cy="50.2" r="1.4" />
        <circle cx="50.5" cy="15.4" r="1.3" />
        <circle cx="54.6" cy="24.3" r="1.7" />
        <circle cx="40.4" cy="13.9" r="1.1" />
        <circle cx="44.1" cy="50.3" r="1.2" />
      </g>
    </svg>
  );
}
