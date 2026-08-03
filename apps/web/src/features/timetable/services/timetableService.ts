import { reportUiError } from '../../../utils/uiErrorLogging'
import { resolveTimetableErrorMessage } from '../domain/timetableView'
import type { TimetableSession } from '../domain/timetableView'
import { timetableCache } from '../domain/timetableCache'

const TIMETABLE_ENDPOINT =
  'https://czasc5rowjxovhkdbd6p6jdtky0hnqas.lambda-url.eu-west-2.on.aws/'

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

export async function loadTimetable(
  clubId: string,
  rawGymBrand: string,
  rawGymName: string,
  setErrorMessage: (message: string | null) => void,
  setIsLoading: (loading: boolean) => void,
  setSessions: (sessions: TimetableSession[]) => void,
  setActiveInstructor: (instructor: string) => void,
  setActiveClassName: (className: string) => void,
  cancelled: boolean,
) {
  setIsLoading(true)
  setErrorMessage(null)

  try {
    const timetableUrl = new URL(TIMETABLE_ENDPOINT)
    timetableUrl.searchParams.set('clubid', clubId)

    const cachedRequest = timetableCache.get(clubId)
    const request =
      cachedRequest ??
      (async () => {
        const response = await fetch(timetableUrl.toString(), {
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          const statusText = response.statusText?.trim() || 'Request failed'
          const details = `The timetable service responded with ${response.status} ${statusText}`
          throw new Error(
            resolveTimetableErrorMessage({
              status: response.status,
              statusText,
              details,
            }),
          )
        }

        const payload = await response.json()
        const instructorLookup = buildInstructorLookup(payload)
        const classLookup = buildClassLookup(payload)

        return normalizeSessions(payload).map((session) => {
          const instructorId =
            session.instructorId == null ? null : String(session.instructorId)
          const instructorName = instructorId
            ? (instructorLookup[instructorId] ?? null)
            : null
          const classId =
            session.classId == null ? null : String(session.classId)
          const className = classId ? (classLookup[classId] ?? null) : null

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
      const fallbackMessage = resolveTimetableErrorMessage({
        details:
          error instanceof Error
            ? error.message
            : 'Could not load the timetable right now.',
      })

      reportUiError('Timetable load failed', error, {
        clubId: clubId,
        rawGymBrand,
        rawGymName,
      })

      setErrorMessage(error instanceof Error ? error.message : fallbackMessage)
    }
  } finally {
    if (!cancelled) {
      setIsLoading(false)
    }
  }
}
