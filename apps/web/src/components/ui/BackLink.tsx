import { Link, useNavigate } from 'react-router-dom';
import { getToneClass } from '../../components/toneClasses';
import { DecorativeIcon } from './DecorativeIcon';
type BackLinkProps = {
  to?: string
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
  label = 'Back',
  className = '',
  variant = 'button',
}: BackLinkProps) {
  const navigate = useNavigate()

  const content = (
    <span className="flex items-center gap-2">
      <DecorativeIcon icon="back" className="h-4 w-4" />
      <span>{formatBackLabel(label)}</span>
    </span>
  )

  if (variant === 'inline') {
    if (!to) {
      return (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={className || 'inline-flex items-center gap-2'}
        >
          {content}
        </button>
      )
    }

    return (
      <Link to={to} className={className || 'inline-flex items-center gap-2'}>
        {content}
      </Link>
    )
  }

  if (!to) {
    return (
      <button
        type="button"
        onClick={() => navigate(-1)}
        className={getToneClass(
          'default',
          className || 'px-4 py-2 text-sm font-medium',
        )}
      >
        {content}
      </button>
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