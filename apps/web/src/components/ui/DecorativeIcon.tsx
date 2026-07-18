export type DecorativeIconProps = {
  icon?:
    | 'spark'
    | 'dumbbell'
    | 'search'
    | 'chart'
    | 'lock'
    | 'grid'
    | 'heart'
    | 'clipboard'
    | 'shield'
    | 'calendar'
    | 'help'
    | 'users'
    | 'database'
    | 'settings'
    | 'key'
    | 'user'
  className?: string
}

const baseClasses =
  'flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200'

export function DecorativeIcon({
  icon = 'spark',
  className = '',
}: DecorativeIconProps) {
  const iconClassName = 'h-5 w-5'

  const iconMarkup = {
    spark: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path
          d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.5 16.5L20 18l-1.5 1.5L19 20"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    dumbbell: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path
          d="M7 8.5h2.5v7H7a1.5 1.5 0 0 1 0-3V8.5Zm9.5 0H14v7h2.5a1.5 1.5 0 0 0 0-3V8.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 10.5h5M9.5 13.5h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M6 9.5V14M18 9.5V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m15 15 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    chart: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path d="M5 18V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 18V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M19 18v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    grid: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <rect x="4" y="4" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="4" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="14" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="14" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
    heart: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path d="M12 20s-6.5-4.2-8.3-8.2A4.8 4.8 0 0 1 8.2 5c1.4 0 2.7.7 3.5 1.8A4.8 4.8 0 0 1 15.3 5c2.6 0 4.7 2.1 4.7 4.7 0 1.6-.6 3-1.7 4.1C18.5 15.8 12 20 12 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    clipboard: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <rect x="7" y="4" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 7h4M10 11h4M10 15h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    shield: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path d="M12 4 5.4 6.5v4.4c0 4.4 2.6 7.6 6.6 8.9 4-1.3 6.6-4.5 6.6-8.9V6.5L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9.6 12.1 11.1 13.6 14.4 10.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    calendar: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 10h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    help: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9.8 9.8a2.7 2.7 0 0 1 4.8 1.4c0 1.5-1.4 2.2-2.2 2.8-.4.3-.6.8-.6 1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
      </svg>
    ),
    users: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path d="M8.5 11.2a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 18c0-2.2 2-4 4.5-4s4.5 1.8 4.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M15.5 11.2a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M13 18c0-1.6 1.3-2.9 3-2.9s3 1.3 3 2.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    database: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <ellipse cx="12" cy="6" rx="6" ry="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6 6v6c0 1.7 2.7 3 6 3s6-1.3 6-3V6" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6 12v6c0 1.7 2.7 3 6 3s6-1.3 6-3v-6" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
    settings: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path d="M10.3 4.7 9 3.5a1 1 0 0 0-1.4 0L6.8 4.3a1 1 0 0 0-.3.8v2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M13.7 19.3 15 20.5a1 1 0 0 0 1.4 0l.8-.8a1 1 0 0 0 .3-.8v-2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 12h2.5M17.5 12H20M12 4v2.5M12 17.5V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    key: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <circle cx="8.5" cy="14.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m11.5 11.5 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m16 7 1.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    user: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5.5 18c0-3 2.9-5.5 6.5-5.5s6.5 2.5 6.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    lock: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 14v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  }[icon]

  return (
    <div className={`${baseClasses} ${className}`.trim()} aria-hidden="true">
      {iconMarkup}
    </div>
  )
}
