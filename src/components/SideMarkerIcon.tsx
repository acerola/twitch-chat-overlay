import type { CSSProperties } from "react";
import type { AvatarPresetId } from "../lib/overlay-customization";

interface SideMarkerIconProps {
  className?: string;
  style?: CSSProperties;
  preset: AvatarPresetId;
}

function BatWingPath() {
  return (
    <path
      d="M5 18C6.5 14 10 8 14 5Q11 10 17 8Q13 13 19 11Q15 16 20 16C18 19 13 21 8 20C6.5 19.5 5.5 19 5 18Z"
      fill="currentColor"
    />
  );
}

function CrescentPath() {
  return (
    <path
      d="M14 4c-5.5 1.5-9 6.5-7.8 12.2.9 4.4 4.3 7.7 8.5 8.5-1.2.5-2.6.7-3.9.7C4.9 25.4 0 20.5 0 14.4 0 8.5 4.7 3.6 10.6 3.4c1.1 0 2.2.2 3.4.6z"
      fill="currentColor"
    />
  );
}

function GemPath() {
  return (
    <>
      <path d="M4 9h16l-8 13Z" fill="currentColor" />
      <path d="M4 9l2.5-5h11L20 9Z" fill="currentColor" opacity="0.7" />
    </>
  );
}

function StarPath() {
  return (
    <path
      d="M12 2l2.9 7.3 7.8 1.6-6.1 5.1.7 7.9L12 20.2 6.7 24l.7-7.9L1.3 10.9l7.8-1.6L12 2z"
      fill="currentColor"
    />
  );
}

export function SideMarkerIcon({ className, style, preset }: SideMarkerIconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" aria-hidden="true">
      {preset === "vampire" ? (
        <BatWingPath />
      ) : preset === "crescent" ? (
        <CrescentPath />
      ) : preset === "gem" ? (
        <GemPath />
      ) : preset === "star" ? (
        <StarPath />
      ) : (
        <path
          d="M4.6 15.8c-.2-4.8 3.1-8.8 10-11.6 2.6 7.4.6 13.6-6.4 16.8-2.2-1.5-3.5-3.1-3.6-5.2z"
          fill="currentColor"
        />
      )}
    </svg>
  );
}
