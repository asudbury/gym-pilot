import { useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { saveTimetableAttendance } from '@gym-pilot/shared'
import { useAuth } from '../auth/AuthContext'
import { PageLayout } from '../layouts/PageLayout'
import { PageCardLayout } from '../layouts/PageCardLayout'
import {
  formatTimetableDateLabel,
  formatTimetableTimeLabel,
  isPastTimetableSession,
  resolveTimetableAttendanceAction,
  type TimetableSession,
} from '../features/timetable/domain/timetableView'

export function RecordAttendancePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const savingRef = useRef(false)

  // Retrieve the session object passed from navigation state
  const state = location.state as { session?: TimetableSession } | null
  const session = state?.session

  const [attendanceNotes, setAttendanceNotes] = useState('')
  const [attendanceRating, setAttendanceRating] = useState<number | null>(null)
  const [attendanceSaving, setAttendanceSaving] = useState(false)
  const [attendanceMessage, setAttendanceMessage] = useState<string | null>(
    null,
  )

  const attendanceAction = useMemo(
    () => resolveTimetableAttendanceAction(user?.role, user?.roles),
    [user?.role, user?.roles],
  )

  const [attendanceSelection, setAttendanceSelection] = useState<
    'attended' | 'taught' | null
  >(attendanceAction.options.length > 1 ? null : attendanceAction.kind)

  // Redirect back to timetable if no session state is provided
  if (!session) {
    return <Navigate to="/timetable" replace />
  }

  const handleAttendanceSubmit = async () => {
    if (attendanceSaving || savingRef.current) {
      return
    }

    const attendanceKind = attendanceSelection ?? attendanceAction.kind

    if (!attendanceKind) {
      setAttendanceMessage('Choose whether you attended or taught this class.')
      return
    }

    savingRef.current = true
    setAttendanceSaving(true)
    setAttendanceMessage(null)

    try {
      const attendanceKey =
        session.id ??
        `${session.classId ?? 'unknown'}-${session.startTime ?? 'unknown'}`

      const result = await saveTimetableAttendance({
        sessionId: session.id,
        classId: session.classId,
        className: session.className,
        instructorName:
          session.instructorName != null
            ? String(session.instructorName)
            : session.instructorId != null
              ? String(session.instructorId)
              : null,
        startedAt: session.startTime,
        attendanceType: attendanceKind,
        notes: attendanceNotes,
        rating: attendanceRating,
        userId: user?.id,
      })

      if (result.success) {
        // Sync timetable page local storage mapping
        try {
          const stored = localStorage.getItem('gym-pilot.timetable-attendance')
          const current = stored ? JSON.parse(stored) : {}
          current[attendanceKey] = attendanceKind
          localStorage.setItem(
            'gym-pilot.timetable-attendance',
            JSON.stringify(current),
          )
        } catch (err) {
          // Non-blocking log
          console.error('[Supabase] Could not sync local attendance cache', err)
        }

        navigate('/attendance-history', { replace: true })
      } else {
        setAttendanceMessage(
          result.error?.message ?? 'Could not save attendance.',
        )
      }
    } catch (err: any) {
      setAttendanceMessage(err?.message ?? 'An unexpected error occurred.')
    } finally {
      savingRef.current = false
      setAttendanceSaving(false)
    }
  }

  return (
    <PageLayout className="max-w-6xl">
      <PageCardLayout
        title="Timetable"
        subtitle="Confirm attendance"
        description={
          attendanceAction.options.length > 1
            ? 'Choose how this class should be recorded and add any notes.'
            : 'Record your attendance for this class and add any notes.'
        }
        icon="calendar"
      >
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {session.className ?? `Class ${session.classId ?? 'Unknown'}`}
                </p>
                <p className="text-sm text-slate-600">
                  {session.room ?? 'Room TBD'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {isPastTimetableSession(session) ? (
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                    Ended
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${session.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : session.status === 'Waitlist' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {session.status ?? 'Unknown'}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-700">Day:</span>{' '}
                {formatTimetableDateLabel(session.startTime)}
              </p>
              <p>
                <span className="font-medium text-slate-700">Time:</span>{' '}
                {formatTimetableTimeLabel(session.startTime)} –{' '}
                {formatTimetableTimeLabel(session.endTime)}
              </p>
              <p>
                <span className="font-medium text-slate-700">Instructor:</span>{' '}
                {session.instructorName ?? session.instructorId ?? 'TBC'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-4">
              {attendanceAction.options.length > 1 ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Role
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {attendanceAction.options.map((option) => {
                      const isSelected = attendanceSelection === option.kind
                      return (
                        <button
                          key={option.kind}
                          type="button"
                          onClick={() => setAttendanceSelection(option.kind)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${isSelected ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Rating
                </span>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const isSelected = attendanceRating === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAttendanceRating(value)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${isSelected ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        {value} / 5
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-medium">Notes</span>
                <textarea
                  value={attendanceNotes}
                  onChange={(event) => setAttendanceNotes(event.target.value)}
                  rows={4}
                  className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                  placeholder="Add any details about the class"
                />
              </label>

              {attendanceMessage ? (
                <p className="text-sm text-rose-600">{attendanceMessage}</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAttendanceSubmit}
                  disabled={attendanceSaving}
                  className="rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-emerald-300 disabled:bg-emerald-300 disabled:text-emerald-950"
                >
                  {attendanceSaving ? 'Saving…' : 'Record attendance'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/timetable')}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}
