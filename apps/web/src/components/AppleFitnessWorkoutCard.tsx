import type { ImportedWorkout, UserSession } from '@gym-pilot/shared'
import { Panel } from './ui/Panel'
import { Button } from './ui/Button'
import { useNavigate } from 'react-router-dom'
import { SessionEntryCard } from './session-history/SessionEntryCard'

type CalendarValue = Date | null

type AppleFitnessWorkoutCardProps = {
  workout: ImportedWorkout
  linkedSession?: UserSession
  onClick?: (workout: ImportedWorkout) => void
  onUnlink?: (workout: ImportedWorkout) => void
  showLinkButton?: boolean
  selectedDate?: CalendarValue
}

export const AppleFitnessWorkoutCard = ({
  workout,
  linkedSession,
  onClick,
  onUnlink,
  showLinkButton = true,
  selectedDate,
}: AppleFitnessWorkoutCardProps) => {
  const navigate = useNavigate()

  const handleLinkClick = () => {
    let backDate: string | undefined
    if (selectedDate) {
      const date = new Date(selectedDate)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      backDate = `${year}-${month}-${day}`
    }

    const searchParams = backDate ? `?back_date=${backDate}` : ''
    navigate(`/apple-fitness/link-workout/${workout.id}${searchParams}`)
  }

  const handleUnlinkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUnlink?.(workout)
  }

  const getDayWithSuffix = (day: number): string => {
    if (day > 3 && day < 21) return day + 'th'
    switch (day % 10) {
      case 1:
        return day + 'st'
      case 2:
        return day + 'nd'
      case 3:
        return day + 'rd'
      default:
        return day + 'th'
    }
  }

  const date = new Date(workout.start_date)
  const weekday = date.toLocaleString('en-US', { weekday: 'short' })
  const month = date.toLocaleString('en-US', { month: 'short' })
  const dayOfMonth = getDayWithSuffix(date.getDate())
  const hour = date.toLocaleString('en-US', {
    hour: '2-digit',
    hourCycle: 'h23',
  })
  const minute = date.toLocaleString('en-US', {
    minute: '2-digit',
  })

  return (
    <Panel
      onClick={() => onClick?.(workout)}
      className="shadow hover:shadow-md transition-shadow cursor-pointer"
      padding="md"
      variant="muted"
    >
      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
        {workout.display_name}
      </div>
      <div className="text-m font-semibold text-slate-600 dark:text-slate-100">
        {workout.energy.toFixed(0)} {workout.energy_unit}
      </div>
      <div className="text-m text-slate-600 dark:text-slate-400 mt-2">
        <p>
          {`${weekday} ${month} ${dayOfMonth} at ${hour}:${minute}`}
          <span className="ml-2" />({(workout.duration / 60).toFixed(0)}{' '}
          minutes)
        </p>
      </div>

      {showLinkButton &&
        (linkedSession ? (
          <div className="mt-4">
            <SessionEntryCard entry={linkedSession} />
            <Button tone="blue" className="mt-2" onClick={handleUnlinkClick}>
              Unlink
            </Button>
          </div>
        ) : (
          <Button tone="blue" className="mt-4" onClick={handleLinkClick}>
            Link
          </Button>
        ))}
    </Panel>
  )
}
