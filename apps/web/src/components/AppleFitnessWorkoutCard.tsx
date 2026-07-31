import type { ImportedWorkout } from '@gym-pilot/shared'
import { Panel } from './ui/Panel'
import { Button } from './ui/Button'
import { useNavigate } from 'react-router-dom'

type AppleFitnessWorkoutCardProps = {
  workout: ImportedWorkout
  onClick?: (workout: ImportedWorkout) => void
  showLinkButton?: boolean
}

export const AppleFitnessWorkoutCard = ({
  workout,
  onClick,
  showLinkButton = true,
}: AppleFitnessWorkoutCardProps) => {
  const navigate = useNavigate()

  const handleLinkClick = () => {
    navigate(`/apple-fitness/link-workout/${workout.id}`)
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

      {showLinkButton && (
        <Button tone="blue" className="mt-4" onClick={handleLinkClick}>
          Link
        </Button>
      )}
    </Panel>
  )
}
