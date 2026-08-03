import ActionButton from './ui/ActionButton'

type RecordButtonsProps = {
  showClassSessionAction?: boolean
  showPTSessionAction?: boolean
  recordText?: string
}

function RecordButtons({
  showClassSessionAction = true,
  showPTSessionAction = true,
  recordText = 'Record a',
}: RecordButtonsProps) {
  return (
    <>
      {showClassSessionAction ? (
        <ActionButton
          icon="calendar"
          label={`${recordText} Class session`}
          mobileLabel={`${recordText} Class`}
          tone="emerald"
          to="/timetable?prefill=class"
        />
      ) : null}

      {showPTSessionAction ? (
        <ActionButton
          icon="users"
          label={`${recordText} PT session`}
          mobileLabel={`${recordText} PT`}
          tone="emerald"
          to="/record-session?type=personal_training"
        />
      ) : null}

      <ActionButton
        icon="dumbbell"
        label={`${recordText} Solo session`}
        mobileLabel={`${recordText} Solo`}
        tone="emerald"
        to="/record-session?type=solo"
      />
    </>
  )
}

export default RecordButtons
