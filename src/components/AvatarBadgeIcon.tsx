import { useId } from "react";
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


function StarBadge() {
  return (
    <>
      {/* Glow rings (burst on enter, then subtle) */}
      <circle className="star-glow" cx="32" cy="32" r="22" fill="var(--avatar-accent-2)" opacity="0" />
      <circle className="star-glow-inner" cx="32" cy="32" r="17" fill="var(--avatar-accent-4)" opacity="0" />
      {/* Faceted star — 10 triangular facets from center to vertices */}
      {/* Top point */}
      <path fill="var(--avatar-accent-1)" d="M32 32 L27.9 26.3 L32 16 Z" />
      <path fill="var(--avatar-accent-2)" d="M32 32 L32 16 L36.1 26.3 Z" />
      {/* Upper-right point */}
      <path fill="var(--avatar-accent-3)" d="M32 32 L36.1 26.3 L47.2 27.1 Z" />
      <path fill="var(--avatar-accent-4)" d="M32 32 L47.2 27.1 L38.7 34.2 Z" />
      {/* Lower-right point */}
      <path fill="var(--avatar-accent-2)" d="M32 32 L38.7 34.2 L41.4 44.9 Z" />
      <path fill="var(--avatar-accent-4)" d="M32 32 L41.4 44.9 L32 39 Z" />
      {/* Lower-left point */}
      <path fill="var(--avatar-accent-3)" d="M32 32 L32 39 L22.6 44.9 Z" />
      <path fill="var(--avatar-accent-2)" d="M32 32 L22.6 44.9 L25.3 34.2 Z" />
      {/* Upper-left point */}
      <path fill="var(--avatar-accent-1)" d="M32 32 L25.3 34.2 L16.8 27.1 Z" />
      <path fill="var(--avatar-accent-1)" d="M32 32 L16.8 27.1 L27.9 26.3 Z" />
      {/* Cross-shaped sparkles */}
      <g>
        <path className="star-sparkle-1" fill="#ffffff" d="M15 17l0.8-2.2 0.8 2.2 2.2 0.8-2.2 0.8-0.8 2.2-0.8-2.2-2.2-0.8z" />
        <path className="star-sparkle-2" fill="#ffffff" d="M48 18l0.6-1.6 0.6 1.6 1.6 0.6-1.6 0.6-0.6 1.6-0.6-1.6-1.6-0.6z" />
        <path className="star-sparkle-3" fill="#ffffff" d="M12 38l0.5-1.3 0.5 1.3 1.3 0.5-1.3 0.5-0.5 1.3-0.5-1.3-1.3-0.5z" />
        <path className="star-sparkle-4" fill="#ffffff" d="M50 42l0.7-1.8 0.7 1.8 1.8 0.7-1.8 0.7-0.7 1.8-0.7-1.8-1.8-0.7z" />
        <path className="star-sparkle-5" fill="#ffffff" d="M18 48l0.5-1.4 0.5 1.4 1.4 0.5-1.4 0.5-0.5 1.4-0.5-1.4-1.4-0.5z" />
        <path className="star-sparkle-6" fill="#ffffff" d="M46 13l0.4-1.1 0.4 1.1 1.1 0.4-1.1 0.4-0.4 1.1-0.4-1.1-1.1-0.4z" />
      </g>
    </>
  );
}

interface VampireWingIds {
  membraneGradientId: string;
  membraneHighlightId: string;
}

function VampireWingsBadge({
  membraneGradientId,
  membraneHighlightId,
}: VampireWingIds) {
  return (
    <>
      <g data-avatar-ornament="vampire-wings">
        {/* Left wing */}
        <g className="vampire-wing-l">
          <path
            fill="#120d16"
            stroke="#fff8fd"
            strokeWidth="1.5"
            strokeLinejoin="round"
            d="M30 34C27 28 20 20 14 16Q18 22 9 26Q16 32 10 38Q18 42 15 46C18 46 24 43 29 38Z"
          />
          <path
            fill={`url(#${membraneGradientId})`}
            d="M29 34C26 30 22 22 16 18Q18 23 11 27Q16 32 12 37Q18 41 17 45C20 45 25 42 28 39Z"
          />
          <path
            fill="none"
            stroke="#221224"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M29 34L26 28L21 22L17 18L14 16M26 28L15 46M21 22L10 38M17 18L9 26"
          />
          <path
            fill="none"
            stroke={`url(#${membraneHighlightId})`}
            strokeWidth="0.9"
            strokeLinecap="round"
            d="M27 37C24 38 20 42 17 45M24 32C20 34 16 37 12 37M20 26C17 28 13 30 10 30"
          />
        </g>

        {/* Right wing — mirrored */}
        <g className="vampire-wing-r">
          <path
            fill="#120d16"
            stroke="#fff8fd"
            strokeWidth="1.5"
            strokeLinejoin="round"
            transform="translate(64 0) scale(-1 1)"
            d="M30 34C27 28 20 20 14 16Q18 22 9 26Q16 32 10 38Q18 42 15 46C18 46 24 43 29 38Z"
          />
          <path
            fill={`url(#${membraneGradientId})`}
            transform="translate(64 0) scale(-1 1)"
            d="M29 34C26 30 22 22 16 18Q18 23 11 27Q16 32 12 37Q18 41 17 45C20 45 25 42 28 39Z"
          />
          <path
            fill="none"
            stroke="#221224"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(64 0) scale(-1 1)"
            d="M29 34L26 28L21 22L17 18L14 16M26 28L15 46M21 22L10 38M17 18L9 26"
          />
          <path
            fill="none"
            stroke={`url(#${membraneHighlightId})`}
            strokeWidth="0.9"
            strokeLinecap="round"
            transform="translate(64 0) scale(-1 1)"
            d="M27 37C24 38 20 42 17 45M24 32C20 34 16 37 12 37M20 26C17 28 13 30 10 30"
          />
        </g>
      </g>
      {/* Center crest diamond */}
      <path
        data-avatar-core="vampire-crest"
        fill="#120d16"
        stroke="#fff7fc"
        strokeWidth="1.2"
        strokeLinejoin="round"
        d="M32 26.5l1.4 1-0.2 2.5-1.2 3.2-1.2-3.2-0.2-2.5 1.4-1z"
      />
      <path
        fill="#ff4a63"
        d="M32 27.4l0.5 0.3v0.8l-0.5 1.3-0.5-1.3v-0.8z"
      />
      {/* Sparkle above crest */}
      <path
        fill="#fff8fc"
        d="M31.4 24.2l0.6-1.8 0.6 1.8 1.4 0.5-1.4 0.4-0.6 1.7-0.6-1.7-1.4-0.4z"
      />
      {/* Accent sparkles near wing tips */}
      <g fill="#ffffff" opacity="0.92">
        <circle cx="13" cy="15" r="0.7" />
        <circle cx="51" cy="15" r="0.7" />
      </g>
    </>
  );
}

function renderPreset(preset: AvatarPresetId) {
  switch (preset) {
    case "crescent":
      return <CrescentBadge />;
    case "star":
      return <StarBadge />;
    case "blossom":
    default:
      return <BlossomBadge />;
  }
}

export function AvatarBadgeIcon({ className, preset }: AvatarBadgeIconProps) {
  const membraneGradientId = useId().replace(/:/g, "");
  const membraneHighlightId = useId().replace(/:/g, "");

  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" data-avatar-preset={preset}>
      {preset === "vampire" ? (
        <defs>
          <linearGradient id={membraneGradientId} x1="10" y1="18" x2="29" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5d1022" />
            <stop offset="0.46" stopColor="#ff334e" />
            <stop offset="1" stopColor="#6d0f22" />
          </linearGradient>
          <linearGradient id={membraneHighlightId} x1="10" y1="22" x2="28" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.72" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      ) : null}
      <circle cx="32" cy="32" r="27.6" fill="none" stroke="var(--avatar-ring-color)" strokeWidth="5.1" />
      {preset === "vampire"
        ? <VampireWingsBadge membraneGradientId={membraneGradientId} membraneHighlightId={membraneHighlightId} />
        : renderPreset(preset)}
    </svg>
  );
}
