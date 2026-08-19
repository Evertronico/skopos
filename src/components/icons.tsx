interface IconProps {
  size?: number
  className?: string
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconDashboard({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <line x1="4" y1="20" x2="4" y2="13" />
      <line x1="10" y1="20" x2="10" y2="4" />
      <line x1="16" y1="20" x2="16" y2="9" />
      <line x1="21" y1="20" x2="3" y2="20" />
    </svg>
  )
}

export function IconRuler({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <rect x="2.5" y="9" width="19" height="6" rx="1" />
      <line x1="6" y1="9" x2="6" y2="12" />
      <line x1="10" y1="9" x2="10" y2="12" />
      <line x1="14" y1="9" x2="14" y2="12" />
      <line x1="18" y1="9" x2="18" y2="12" />
    </svg>
  )
}

export function IconDumbbell({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <rect x="1.5" y="9.5" width="3" height="5" rx="1" />
      <rect x="19.5" y="9.5" width="3" height="5" rx="1" />
      <rect x="4.5" y="7.5" width="2.5" height="9" rx="1" />
      <rect x="17" y="7.5" width="2.5" height="9" rx="1" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  )
}

export function IconDroplet({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <path d="M12 3c4 5 6 8.5 6 11a6 6 0 0 1-12 0c0-2.5 2-6 6-11z" />
    </svg>
  )
}

export function IconUser({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.2 3.6-6.5 8-6.5s8 2.3 8 6.5" />
    </svg>
  )
}

export function IconCloud({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <path d="M7 18a4 4 0 0 1 .9-7.9 5 5 0 0 1 9.6-1.6A4 4 0 0 1 17 18H7z" />
      <polyline points="9 15 12 12 15 15" />
      <line x1="12" y1="12" x2="12" y2="18.5" />
    </svg>
  )
}

export function IconTimer({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <line x1="9" y1="2" x2="15" y2="2" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <circle cx="12" cy="13" r="8" />
      <polyline points="12 9 12 13 15 15" />
    </svg>
  )
}

export function IconTarget({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}
