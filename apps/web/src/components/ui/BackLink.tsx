import { DecorativeIcon } from './DecorativeIcon'
import { Link } from 'react-router-dom'
import { getToneClass } from '../../components/toneClasses'

type BackLinkProps = {
  to: string
  label?: string
  className?: string
  variant?: 'button' | 'inline'
}

function formatBackLabel(label: string | undefined) {
  if (!label) return label || ''
  const parts = label.split(' ')
  if (
    parts.length >= 3 &&
    parts[0].toLowerCase() === 'back' &&
    parts[1].toLowerCase() === 'to'
  ) {
    parts[2] = parts[2].charAt(0).toUpperCase() + parts[2].slice(1)
    return parts.join(' ')
  }

  return label
}

export function BackLink({
  to,
  label = 'Back to admin',
  className = '',
  variant = 'button',
}: BackLinkProps) {
  const content = (
    <span className="flex items-center gap-2">
      <DecorativeIcon icon="back" className="h-4 w-4" />
      <span>{formatBackLabel(label)}</span>
    </span>
  )

  if (variant === 'inline') {
    return (
      <Link to={to} className={className || 'inline-flex items-center gap-2'}>
        {content}
      </Link>
    )
  }

  return (
    <Link
      to={to}
      className={getToneClass(
        'default',
        className || 'px-4 py-2 text-sm font-medium',
      )}
    >
      {content}
    </Link>
  )
}

export default BackLink
