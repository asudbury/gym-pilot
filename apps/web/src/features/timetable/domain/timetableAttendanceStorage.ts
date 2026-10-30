export type TimetableAttendanceState = Record<string, 'attended' | 'taught'>

/**
 * Reads persisted attendance state from storage.
 * Invalid or malformed values are ignored and return an empty state.
 */
export function readTimetableAttendanceState(
  storage: Pick<Storage, 'getItem'> | null | undefined,
  key: string,
): TimetableAttendanceState {
  if (!storage) {
    return {}
  }

  const rawValue = storage.getItem(key)
  if (!rawValue) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }

    return Object.entries(parsed).reduce<TimetableAttendanceState>(
      (nextState, [sessionId, value]) => {
        if (value === 'attended' || value === 'taught') {
          nextState[sessionId] = value
        }
        return nextState
      },
      {},
    )
  } catch {
    return {}
  }
}

/**
 * Persists attendance state as JSON to storage.
 */
export function writeTimetableAttendanceState(
  storage: Pick<Storage, 'setItem'> | null | undefined,
  key: string,
  state: TimetableAttendanceState,
): void {
  if (!storage) {
    return
  }

  storage.setItem(key, JSON.stringify(state))
}
