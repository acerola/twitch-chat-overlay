import { FlowerIcon } from "./FlowerIcon";
import type { OverlayAlert } from "../types/overlay";

interface AlertKindIconProps {
  kind: OverlayAlert["kind"];
  className?: string;
}

export function AlertKindIcon({ kind, className }: AlertKindIconProps) {
  if (kind === "cheer") {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.3 15.2a4.1 4.1 0 0 1 3.9-3.3h7.2a3.3 3.3 0 0 1 0 6.7H9.6a4.3 4.3 0 0 1-4.3-3.4z" />
        <path d="M8.8 10.1l1.4-2.3m3.5 1.2V6.1m3.2 3.1L18.4 7" className="alert-icon-stroke" />
      </svg>
    );
  }

  if (kind === "subscribe") {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 19.8l-1-.9C6.5 14.8 4 12.5 4 9.5A4.4 4.4 0 0 1 8.4 5c1.5 0 2.9.7 3.8 1.9A4.8 4.8 0 0 1 16 5a4.4 4.4 0 0 1 4.4 4.5c0 3-2.4 5.3-7 9.4z" />
      </svg>
    );
  }

  if (kind === "gift") {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.4 10h15.2v9.3H4.4z" />
        <path d="M12 10v9.3M4.4 13.4h15.2" className="alert-icon-stroke" />
        <path d="M12 10H8.4A2.2 2.2 0 1 1 10 6.1L12 8.2zM12 10h3.6a2.2 2.2 0 1 0-1.6-3.9L12 8.2z" />
      </svg>
    );
  }

  if (kind === "raid") {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 7.2h17m-14.7 0v8.2m12.4-8.2v8.2m-7-8.2v8.2m-8.2 3.4h18" className="alert-icon-stroke" />
      </svg>
    );
  }

  return <FlowerIcon className={className} />;
}
