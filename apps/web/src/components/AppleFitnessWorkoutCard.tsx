import type { ImportedWorkout, UserSession } from '@gym-pilot/shared';
import { useNavigate } from 'react-router-dom';
import { formatDateTimeForDisplay } from '../dateTimeFormatter';
import { SessionEntryCard } from './session-history/SessionEntryCard';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import { resolveWorkoutLinkState } from './workoutCalendarUtils';

type CalendarValue = Date | null

type AppleFitnessWorkoutCardProps = {
  workout: ImportedWorkout
  className?: string
  linkedSession?: UserSession
  onClick?: (workout: ImportedWorkout) => void
  onUnlink?: (workout: ImportedWorkout) => void
  onNoLink?: (workout: ImportedWorkout) => void
  showLinkButton?: boolean
  selectedDate?: CalendarValue
}

export const AppleFitnessWorkoutCard = ({
  workout,
  className,
  linkedSession,
  onClick,
  onUnlink,
  onNoLink,
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

  const linkState = resolveWorkoutLinkState(workout.session_id)
  const showActions = showLinkButton

  return (
    <Panel
      onClick={() => onClick?.(workout)}
      className={`shadow hover:shadow-md transition-shadow cursor-pointer ${className ?? ''}`}
      padding="md"
      variant="muted"
    >
      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
        {workout.display_name}
      </div>
      <div className="text-m font-semibold text-slate-600 dark:text-slate-100">
        {(workout.energy ?? 0).toFixed(0)} {workout.energy_unit ?? ''}
      </div>
      <div className="text-m text-slate-600 dark:text-slate-400 mt-2">
        <p>
          {formatDateTimeForDisplay(workout.start_date)}
          <span className="ml-2" />({(workout.duration / 60).toFixed(0)}{' '}
          minutes)
        </p>
      </div>

      {showActions && (
        <div className="mt-4">
          {linkState === 'no-link' ? (
            <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              No link
            </div>
          ) : null}

          {linkedSession ? (
            <>
              <SessionEntryCard
                entry={linkedSession}
                showEditButton
                extendedDetails={true}
              />
              <Button
                tone="emerald"
                className="mt-2 mr-2"
                onClick={handleUnlinkClick}
              >
                Unlink
              </Button>
              {linkState === 'no-link' ? null : (
                <Button
                  tone="blue"
                  className="mt-2"
                  onClick={() => onNoLink?.(workout)}
                >
                  No Link
                </Button>
              )}
            </>
          ) : (
            <>
              {linkState === 'no-link' ? (
                <Button
                  tone="emerald"
                  className="mt-4"
                  onClick={handleLinkClick}
                >
                  Link
                </Button>
              ) : (
                <>
                  <Button
                    tone="emerald"
                    className="mt-4 mr-2"
                    onClick={handleLinkClick}
                  >
                    Link
                  </Button>
                  <Button
                    tone="blue"
                    className="mt-2"
                    onClick={() => onNoLink?.(workout)}
                  >
                    No Link
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </Panel>
  )
}
