import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'

type TimetableSession = {
  id?: number | string
  classId?: number | string
  className?: string | null
  room?: string | null
  status?: string | null
  instructorId?: number | string | null
  instructorName?: string | null
  capacity?: number | null
  booked?: number | null
  waitlistCapacity?: number | null
  waitlistCount?: number | null
  startTime?: string | null
  endTime?: string | null
}

type TimetableDayGroup = {
  dateKey: string
  label: string
  sessions: TimetableSession[]
}

const TIMETABLE_ENDPOINT = 'https://czasc5rowjxovhkdbd6p6jdtky0hnqas.lambda-url.eu-west-2.on.aws/'
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
  const instructors = Array.isArray(candidate.instructors) ? candidate.instructors : []

  return instructors.reduce<Record<string, string>>((lookup, item) => {
    if (!isRecord(item)) {
      return lookup
    }

    const instructorId = typeof item.id === 'number' || typeof item.id === 'string' ? String(item.id) : null
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

    const classId = typeof item.id === 'number' || typeof item.id === 'string' ? String(item.id) : null
    const className = typeof item.name === 'string' ? item.name : null

    if (classId && className) {
      lookup[classId] = className
    }

    return lookup
  }, {})
}

function normalizeSessions(payload: unknown): TimetableSession[] {
  if (Array.isArray(payload)) {
    return payload.map(parseSession).filter((session): session is TimetableSession => Boolean(session))
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

function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return 'Unknown date'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parsed)
}

function formatTimeLabel(value: string | null | undefined) {
  if (!value) {
    return 'Time TBD'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed)
}

function formatAvailability(session: TimetableSession) {
  const booked = typeof session.booked === 'number' ? session.booked : null
  const capacity = typeof session.capacity === 'number' ? session.capacity : null

  if (booked !== null && capacity !== null) {
    return `${booked}/${capacity} booked`
  }

  return 'Availability unavailable'
}

function isPastSession(session: TimetableSession) {
  if (!session.startTime) {
    return false
  }

  const parsed = new Date(session.startTime)
  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  return parsed.getTime() < Date.now()
}

export function TimetablePage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<TimetableSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeDayKey, setActiveDayKey] = useState('')
  const [activeInstructor, setActiveInstructor] = useState('all')
  const [activeClassName, setActiveClassName] = useState('all')

  const clubId = useMemo(() => {
    const storedClubId = user?.gymName?.trim() ?? ''
    return /^\d+$/.test(storedClubId) ? storedClubId : '60'
  }, [user?.gymName])

  useEffect(() => {
    let cancelled = false

    async function loadTimetable() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const timetableUrl = new URL(TIMETABLE_ENDPOINT)
        timetableUrl.searchParams.set('clubid', clubId)

        const cachedRequest = timetableCache.get(clubId)
        const request = cachedRequest ?? (async () => {
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
            const instructorId = session.instructorId == null ? null : String(session.instructorId)
            const instructorName = instructorId ? instructorLookup[instructorId] ?? null : null
            const classId = session.classId == null ? null : String(session.classId)
            const className = classId ? classLookup[classId] ?? null : null

            return {
              ...session,
              className: className ?? session.className ?? null,
              instructorName: instructorName ?? session.instructorName ?? null,
            }
          })
        })()

        if (!cachedRequest) {
          timetableCache.set(clubId, request)
        }

        const nextSessions = await request

        if (!cancelled) {
          setSessions(nextSessions)
          setActiveInstructor('all')
          setActiveClassName('all')
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Could not load the timetable right now.')
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
  }, [clubId])

  const groupedSessions = useMemo<TimetableDayGroup[]>(() => {
    const groups = new Map<string, TimetableSession[]>()

    sessions.forEach((session) => {
      const startTime = session.startTime ?? ''
      const parsed = new Date(startTime)
      const dateKey = Number.isNaN(parsed.getTime()) ? 'unknown' : parsed.toISOString().slice(0, 10)
      const existing = groups.get(dateKey) ?? []
      existing.push(session)
      groups.set(dateKey, existing)
    })

    return Array.from(groups.entries())
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([dateKey, daySessions]) => ({
        dateKey,
        label: formatDateLabel(daySessions[0]?.startTime ?? null),
        sessions: daySessions.sort((left, right) => {
          const leftTime = left.startTime ?? ''
          const rightTime = right.startTime ?? ''
          const timeOrder = leftTime.localeCompare(rightTime)

          if (timeOrder !== 0) {
            return timeOrder
          }

          const leftName = (left.className ?? '').toLocaleLowerCase()
          const rightName = (right.className ?? '').toLocaleLowerCase()
          return leftName.localeCompare(rightName)
        }),
      }))
  }, [sessions])

  const instructorOptions = useMemo(() => {
    const names = new Set<string>()

    sessions.forEach((session) => {
      if (session.instructorName?.trim()) {
        names.add(session.instructorName.trim())
      } else if (session.instructorId != null) {
        names.add(String(session.instructorId))
      }
    })

    return Array.from(names).sort((left, right) => left.localeCompare(right))
  }, [sessions])

  const classOptions = useMemo(() => {
    const names = new Set<string>()

    sessions.forEach((session) => {
      if (session.className?.trim()) {
        names.add(session.className.trim())
      }
    })

    return Array.from(names).sort((left, right) => left.localeCompare(right))
  }, [sessions])

  useEffect(() => {
    if (!groupedSessions.length) {
      setActiveDayKey('')
      return
    }

    setActiveDayKey((current) => {
      if (current && groupedSessions.some((dayGroup) => dayGroup.dateKey === current)) {
        return current
      }

      return groupedSessions[0]?.dateKey ?? ''
    })
  }, [groupedSessions])

  const activeDayGroup = activeDayKey === 'all'
    ? null
    : (groupedSessions.find((dayGroup) => dayGroup.dateKey === activeDayKey) ?? groupedSessions[0] ?? null)

  const visibleSessions = useMemo(() => {
    if (!groupedSessions.length) {
      return []
    }

    const candidateSessions = activeDayKey === 'all'
      ? groupedSessions.flatMap((dayGroup) => dayGroup.sessions)
      : (activeDayGroup?.sessions ?? [])

    return candidateSessions.filter((session) => {
      const matchesInstructor = activeInstructor === 'all'
        ? true
        : (() => {
            const instructorName = session.instructorName?.trim() ?? ''
            const instructorId = session.instructorId == null ? '' : String(session.instructorId)
            return instructorName === activeInstructor || instructorId === activeInstructor
          })()

      const matchesClass = activeClassName === 'all'
        ? true
        : (() => {
            const className = session.className?.trim() ?? ''
            return className === activeClassName
          })()

      return matchesInstructor && matchesClass
    }).sort((left, right) => {
      const leftTime = left.startTime ?? ''
      const rightTime = right.startTime ?? ''
      const timeOrder = leftTime.localeCompare(rightTime)

      if (timeOrder !== 0) {
        return timeOrder
      }

      const leftName = (left.className ?? '').toLocaleLowerCase()
      const rightName = (right.className ?? '').toLocaleLowerCase()
      return leftName.localeCompare(rightName)
    })
  }, [activeDayGroup, activeDayKey, activeInstructor, activeClassName, groupedSessions])

  return (
    <PageLayout className="max-w-6xl">
      <PageCard padding="spacious" className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Timetable</p>
          <h1 className="text-3xl font-semibold text-slate-900">Live class timetable</h1>
          <p className="text-sm text-slate-600">The latest sessions are loaded directly from the provided Virgin Active timetable endpoint.</p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Loading timetable…</div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>
        ) : null}

        {!isLoading && !errorMessage && groupedSessions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No timetable sessions were returned.</div>
        ) : null}

        {!isLoading && !errorMessage && groupedSessions.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDayKey('all')}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition ${activeDayKey === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                  All days
                </button>
                {groupedSessions.map((dayGroup) => (
                  <button
                    key={dayGroup.dateKey}
                    type="button"
                    onClick={() => setActiveDayKey(dayGroup.dateKey)}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition ${activeDayKey === dayGroup.dateKey ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                  >
                    {dayGroup.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="font-medium">Instructor</span>
                  <select
                    value={activeInstructor}
                    onChange={(event) => setActiveInstructor(event.target.value)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
                  >
                    <option value="all">All</option>
                    {instructorOptions.map((instructorName) => (
                      <option key={instructorName} value={instructorName}>{instructorName}</option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="font-medium">Class</span>
                  <select
                    value={activeClassName}
                    onChange={(event) => setActiveClassName(event.target.value)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
                  >
                    <option value="all">All</option>
                    {classOptions.map((className) => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {activeDayKey === 'all' ? (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">All days</h2>
                {visibleSessions.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No sessions match the selected filters.</div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {visibleSessions.map((session) => (
                      <article key={session.id ?? `${session.classId}-${session.startTime}`} className={`rounded-2xl border p-4 shadow-sm ${isPastSession(session) ? 'border-slate-300 bg-slate-100/70' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{session.className ?? `Class ${session.classId ?? 'Unknown'}`}</p>
                            <p className="text-sm text-slate-600">{session.room ?? 'Room TBD'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {isPastSession(session) ? (
                              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                Ended
                              </span>
                            ) : (
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${session.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : session.status === 'Waitlist' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                                {session.status ?? 'Unknown'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 space-y-1 text-sm text-slate-600">
                          <p><span className="font-medium text-slate-700">Day:</span> {formatDateLabel(session.startTime)}</p>
                          <p><span className="font-medium text-slate-700">Time:</span> {formatTimeLabel(session.startTime)} – {formatTimeLabel(session.endTime)}</p>
                          <p><span className="font-medium text-slate-700">Instructor:</span> {session.instructorName ?? session.instructorId ?? 'TBC'}</p>
                          <p><span className="font-medium text-slate-700">Availability:</span> {formatAvailability(session)}</p>
                          {typeof session.waitlistCount === 'number' && session.waitlistCount > 0 ? (
                            <p><span className="font-medium text-slate-700">Waitlist:</span> {session.waitlistCount}</p>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {activeDayKey !== 'all' && activeDayGroup ? (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">{activeDayGroup.label}</h2>
                {visibleSessions.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No sessions match the selected filters for this day.</div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {visibleSessions.map((session) => (
                      <article key={session.id ?? `${session.classId}-${session.startTime}`} className={`rounded-2xl border p-4 shadow-sm ${isPastSession(session) ? 'border-slate-300 bg-slate-100/70' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{session.className ?? `Class ${session.classId ?? 'Unknown'}`}</p>
                            <p className="text-sm text-slate-600">{session.room ?? 'Room TBD'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {isPastSession(session) ? (
                              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                Ended
                              </span>
                            ) : (
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${session.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : session.status === 'Waitlist' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                                {session.status ?? 'Unknown'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 space-y-1 text-sm text-slate-600">
                          <p><span className="font-medium text-slate-700">Time:</span> {formatTimeLabel(session.startTime)} – {formatTimeLabel(session.endTime)}</p>
                          <p><span className="font-medium text-slate-700">Instructor:</span> {session.instructorName ?? session.instructorId ?? 'TBC'}</p>
                          <p><span className="font-medium text-slate-700">Availability:</span> {formatAvailability(session)}</p>
                          {typeof session.waitlistCount === 'number' && session.waitlistCount > 0 ? (
                            <p><span className="font-medium text-slate-700">Waitlist:</span> {session.waitlistCount}</p>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ) : null}
          </div>
        ) : null}
      </PageCard>
    </PageLayout>
  )
}
