import { useNavigate } from 'react-router-dom'
import { Button } from './Button'
import { DecorativeIcon } from './ui/DecorativeIcon'

type SessionActionsProps = {
  includeViewSessionsButton?: boolean
  showActions?: boolean
  showClassSessionAction?: boolean
  showPTSessionAction?: boolean
}

function SessionActions({
  includeViewSessionsButton = false,
  showActions = true,
  showClassSessionAction = true,
  showPTSessionAction = true,
}: SessionActionsProps) {
  const navigate = useNavigate()

  const buttonClass =
    'w-full min-h-12 px-4 text-base sm:w-auto sm:min-h-0 sm:px-3 sm:text-sm'

  const iconClass = 'h-5 w-5 sm:h-4 sm:w-4'

  if (!showActions) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {showClassSessionAction ? (
        <Button
          className={buttonClass}
          tone="emerald"
          onClick={() => navigate('/timetable?prefill=class')}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <DecorativeIcon icon="calendar" className={iconClass} />
            <span>Record a Class session</span>
          </span>
        </Button>
      ) : null}

      {showPTSessionAction ? (
        <Button
          className={buttonClass}
          tone="emerald"
          onClick={() => navigate('/record-session?type=personal_training')}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <DecorativeIcon icon="users" className={iconClass} />
            <span>Record a PT session</span>
          </span>
        </Button>
      ) : null}

      <Button
        className={buttonClass}
        tone="emerald"
        onClick={() => navigate('/record-session?type=solo')}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <DecorativeIcon icon="dumbbell" className={iconClass} />
          <span>Record a Solo session</span>
        </span>
      </Button>

      {includeViewSessionsButton ? (
        <Button
          className={buttonClass}
          tone="default"
          onClick={() => navigate('/sessions')}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <DecorativeIcon icon="tasks" className={iconClass} />
            <span>View sessions</span>
          </span>
        </Button>
      ) : null}
    </div>
  )
}

export default SessionActions
