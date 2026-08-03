import ActionButton from './ui/ActionButton'
import RecordButtons from './RecordButtons'

type SessionActionsProps = {
  showViewSessionsButton?: boolean
  showViewWorkoutsTemplateButton?: boolean
  showActions?: boolean
  showClassSessionAction?: boolean
  showPTSessionAction?: boolean
  recordText?: string
}

function SessionActions({
  showViewSessionsButton = true,
  showViewWorkoutsTemplateButton = true,
  showActions = true,
  showClassSessionAction = true,
  showPTSessionAction = true,
  recordText,
}: SessionActionsProps) {
  if (!showActions) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 px-4 sm:flex-row sm:flex-wrap">
      <ActionButton
        icon="apple"
        label="Apple Fitness"
        mobileLabel="Apple Fitness"
        tone="default"
        to="/apple-fitness"
      />

      <RecordButtons
        showClassSessionAction={showClassSessionAction}
        showPTSessionAction={showPTSessionAction}
        recordText={recordText}
      />

      {showViewSessionsButton ? (
        <ActionButton
          icon="tasks"
          label="View sessions"
          mobileLabel="View sessions"
          tone="default"
          to="/sessions"
        />
      ) : null}

      {showViewWorkoutsTemplateButton ? (
        <ActionButton
          icon="clipboard"
          label="Workout templates"
          mobileLabel="Workout templates"
          tone="default"
          to="/session-templates"
        />
      ) : null}
    </div>
  )
}

export default SessionActions
