import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveTimetableAttendance } from '@gym-pilot/shared'
import { useAuth } from '../auth/AuthContext'
import { PageLayout } from '../layouts/PageLayout'
import { PageCardLayout } from '../layouts/PageCardLayout'
import { loadVirginActiveClubs } from '../utils/virginActiveClubs'
import {
  formatTimetableAvailability,
  formatTimetableDateLabel,
  formatTimetableTimeLabel,
  isPastTimetableSession,
  resolveNextActiveDayKey,
  resolveTimetableAttendanceAction,
  resolveTimetableHeaderViewModel,
  resolveTimetableViewModel,
  type TimetableSession,
} from '../features/timetable/domain/timetableView'

const TIMETABLE_ENDPOINT =
  'https://czasc5rowjxovhkdbd6p6jdtky0hnqas.lambda-url.eu-west-2.on.aws/'
const timetableCache = new Map<string, Promise<TimetableSession[]>>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function parseSession(value: unknown): TimetableSession | null {
  if (!isRecord(value)) {
    return null
  }

  const parseIdentifier = (candidate: unknown) => {
    if (typeof candidate === 'number' || typeof candidate === 'string') {
      return candidate
    }

    return undefined
  }

  const parseNumber = (candidate: unknown): number | null => {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate
    }

    if (typeof candidate === 'string' && candidate.trim() !== '') {
      const parsed = Number(candidate)
      return Number.isFinite(parsed) ? parsed : null
    }

    return null
  }

  return {
    id: parseIdentifier(value.id),
    classId: parseIdentifier(value.classId),
    room: typeof value.room === 'string' ? value.room : null,
    status: typeof value.status === 'string' ? value.status : null,
    instructorId: parseIdentifier(value.instructorId) ?? null,
    capacity: parseNumber(value.capacity),
    booked: parseNumber(value.booked),
    waitlistCapacity: parseNumber(value.waitlistCapacity),
    waitlistCount: parseNumber(value.waitlistCount),
    startTime: typeof value.startTime === 'string' ? value.startTime : null,
    endTime: typeof value.endTime === 'string' ? value.endTime : null,
  }
}

function buildInstructorLookup(payload: unknown): Record<string, string> {
  if (!isRecord(payload)) {
    return {}
  }

  const candidate = isRecord(payload.data) ? payload.data : payload
  const instructors = Array.isArray(candidate.instructors)
    ? candidate.instructors
    : []

  return instructors.reduce<Record<string, string>>((lookup, item) => {
    if (!isRecord(item)) {
      return lookup
    }

    const instructorId =
      typeof item.id === 'number' || typeof item.id === 'string'
        ? String(item.id)
        : null
    const instructorName = typeof item.name === 'string' ? item.name : null

    if (instructorId && instructorName) {
      lookup[instructorId] = instructorName
    }

    return lookup
  }, {})
}

function buildClassLookup(payload: unknown): Record<string, string> {
  if (!isRecord(payload)) {
    return {}
  }

  const candidate = isRecord(payload.data) ? payload.data : payload
  const classes = Array.isArray(candidate.classes) ? candidate.classes : []

  return classes.reduce<Record<string, string>>((lookup, item) => {
    if (!isRecord(item)) {
      return lookup
    }

    const classId =
      typeof item.id === 'number' || typeof item.id === 'string'
        ? String(item.id)
        : null
    const className = typeof item.name === 'string' ? item.name : null

    if (classId && className) {
      lookup[classId] = className
    }

    return lookup
  }, {})
}

function normalizeSessions(payload: unknown): TimetableSession[] {
  if (Array.isArray(payload)) {
    return payload
      .map(parseSession)
      .filter((session): session is TimetableSession => Boolean(session))
  }

  if (isRecord(payload)) {
    const candidate = payload as Record<string, unknown>

    for (const key of ['sessions', 'items', 'classTimes']) {
      const nested = candidate[key]
      if (Array.isArray(nested)) {
        return normalizeSessions(nested)
      }
    }

    if (isRecord(candidate.data)) {
      return normalizeSessions(candidate.data)
    }
  }

  return []
}

export function TimetablePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const savingRef = useRef(false)
  const [sessions, setSessions] = useState<TimetableSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeDayKey, setActiveDayKey] = useState('')
  const [activeInstructor, setActiveInstructor] = useState('all')
  const [activeClassName, setActiveClassName] = useState('all')
  const [resolvedClubName, setResolvedClubName] = useState<string | null>(null)
  const [attendanceState, setAttendanceState] = useState<
    Record<string, 'attended' | 'taught'>
  >({})
  const [attendancePendingSession, setAttendancePendingSession] =
    useState<TimetableSession | null>(null)
  const [attendanceNotes, setAttendanceNotes] = useState('')
  const [attendanceRating, setAttendanceRating] = useState<number | null>(null)
  const [attendanceSaving, setAttendanceSaving] = useState(false)
  const [attendanceMessage, setAttendanceMessage] = useState<string | null>(
    null,
  )
  const [attendanceSelection, setAttendanceSelection] = useState<
    'attended' | 'taught' | null
  >(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null)

  const rawGymBrand = user?.gymBrand?.trim() ?? ''
  const rawGymName = user?.gymName?.trim() ?? ''
  const isVirginBrand = rawGymBrand.toLowerCase() === 'virgin'
  const headerViewModel = useMemo(
    () =>
      resolveTimetableHeaderViewModel({
        gymBrand: rawGymBrand,
        gymName: rawGymName,
        resolvedClubName,
      }),
    [rawGymBrand, rawGymName, resolvedClubName],
  )

  const clubId = useMemo(() => {
    const storedClubId = user?.gymName?.trim() ?? ''
    return /^\d+$/.test(storedClubId) ? storedClubId : null
  }, [user?.gymName])

  const attendanceAction = useMemo(
    () => resolveTimetableAttendanceAction(user?.role, user?.roles),
    [user?.role, user?.roles],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storedAttendance = window.localStorage.getItem(
        'gym-pilot.timetable-attendance',
      )

      if (!storedAttendance) {
        return
      }

      const parsedAttendance = JSON.parse(storedAttendance) as Record<
        string,
        'attended' | 'taught'
      >

      if (parsedAttendance && typeof parsedAttendance === 'object') {
        setAttendanceState(parsedAttendance)
      }
    } catch {
      // Ignore invalid stored attendance state.
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      'gym-pilot.timetable-attendance',
      JSON.stringify(attendanceState),
    )
  }, [attendanceState])

  useEffect(() => {
    let cancelled = false

    if (!isVirginBrand || !/^\d+$/.test(rawGymName)) {
      setResolvedClubName(null)
      return () => {
        cancelled = true
      }
    }

    void loadVirginActiveClubs().then((clubs) => {
      if (cancelled) {
        return
      }

      const matchingClub = clubs.find(
        (club) => String(club.clubId) === rawGymName,
      )
      setResolvedClubName(matchingClub?.name ?? rawGymName)
    })

    return () => {
      cancelled = true
    }
  }, [isVirginBrand, rawGymName])

  useEffect(() => {
    let cancelled = false

    if (!clubId) {
      setSessions([])
      setIsLoading(false)
      setErrorMessage(null)
      setActiveInstructor('all')
      setActiveClassName('all')
      return () => {
        cancelled = true
      }
    }

    const activeClubId = clubId

    async function loadTimetable() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const timetableUrl = new URL(TIMETABLE_ENDPOINT)
        timetableUrl.searchParams.set('clubid', activeClubId)

        const cachedRequest = timetableCache.get(activeClubId)
        const request =
          cachedRequest ??
          (async () => {
            const response = await fetch(timetableUrl.toString(), {
              headers: {
                Accept: 'application/json',
              },
            })

            if (!response.ok) {
              throw new Error(`Request failed with status ${response.status}`)
            }

            const payload = await response.json()
            const instructorLookup = buildInstructorLookup(payload)
            const classLookup = buildClassLookup(payload)

            return normalizeSessions(payload).map((session) => {
              const instructorId =
                session.instructorId == null
                  ? null
                  : String(session.instructorId)
              const instructorName = instructorId
                ? (instructorLookup[instructorId] ?? null)
                : null
              const classId =
                session.classId == null ? null : String(session.classId)
              const className = classId ? (classLookup[classId] ?? null) : null

              return {
                ...session,
                className: className ?? session.className ?? null,
                instructorName:
                  instructorName ?? session.instructorName ?? null,
              }
            })
          })()

        if (!cachedRequest) {
          timetableCache.set(activeClubId, request)
        }

        const nextSessions = await request

        if (!cancelled) {
          setSessions(nextSessions)
          setActiveInstructor('all')
          setActiveClassName('all')
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Could not load the timetable right now.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadTimetable()

    return () => {
      cancelled = true
    }
  }, [clubId, refreshVersion])

  const { groupedSessions, instructorOptions, classOptions, visibleSessions } =
    useMemo(
      () =>
        resolveTimetableViewModel({
          sessions,
          activeDayKey,
          activeInstructor,
          activeClassName,
        }),
      [activeClassName, activeDayKey, activeInstructor, sessions],
    )

  useEffect(() => {
    if (!groupedSessions.length) {
      setActiveDayKey('')
      return
    }

    setActiveDayKey((current) =>
      resolveNextActiveDayKey(current, groupedSessions),
    )
  }, [groupedSessions])

  const activeDayGroup =
    activeDayKey === 'all'
      ? null
      : (groupedSessions.find(
          (dayGroup) => dayGroup.dateKey === activeDayKey,
        ) ??
        groupedSessions[0] ??
        null)

  const handleAttendanceAction = (session: TimetableSession) => {
    if (!attendanceAction.canShow) {
      return
    }

    setAttendancePendingSession(session)
    setAttendanceNotes('')
    setAttendanceRating(null)
    setAttendanceMessage(null)
    setAttendanceSelection(
      attendanceAction.options.length > 1 ? null : attendanceAction.kind,
    )
  }

  const handleRefreshTimetable = () => {
    if (!clubId) {
      return
    }

    timetableCache.delete(clubId)
    setRefreshVersion((current) => current + 1)
    setLastRefreshedAt(new Date().toLocaleString())
    setErrorMessage(null)
  }

  const handleAttendanceSubmit = async () => {
    if (!attendancePendingSession || attendanceSaving || savingRef.current) {
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
        attendancePendingSession.id ??
        `${attendancePendingSession.classId ?? 'unknown'}-${attendancePendingSession.startTime ?? 'unknown'}`

      const result = await saveTimetableAttendance({
        sessionId: attendancePendingSession.id,
        classId: attendancePendingSession.classId,
        className: attendancePendingSession.className,
        instructorName:
          attendancePendingSession.instructorName != null
            ? String(attendancePendingSession.instructorName)
            : attendancePendingSession.instructorId != null
              ? String(attendancePendingSession.instructorId)
              : null,
        startedAt: attendancePendingSession.startTime,
        attendanceType: attendanceKind,
        notes: attendanceNotes,
        rating: attendanceRating,
        userId: user?.id,
      })

      if (result.success) {
        setAttendanceState((current) => ({
          ...current,
          [attendanceKey]: attendanceKind,
        }))
        setAttendanceMessage('Attendance saved.')
        setAttendancePendingSession(null)
        setAttendanceNotes('')
        setAttendanceRating(null)
        setAttendanceSelection(null)
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

  if (!clubId) {
    return (
      <PageLayout className="max-w-6xl">
        <PageCardLayout
          title={headerViewModel.title}
          subtitle={headerViewModel.subtitle}
          description={headerViewModel.description}
          icon="calendar"
        >
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Select a valid gym club to view the timetable.
          </div>
        </PageCardLayout>
      </PageLayout>
    )
  }

  if (attendancePendingSession) {
    return (
      <PageLayout className="max-w-6xl">
        <PageCardLayout
          title={headerViewModel.title}
          subtitle={headerViewModel.subtitle}
          description={headerViewModel.description}
          icon="calendar"
        >
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {attendancePendingSession.className ??
                      `Class ${attendancePendingSession.classId ?? 'Unknown'}`}
                  </p>
                  <p className="text-sm text-slate-600">
                    {attendancePendingSession.room ?? 'Room TBD'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isPastTimetableSession(attendancePendingSession) ? (
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                      Ended
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${attendancePendingSession.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : attendancePendingSession.status === 'Waitlist' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}
                    >
                      {attendancePendingSession.status ?? 'Unknown'}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-700">Day:</span>{' '}
                  {formatTimetableDateLabel(attendancePendingSession.startTime)}
                </p>
                <p>
                  <span className="font-medium text-slate-700">Time:</span>{' '}
                  {formatTimetableTimeLabel(attendancePendingSession.startTime)}{' '}
                  – {formatTimetableTimeLabel(attendancePendingSession.endTime)}
                </p>
                <p>
                  <span className="font-medium text-slate-700">
                    Instructor:
                  </span>{' '}
                  {attendancePendingSession.instructorName ??
                    attendancePendingSession.instructorId ??
                    'TBC'}
                </p>
                <p>
                  <span className="font-medium text-slate-700">
                    Availability:
                  </span>{' '}
                  {formatTimetableAvailability(attendancePendingSession)}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Confirm attendance
                  </h3>
                  <p className="text-sm text-slate-600">
                    {attendanceAction.options.length > 1
                      ? 'Choose how this class should be recorded and add any notes.'
                      : 'Record your attendance for this class and add any notes.'}
                  </p>
                </div>
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
                    onClick={() => {
                      setAttendancePendingSession(null)
                      setAttendanceNotes('')
                      setAttendanceRating(null)
                      setAttendanceMessage(null)
                      setAttendanceSelection(null)
                    }}
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

  return (
    <PageLayout className="max-w-6xl">
      <PageCardLayout
        title={headerViewModel.title}
        subtitle={headerViewModel.subtitle}
        description={headerViewModel.description}
        icon="calendar"
      >
        <div className="space-y-6">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Loading timetable…
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !errorMessage && groupedSessions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No timetable sessions were returned.
            </div>
          ) : null}

          {!isLoading && !errorMessage && groupedSessions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm text-slate-500">
                    {lastRefreshedAt
                      ? `Last refreshed: ${lastRefreshedAt}`
                      : 'Refresh to update the latest timetable data.'}
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshTimetable}
                    disabled={isLoading}
                    className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {isLoading ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveDayKey('all')}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${activeDayKey === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                  >
                    All days
                  </button>
                  {groupedSessions.map((dayGroup) => (
                    <button
                      key={dayGroup.dateKey}
                      type="button"
                      onClick={() => setActiveDayKey(dayGroup.dateKey)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${activeDayKey === dayGroup.dateKey ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                    >
                      {dayGroup.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col items-start self-stretch gap-2 sm:items-end sm:self-auto">
                  <label className="flex flex-col gap-1 self-start text-sm text-slate-700">
                    <span className="font-medium">Instructor</span>
                    <select
                      value={activeInstructor}
                      onChange={(event) =>
                        setActiveInstructor(event.target.value)
                      }
                      className="min-w-36 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm"
                    >
                      <option value="all">All</option>
                      {instructorOptions.map((instructorName) => (
                        <option key={instructorName} value={instructorName}>
                          {instructorName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span className="font-medium">Class</span>
                    <select
                      value={activeClassName}
                      onChange={(event) =>
                        setActiveClassName(event.target.value)
                      }
                      className="min-w-36 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm"
                    >
                      <option value="all">All</option>
                      {classOptions.map((className) => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {activeDayKey === 'all' ? (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-slate-900">
                    All days
                  </h2>
                  {visibleSessions.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      No sessions match the selected filters.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {visibleSessions.map((session) => (
                        <article
                          key={
                            session.id ??
                            `${session.classId}-${session.startTime}`
                          }
                          className={`rounded-2xl border p-4 shadow-sm ${isPastTimetableSession(session) ? 'border-slate-300 bg-slate-100/70' : 'border-slate-200 bg-white'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {session.className ??
                                  `Class ${session.classId ?? 'Unknown'}`}
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
                              <span className="font-medium text-slate-700">
                                Day:
                              </span>{' '}
                              {formatTimetableDateLabel(session.startTime)}
                            </p>
                            <p>
                              <span className="font-medium text-slate-700">
                                Time:
                              </span>{' '}
                              {formatTimetableTimeLabel(session.startTime)} –{' '}
                              {formatTimetableTimeLabel(session.endTime)}
                            </p>
                            <p>
                              <span className="font-medium text-slate-700">
                                Instructor:
                              </span>{' '}
                              {session.instructorName ??
                                session.instructorId ??
                                'TBC'}
                            </p>
                            <p>
                              <span className="font-medium text-slate-700">
                                Availability:
                              </span>{' '}
                              {formatTimetableAvailability(session)}
                            </p>
                            {typeof session.waitlistCount === 'number' &&
                            session.waitlistCount > 0 ? (
                              <p>
                                <span className="font-medium text-slate-700">
                                  Waitlist:
                                </span>{' '}
                                {session.waitlistCount}
                              </p>
                            ) : null}
                          </div>
                          {attendanceAction.canShow ? (
                            <button
                              type="button"
                              onClick={() => handleAttendanceAction(session)}
                              disabled={Boolean(
                                session.id
                                  ? attendanceState[session.id]
                                  : attendanceState[
                                      `${session.classId ?? 'unknown'}-${session.startTime ?? 'unknown'}`
                                    ],
                              )}
                              className="mt-3 inline-flex items-center rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:border-emerald-300 disabled:bg-emerald-300 disabled:text-emerald-950"
                            >
                              {Boolean(
                                session.id
                                  ? attendanceState[session.id]
                                  : attendanceState[
                                      `${session.classId ?? 'unknown'}-${session.startTime ?? 'unknown'}`
                                    ],
                              )
                                ? attendanceAction.completedLabel
                                : attendanceAction.label}
                            </button>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}

              {activeDayKey !== 'all' && activeDayGroup ? (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {activeDayGroup.label}
                  </h2>
                  {visibleSessions.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      No sessions match the selected filters for this day.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {visibleSessions.map((session) => (
                        <article
                          key={
                            session.id ??
                            `${session.classId}-${session.startTime}`
                          }
                          className={`rounded-2xl border p-4 shadow-sm ${isPastTimetableSession(session) ? 'border-slate-300 bg-slate-100/70' : 'border-slate-200 bg-white'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {session.className ??
                                  `Class ${session.classId ?? 'Unknown'}`}
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
                              <span className="font-medium text-slate-700">
                                Time:
                              </span>{' '}
                              {formatTimetableTimeLabel(session.startTime)} –{' '}
                              {formatTimetableTimeLabel(session.endTime)}
                            </p>
                            <p>
                              <span className="font-medium text-slate-700">
                                Instructor:
                              </span>{' '}
                              {session.instructorName ??
                                session.instructorId ??
                                'TBC'}
                            </p>
                            <p>
                              <span className="font-medium text-slate-700">
                                Availability:
                              </span>{' '}
                              {formatTimetableAvailability(session)}
                            </p>
                            {typeof session.waitlistCount === 'number' &&
                            session.waitlistCount > 0 ? (
                              <p>
                                <span className="font-medium text-slate-700">
                                  Waitlist:
                                </span>{' '}
                                {session.waitlistCount}
                              </p>
                            ) : null}
                          </div>
                          {attendanceAction.canShow ? (
                            <button
                              type="button"
                              onClick={() => handleAttendanceAction(session)}
                              disabled={Boolean(
                                session.id
                                  ? attendanceState[session.id]
                                  : attendanceState[
                                      `${session.classId ?? 'unknown'}-${session.startTime ?? 'unknown'}`
                                    ],
                              )}
                              className="mt-3 inline-flex items-center rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:border-emerald-300 disabled:bg-emerald-300 disabled:text-emerald-950"
                            >
                              {Boolean(
                                session.id
                                  ? attendanceState[session.id]
                                  : attendanceState[
                                      `${session.classId ?? 'unknown'}-${session.startTime ?? 'unknown'}`
                                    ],
                              )
                                ? attendanceAction.completedLabel
                                : attendanceAction.label}
                            </button>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}
