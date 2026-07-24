import { useNavigate } from 'react-router-dom'
import ActionButton from './ui/ActionButton'

type SessionActionsProps = {
  showViewSessionsButton?: boolean
  showViewWorkoutsTemplateButton?: boolean
  showActions?: boolean
  showClassSessionAction?: boolean
  showPTSessionAction?: boolean
}

function SessionActions({
  showViewSessionsButton = true,
  showViewWorkoutsTemplateButton = true,
  showActions = true,
  showClassSessionAction = true,
  showPTSessionAction = true,
}: SessionActionsProps) {
  const navigate = useNavigate()

  if (!showActions) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {showClassSessionAction ? (
        <ActionButton
          icon="calendar"
          label="Record a Class session"
          tone="emerald"
          onClick={() => navigate('/timetable?prefill=class')}
        />
      ) : null}

      {showPTSessionAction ? (
        <ActionButton
          icon="users"
          label="Record a PT session"
          tone="emerald"
          onClick={() => navigate('/record-session?type=personal_training')}
        />
      ) : null}

      <ActionButton
        icon="dumbbell"
        label="Record a Solo session"
        tone="emerald"
        onClick={() => navigate('/record-session?type=solo')}
      />

      {showViewSessionsButton ? (
        <ActionButton
          icon="tasks"
          label="View sessions"
          tone="default"
          onClick={() => navigate('/sessions')}
        />
      ) : null}

      {showViewWorkoutsTemplateButton ? (
        <ActionButton
          icon="clipboard"
          label="View workout templates"
          tone="default"
          onClick={() => navigate('/session-templates')}
        />
      ) : null}
    </div>
  )
}

export default SessionActions
