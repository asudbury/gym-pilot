export type WorkoutLinkState = 'linked' | 'unassigned' | 'no-link'

export const NO_LINK_SESSION_ID = '00000000-0000-0000-0000-000000000000'

export function resolveWorkoutLinkState(
  sessionId: string | null | undefined,
): WorkoutLinkState {
  if (sessionId === NO_LINK_SESSION_ID || sessionId === '0') {
    return 'no-link'
  }

  if (sessionId == null) {
    return 'unassigned'
  }

  return 'linked'
}
