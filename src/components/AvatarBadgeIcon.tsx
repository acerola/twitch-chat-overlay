import type { AvatarPresetId } from "../lib/overlay-customization";

interface AvatarBadgeIconProps {
  className?: string;
  preset: AvatarPresetId;
}

const BLOSSOM_PALETTES = [
  [
    "var(--avatar-accent-1)",
    "var(--avatar-accent-2)",
    "var(--avatar-accent-3)",
    "var(--avatar-accent-4)",
    "var(--avatar-accent-5)",
  ],
  [
    "var(--avatar-accent-1)",
    "var(--avatar-accent-3)",
    "var(--avatar-accent-4)",
    "var(--avatar-accent-5)",
    "var(--avatar-accent-2)",
  ],
  [
    "var(--avatar-accent-2)",
    "var(--avatar-accent-1)",
    "var(--avatar-accent-3)",
    "var(--avatar-accent-5)",
    "var(--avatar-accent-4)",
  ],
  [
    "var(--avatar-accent-3)",
    "var(--avatar-accent-2)",
    "var(--avatar-accent-4)",
    "var(--avatar-accent-1)",
    "var(--avatar-accent-5)",
  ],
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
  const palette = BLOSSOM_PALETTES[paletteIndex % BLOSSOM_PALETTES.length] ?? BLOSSOM_PALETTES[0];

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

function BlossomBadge() {
  return (
    <>
      <path
        fill="none"
        stroke="var(--avatar-stem-color)"
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
    </>
  );
}

function CrescentBadge() {
  return (
    <>
      <path
        fill="var(--avatar-accent-2)"
        d="M37.6 16.4c-8.6 2.3-14.2 10.2-12.4 19.1 1.4 7.3 7.1 12.7 14 14-2 0.8-4.2 1.2-6.4 1.2-9.7 0-17.6-7.9-17.6-17.6 0-9.6 7.7-17.4 17.3-17.6 1.8 0 3.5 0.3 5.1 0.9z"
      />
      <path
        fill="var(--avatar-accent-4)"
        d="M37.1 18.8c-7.2 2.1-11.8 8.6-10.3 15.8 0.8 3.9 3.4 7.3 6.8 9.3-7.3-0.4-13-6.5-13-13.9 0-7.7 6.1-14 13.7-14 .9 0 1.9.1 2.8.3z"
      />
      <g fill="#ffffff" opacity="0.95">
        <path d="M44.8 20.4l1 2.4 2.6 1-2.6 1-1 2.6-1-2.6-2.5-1 2.5-1 1-2.4z" />
        <path d="M48.9 29.8l0.7 1.6 1.7 0.6-1.7 0.7-0.7 1.7-0.7-1.7-1.7-0.7 1.7-0.6 0.7-1.6z" />
        <circle cx="15.6" cy="18.5" r="1.5" />
        <circle cx="49.5" cy="41.8" r="1.4" />
      </g>
      <path
        fill="none"
        stroke="var(--avatar-stem-color)"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M18.8 45.2c3.1-1.5 5.9-3.5 8.1-6.1M24.4 48.6c3.6-1.2 7-3.5 9.4-6.9"
      />
    </>
  );
}

function GemBadge() {
  return (
    <>
      <path
        fill="var(--avatar-accent-1)"
        d="M32 14.6l12.8 7.8v14.7L32 49.4 19.2 37.1V22.4L32 14.6z"
      />
      <path
        fill="var(--avatar-accent-3)"
        d="M32 18.6l9.1 5.4v10.6L32 43.4l-9.1-8.8V24l9.1-5.4z"
      />
      <path
        fill="var(--avatar-accent-5)"
        d="M32 18.6v24.8l9.1-8.8V24L32 18.6z"
      />
      <path
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.4"
        strokeLinejoin="round"
        d="M32 18.6l9.1 5.4v10.6L32 43.4l-9.1-8.8V24L32 18.6z"
      />
      <g fill="#ffffff" opacity="0.96">
        <path d="M16.4 22.1l0.9 2.1 2.3 0.8-2.3 0.9-0.9 2.3-0.9-2.3-2.3-0.9 2.3-0.8 0.9-2.1z" />
        <path d="M47.7 16.7l0.8 1.8 2 0.8-2 0.8-0.8 2-0.8-2-1.9-0.8 1.9-0.8 0.8-1.8z" />
        <path d="M48.3 41.7l0.7 1.5 1.7 0.7-1.7 0.6-0.7 1.7-0.6-1.7-1.7-0.6 1.7-0.7 0.6-1.5z" />
      </g>
    </>
  );
}

function StarBadge() {
  return (
    <>
      <circle cx="32" cy="32" r="14.5" fill="var(--avatar-accent-5)" opacity="0.28" />
      <path
        fill="var(--avatar-accent-2)"
        d="M32 16.2l3.9 9.8 10.5 2.2-8.2 6.9 1 10.7L32 40.4l-7.2 5.4 1-10.7-8.2-6.9 10.5-2.2 3.9-9.8z"
      />
      <path
        fill="var(--avatar-accent-4)"
        d="M32 20.7l2.7 6.8 7.4 1.6-5.7 4.9 0.7 7.4-5.1-3.8-5 3.8 0.7-7.4-5.7-4.9 7.3-1.6 2.7-6.8z"
      />
      <circle cx="32" cy="32" r="3.4" fill="#ffffff" />
      <g fill="#ffffff" opacity="0.9">
        <circle cx="14.5" cy="18.5" r="1.5" />
        <circle cx="48.4" cy="19.7" r="1.2" />
        <circle cx="17.8" cy="45.1" r="1.1" />
        <circle cx="47.2" cy="44.2" r="1.4" />
      </g>
    </>
  );
}

function renderPreset(preset: AvatarPresetId) {
  switch (preset) {
    case "crescent":
      return <CrescentBadge />;
    case "gem":
      return <GemBadge />;
    case "star":
      return <StarBadge />;
    case "blossom":
    default:
      return <BlossomBadge />;
  }
}

export function AvatarBadgeIcon({ className, preset }: AvatarBadgeIconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" data-avatar-preset={preset}>
      <circle cx="32" cy="32" r="27.6" fill="none" stroke="var(--avatar-ring-color)" strokeWidth="5.1" />
      {renderPreset(preset)}
    </svg>
  );
}
