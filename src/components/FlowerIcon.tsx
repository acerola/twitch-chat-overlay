interface FlowerIconProps {
  className?: string;
}

export function FlowerIcon({ className }: FlowerIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="5.2" rx="3.2" ry="3.7" fill="currentColor" />
      <ellipse cx="18.1" cy="9.2" rx="3.2" ry="3.7" transform="rotate(72 18.1 9.2)" fill="currentColor" />
      <ellipse cx="15.8" cy="16.4" rx="3.2" ry="3.7" transform="rotate(144 15.8 16.4)" fill="currentColor" />
      <ellipse cx="8.2" cy="16.4" rx="3.2" ry="3.7" transform="rotate(216 8.2 16.4)" fill="currentColor" />
      <ellipse cx="5.9" cy="9.2" rx="3.2" ry="3.7" transform="rotate(288 5.9 9.2)" fill="currentColor" />
      <circle cx="12" cy="12.2" r="2.4" fill="rgba(255, 255, 255, 0.9)" />
    </svg>
  );
}
