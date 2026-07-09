export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* paddle */}
      <rect x="4" y="4" width="16" height="20" rx="8" fill="var(--color-court)" />
      <rect x="10.5" y="22" width="3" height="7" rx="1.5" fill="var(--color-court)" />
      {/* ball */}
      <circle cx="24" cy="23" r="6" fill="var(--color-ball)" />
      <circle cx="22" cy="20.5" r="0.9" fill="var(--color-ink)" />
      <circle cx="26.2" cy="21.5" r="0.9" fill="var(--color-ink)" />
      <circle cx="23.5" cy="25.2" r="0.9" fill="var(--color-ink)" />
      <circle cx="27" cy="25.5" r="0.9" fill="var(--color-ink)" />
    </svg>
  );
}
