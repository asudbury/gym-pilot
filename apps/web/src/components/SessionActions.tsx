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
  if (!showActions) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {showClassSessionAction ? (
        <ActionButton
          icon="calendar"
          label="Record a Class session"
          mobileLabel="Record a Class"
          tone="emerald"
          to="/timetable?prefill=class"
        />
      ) : null}

      {showPTSessionAction ? (
        <ActionButton
          icon="users"
          label="Record a PT session"
          mobileLabel="Record a PT"
          tone="emerald"
          to="/record-session?type=personal_training"
        />
      ) : null}

      <ActionButton
        icon="dumbbell"
        label="Record a Solo session"
        mobileLabel="Record a Solo"
        tone="emerald"
        to="/record-session?type=solo"
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
