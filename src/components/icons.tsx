interface IconProps {
  size?: number;
  className?: string;
}

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconDashboard({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <line x1="4" y1="20" x2="4" y2="12" />
      <line x1="12" y1="20" x2="12" y2="6" />
      <line x1="20" y1="20" x2="20" y2="15" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

export function IconCalendar({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  );
}

export function IconBook({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Z" />
      <line x1="4" y1="19" x2="20" y2="19" />
    </svg>
  );
}

export function IconNewspaper({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="5" width="14" height="15" rx="1.5" />
      <line x1="6" y1="9" x2="14" y2="9" />
      <line x1="6" y1="12.5" x2="14" y2="12.5" />
      <line x1="6" y1="16" x2="11" y2="16" />
      <path d="M17 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
    </svg>
  );
}

export function IconUsers({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 4.3a3.2 3.2 0 0 1 0 6.2" />
      <path d="M15 14.2c2.9.5 5 2.9 5 5.8" />
    </svg>
  );
}

export function IconChat({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 5h16v11H8l-4 4V5Z" />
    </svg>
  );
}

export function IconTrophy({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a3 3 0 0 0 3 5" />
      <path d="M17 5h3a3 3 0 0 1-3 5" />
      <line x1="12" y1="14" x2="12" y2="18" />
      <line x1="9" y1="21" x2="15" y2="21" />
      <line x1="12" y1="18" x2="12" y2="21" />
    </svg>
  );
}

export function IconClip({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M8 12.5 15.5 5a3 3 0 1 1 4.2 4.2L11 17.9a5 5 0 1 1-7-7L11 4" />
    </svg>
  );
}
