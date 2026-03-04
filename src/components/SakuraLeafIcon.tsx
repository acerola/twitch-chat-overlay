interface SakuraLeafIconProps {
  className?: string;
}

export function SakuraLeafIcon({ className }: SakuraLeafIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.6 15.8c-.2-4.8 3.1-8.8 10-11.6 2.6 7.4.6 13.6-6.4 16.8-2.2-1.5-3.5-3.1-3.6-5.2z"
        fill="currentColor"
      />
    </svg>
  );
}
