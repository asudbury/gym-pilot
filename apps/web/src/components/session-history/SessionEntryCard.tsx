import type { UserSession } from '@gym-pilot/shared'
import { useNavigate } from 'react-router-dom'
import { DecorativeIcon } from '../ui/DecorativeIcon'
import {
  getSessionEntryRating,
  getSessionEntryTitle,
} from '../../features/session-history/domain/sessionHistoryViewModel'
import { Button } from '../ui/Button'

function formatAttendanceDate(value?: string | null) {
  if (!value) {
    return 'Unknown date'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString()
}

type SessionEntryCardProps = {
  entry: UserSession
  pendingDeleteEntryId?: string | null
  setPendingDeleteEntryId?: (id: string | null) => void
  deleteEntry?: (entryId: string) => void
  onSelect?: (sessionId: string) => void
  selected?: boolean
  onCardClick?: (sessionId: string) => void
  showEditButton?: boolean
}

export function SessionEntryCard({
  entry,
  pendingDeleteEntryId,
  setPendingDeleteEntryId,
  deleteEntry,
  onSelect,
  selected,
  onCardClick,
  children,
  showEditButton = false,
}: SessionEntryCardProps & { children?: React.ReactNode }) {
  const navigate = useNavigate()

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(entry.id)
    } else if (onSelect) {
      onSelect(entry.id)
    } else {
      navigate(`/sessions/${entry.id}/edit`)
    }
  }

  return (
    <div
      key={entry.id}
      className={`m-0 bg-white p-0 sm:m-4 sm:rounded-2xl sm:border sm:border-slate-200 sm:p-4 shadow-sm ${selected ? 'ring-2 ring-indigo-500' : ''} ${onCardClick || onSelect ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center">
          {onSelect && (
            <input
              type="radio"
              name="session-selection"
              id={`session-${entry.id}`}
              checked={selected}
              onChange={() => onSelect(entry.id)}
              className="mr-4 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
          )}
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900">
              {getSessionEntryTitle(entry)}
            </p>
            {(() => {
              const roleLabel =
                entry.attendance_type === 'taught'
                  ? 'Taught'
                  : entry.attendance_type === 'attended'
                    ? 'Attended'
                    : null

              return roleLabel ? (
                <p className="text-sm text-slate-600">{roleLabel}</p>
              ) : null
            })()}
            {entry.trainer_name ? (
              <p className="text-sm text-slate-600">
                Instructor: {entry.trainer_name}
              </p>
            ) : null}
            <p className="text-sm text-slate-600">
              {formatAttendanceDate(entry.start_at)}
            </p>
            {entry.notes ? (
              <p className="text-sm text-slate-600">{entry.notes}</p>
            ) : null}
            {entry.duration_minutes != null ? (
              <p className="text-sm text-slate-600">
                Duration: {entry.duration_minutes} min
              </p>
            ) : null}
            {(() => {
              const rating = getSessionEntryRating(entry)
              return rating != null ? (
                <p className="text-sm text-slate-600">Rating: {rating} / 5</p>
              ) : null
            })()}
          </div>
        </div>
        {showEditButton && (
          <Button>Edit</Button>
        )}
        {deleteEntry && (
          <div className="flex flex-wrap gap-2">
            {pendingDeleteEntryId !== entry.id ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/sessions/${entry.id}/edit`)
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:font-semibold hover:shadow-sm"
              >
                <DecorativeIcon icon="edit" className="h-4 w-4" />
                <span>Edit</span>
              </button>
            ) : null}
            {pendingDeleteEntryId === entry.id ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPendingDeleteEntryId?.(null)
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:font-semibold hover:shadow-sm"
                >
                  <DecorativeIcon icon="close" className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteEntry(entry.id)
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-600 bg-rose-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:border-rose-700 hover:bg-rose-700 hover:font-semibold"
                >
                  <DecorativeIcon icon="check" className="h-4 w-4" />
                  <span>Confirm</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteEntry(entry.id)
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition-all duration-200 hover:border-rose-400 hover:bg-rose-100 hover:font-semibold hover:shadow-sm"
              >
                <DecorativeIcon icon="trash" className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
