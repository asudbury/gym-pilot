/* eslint-disable prettier/prettier */
export const CalendarIcon = ({ className }: { className?: string }) => (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <rect
          x="4"
          y="5"
          width="16"
          height="15"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M4 10h16M8 3v4M16 3v4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
)