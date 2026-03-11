import type { AvatarPresetId } from "../lib/overlay-customization";

interface DividerIconProps {
  className?: string;
  preset: AvatarPresetId;
}

export function DividerIcon({ className, preset }: DividerIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {preset === "vampire" ? (
        /* Bat wings spread — two separate wings */
        <>
          <path
            d="M11 13C9.5 10 6 6 1 3Q4 7 3 11Q6 7 7 12Q9 8 10.5 12L11 14Z"
            fill="currentColor"
          />
          <path
            d="M13 13C14.5 10 18 6 23 3Q20 7 21 11Q18 7 17 12Q15 8 13.5 12L13 14Z"
            fill="currentColor"
          />
        </>
      ) : preset === "crescent" ? (
        /* Small crescent */
        <path
          d="M14.5 5.5c-3.8 1-6.2 4.5-5.4 8.4.6 3.2 3.1 5.5 6.1 6.1-.9.3-1.8.5-2.8.5-4.2 0-7.7-3.5-7.7-7.7S8.4 5 12.6 5c.7 0 1.3.1 1.9.5z"
          fill="currentColor"
        />
      ) : preset === "star" ? (
        /* Small star */
        <path
          d="M12 3l2.5 6.3 6.7 1.3-5.2 4.4.6 6.8L12 18.5 7.4 21.8l.6-6.8L2.8 10.6l6.7-1.3L12 3z"
          fill="currentColor"
        />
      ) : (
        /* Default sakura flower */
        <>
          <ellipse cx="12" cy="5.2" rx="3.2" ry="3.7" fill="currentColor" />
          <ellipse cx="18.1" cy="9.2" rx="3.2" ry="3.7" transform="rotate(72 18.1 9.2)" fill="currentColor" />
          <ellipse cx="15.8" cy="16.4" rx="3.2" ry="3.7" transform="rotate(144 15.8 16.4)" fill="currentColor" />
          <ellipse cx="8.2" cy="16.4" rx="3.2" ry="3.7" transform="rotate(216 8.2 16.4)" fill="currentColor" />
          <ellipse cx="5.9" cy="9.2" rx="3.2" ry="3.7" transform="rotate(288 5.9 9.2)" fill="currentColor" />
          <circle cx="12" cy="12.2" r="2.4" fill="rgba(255, 255, 255, 0.9)" />
        </>
      )}
    </svg>
  );
}
