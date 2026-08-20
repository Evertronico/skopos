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

export function IconCalendar({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="2.5" x2="8" y2="6.5" />
      <line x1="16" y1="2.5" x2="16" y2="6.5" />
    </svg>
  )
}

export function IconHeart({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <path d="M12 20.5s-7.5-4.7-9.8-9.4C.7 7.6 2.3 4 6 4c2 0 3.5 1.1 6 3.3C14.5 5.1 16 4 18 4c3.7 0 5.3 3.6 3.8 7.1C19.5 15.8 12 20.5 12 20.5z" />
    </svg>
  )
}

export function IconUtensils({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <path d="M6 2.5v8a1.5 1.5 0 0 0 3 0v-8" />
      <line x1="7.5" y1="2.5" x2="7.5" y2="21.5" />
      <path d="M17 2.5c-2 0-3 2-3 5s1 4 3 4v10" />
    </svg>
  )
}

export function IconMoon({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <path d="M20 14.2A8.5 8.5 0 1 1 9.8 4a7 7 0 0 0 10.2 10.2z" />
    </svg>
  )
}

export function IconLoop({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <path d="M4 12a8 8 0 0 1 14-5.3" />
      <polyline points="18 2 18 7 13 7" />
      <path d="M20 12a8 8 0 0 1-14 5.3" />
      <polyline points="6 22 6 17 11 17" />
    </svg>
  )
}

export function IconCheck({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <polyline points="4 12.5 9.5 18 20 5" />
    </svg>
  )
}

export function IconTrash({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <polyline points="3.5 6 5.5 6 20.5 6" />
      <path d="M8 6V4a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 4v2" />
      <path d="M6 6l1 14.5A1.5 1.5 0 0 0 8.5 22h7a1.5 1.5 0 0 0 1.5-1.5L18 6" />
      <line x1="10" y1="10.5" x2="10" y2="17" />
      <line x1="14" y1="10.5" x2="14" y2="17" />
    </svg>
  )
}

export function IconEdit({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5.5 16.5z" />
      <line x1="14" y1="6" x2="18" y2="10" />
    </svg>
  )
}

export function IconSun({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <line x1="12" y1="1.5" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22.5" />
      <line x1="1.5" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22.5" y2="12" />
      <line x1="4.5" y1="4.5" x2="6.2" y2="6.2" />
      <line x1="17.8" y1="17.8" x2="19.5" y2="19.5" />
      <line x1="4.5" y1="19.5" x2="6.2" y2="17.8" />
      <line x1="17.8" y1="6.2" x2="19.5" y2="4.5" />
    </svg>
  )
}

export function IconChevronDown({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <polyline points="5 8.5 12 15.5 19 8.5" />
    </svg>
  )
}

export function IconChevronLeft({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <polyline points="15 5 8 12 15 19" />
    </svg>
  )
}

export function IconChevronRight({ size = 22, className }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <polyline points="9 5 16 12 9 19" />
    </svg>
  )
}
