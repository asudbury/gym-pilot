export type TimetableSession = {
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

export type TimetableDayGroup = {
  dateKey: string
  label: string
  sessions: TimetableSession[]
}

export type TimetableViewModel = {
  groupedSessions: TimetableDayGroup[]
  instructorOptions: string[]
  classOptions: string[]
  visibleSessions: TimetableSession[]
}

export type TimetableHeaderViewModel = {
  title: string
  subtitle: string
  description?: string
  showIcon: boolean
}

export function resolveTimetableHeaderViewModel(input: {
  gymBrand?: string | null
  gymName?: string | null
  resolvedClubName?: string | null
}): TimetableHeaderViewModel {
  const rawGymBrand = input.gymBrand?.trim() ?? ''
  const rawGymName = input.gymName?.trim() ?? ''
  const resolvedClubName = input.resolvedClubName?.trim() ?? ''
  const isVirginBrand = rawGymBrand.toLowerCase() === 'virgin'
  const hasGymDetails = Boolean(rawGymBrand || rawGymName)

  const displayGymName = !rawGymName
    ? 'Gym not selected'
    : isVirginBrand && /^\d+$/.test(rawGymName)
      ? resolvedClubName || rawGymName
      : rawGymName

  const subtitle = hasGymDetails
    ? [rawGymBrand, displayGymName].filter(Boolean).join(' ').trim()
    : 'Gym not selected'

  return {
    title: 'Timetable',
    subtitle,
    description: hasGymDetails ? undefined : 'Select a gym to view sessions.',
    showIcon: hasGymDetails,
  }
}

export function resolveNextActiveDayKey(
  currentActiveDayKey: string,
  groupedSessions: Array<{ dateKey: string }>,
) {
  if (currentActiveDayKey === 'all') {
    return 'all'
  }

  if (
    currentActiveDayKey &&
    groupedSessions.some((dayGroup) => dayGroup.dateKey === currentActiveDayKey)
  ) {
    return currentActiveDayKey
  }

  return groupedSessions[0]?.dateKey ?? ''
}

export function resolveTimetableViewModel(input: {
  sessions: TimetableSession[]
  activeDayKey: string
  activeInstructor: string
  activeClassName: string
}): TimetableViewModel {
  const groupedSessions = input.sessions.reduce<
    Map<string, TimetableSession[]>
  >((groups, session) => {
    const startTime = session.startTime ?? ''
    const parsed = new Date(startTime)
    const dateKey = Number.isNaN(parsed.getTime())
      ? 'unknown'
      : parsed.toISOString().slice(0, 10)
    const existing = groups.get(dateKey) ?? []
    existing.push(session)
    groups.set(dateKey, existing)
    return groups
  }, new Map())

  const orderedGroups = Array.from(groupedSessions.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([dateKey, daySessions]) => ({
      dateKey,
      label: formatTimetableDateLabel(daySessions[0]?.startTime ?? null),
      sessions: daySessions.sort((left, right) => compareSessions(left, right)),
    }))

  const instructorOptions = Array.from(
    new Set(
      input.sessions.flatMap((session) => {
        const hasClass = Boolean(session.className?.trim())
        if (!hasClass) {
          return []
        }

        const name = session.instructorName?.trim()
        return name
          ? [name]
          : session.instructorId != null
            ? [String(session.instructorId)]
            : []
      }),
    ),
  ).sort((left, right) => left.localeCompare(right))

  const classOptions = Array.from(
    new Set(
      input.sessions.flatMap((session) =>
        session.className?.trim() ? [session.className.trim()] : [],
      ),
    ),
  ).sort((left, right) => left.localeCompare(right))

  const activeDayGroup =
    input.activeDayKey === 'all'
      ? null
      : (orderedGroups.find(
          (dayGroup) => dayGroup.dateKey === input.activeDayKey,
        ) ??
        orderedGroups[0] ??
        null)

  const visibleSessions = (
    input.activeDayKey === 'all'
      ? orderedGroups.flatMap((dayGroup) => dayGroup.sessions)
      : (activeDayGroup?.sessions ?? [])
  )
    .filter((session) => {
      const matchesInstructor =
        input.activeInstructor === 'all'
          ? true
          : (() => {
              const instructorName = session.instructorName?.trim() ?? ''
              const instructorId =
                session.instructorId == null ? '' : String(session.instructorId)
              return (
                instructorName === input.activeInstructor ||
                instructorId === input.activeInstructor
              )
            })()

      const matchesClass =
        input.activeClassName === 'all'
          ? true
          : (session.className?.trim() ?? '') === input.activeClassName

      return matchesInstructor && matchesClass
    })
    .sort((left, right) => compareSessions(left, right))

  return {
    groupedSessions: orderedGroups,
    instructorOptions,
    classOptions,
    visibleSessions,
  }
}

function compareSessions(left: TimetableSession, right: TimetableSession) {
  const leftTime = left.startTime ?? ''
  const rightTime = right.startTime ?? ''
  const timeOrder = leftTime.localeCompare(rightTime)

  if (timeOrder !== 0) {
    return timeOrder
  }

  const leftName = (left.className ?? '').toLocaleLowerCase()
  const rightName = (right.className ?? '').toLocaleLowerCase()
  return leftName.localeCompare(rightName)
}

export function formatTimetableDateLabel(value: string | null | undefined) {
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

export function formatTimetableTimeLabel(value: string | null | undefined) {
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

export function formatTimetableAvailability(session: TimetableSession) {
  const booked = typeof session.booked === 'number' ? session.booked : null
  const capacity =
    typeof session.capacity === 'number' ? session.capacity : null

  if (booked !== null && capacity !== null) {
    return `${booked}/${capacity} booked`
  }

  return 'Availability unavailable'
}

export function isPastTimetableSession(session: TimetableSession) {
  if (!session.startTime) {
    return false
  }

  const parsed = new Date(session.startTime)
  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  return parsed.getTime() < Date.now()
}
