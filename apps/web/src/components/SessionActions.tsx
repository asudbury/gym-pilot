import { useNavigate } from 'react-router-dom'
import { Button } from './Button'
import { DecorativeIcon } from './ui/DecorativeIcon'

type SessionActionsProps = {
  includeViewSessionsButton?: boolean
}

export function SessionActions({
  includeViewSessionsButton = false,
}: SessionActionsProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        tone="emerald"
        onClick={() => navigate('/timetable?prefill=class')}
      >
        <div className="inline-flex items-center gap-2">
          <DecorativeIcon icon="calendar" className="h-4 w-4" />
          <span>Class session</span>
        </div>
      </Button>

      <Button
        tone="emerald"
        onClick={() => navigate('/record-session?type=personal_training')}
      >
        <div className="inline-flex items-center gap-2">
          <DecorativeIcon icon="users" className="h-4 w-4" />
          <span>Record a PT session</span>
        </div>
      </Button>

      <Button
        tone="emerald"
        onClick={() => navigate('/record-session?type=solo')}
      >
        <div className="inline-flex items-center gap-2">
          <DecorativeIcon icon="dumbbell" className="h-4 w-4" />
          <span>Record a Solo session</span>
        </div>
      </Button>

      {includeViewSessionsButton ? (
        <Button tone="default" onClick={() => navigate('/sessions')}>
          <div className="inline-flex items-center gap-2">
            <DecorativeIcon icon="tasks" className="h-4 w-4" />
            <span>View sessions</span>
          </div>
        </Button>
      ) : null}
    </div>
  )
}

export default SessionActions
