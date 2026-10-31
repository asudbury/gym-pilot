import { reorder } from '../../../utils/arrayUtils'

export type ReorderDirection = 'up' | 'down'

export type SessionReorderState<TSession extends { id: string }> = {
  sessions: TSession[]
  activeSessionIndex: number
  movedSessionId: string | null
}

export function resolveRemovedSessionState<TSession>(
  sessions: TSession[],
  activeSessionIndex: number,
  indexToRemove: number,
): { sessions: TSession[]; activeSessionIndex: number } {
  const nextSessions = sessions.filter((_, idx) => idx !== indexToRemove)

  if (activeSessionIndex >= indexToRemove && activeSessionIndex > 0) {
    return { sessions: nextSessions, activeSessionIndex: activeSessionIndex - 1 }
  }

  return { sessions: nextSessions, activeSessionIndex }
}

export function resolveReorderedSessionState<TSession extends { id: string }>(
  sessions: TSession[],
  activeSessionIndex: number,
  index: number,
  direction: ReorderDirection,
): SessionReorderState<TSession> {
  const reordered = reorder(sessions, index, direction)
  const moved =
    reordered[direction === 'up' ? index - 1 : index + 1] ?? null

  if (index === activeSessionIndex) {
    return {
      sessions: reordered,
      activeSessionIndex: direction === 'up' ? index - 1 : index + 1,
      movedSessionId: moved?.id ?? null,
    }
  }

  if (direction === 'up' && index - 1 === activeSessionIndex) {
    return {
      sessions: reordered,
      activeSessionIndex: activeSessionIndex + 1,
      movedSessionId: moved?.id ?? null,
    }
  }

  if (direction === 'down' && index + 1 === activeSessionIndex) {
    return {
      sessions: reordered,
      activeSessionIndex: activeSessionIndex - 1,
      movedSessionId: moved?.id ?? null,
    }
  }

  return {
    sessions: reordered,
    activeSessionIndex,
    movedSessionId: moved?.id ?? null,
  }
}
