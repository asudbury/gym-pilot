/**
 * Minimal interface for a user object used in capability checks.
 * All fields are optional to allow safe use with partially-loaded user state.
 */
export type UserCapabilityLike = {
  gymName?: string | null
  trainerId?: string | null
  roles?: Array<string | null | undefined> | null
}

/**
 * Returns true when the user can access timetable features.
 * Requires a non-empty gymName to be set on the user profile.
 *
 * @param user - The user object to check.
 */
export function canAccessTimetable(user: UserCapabilityLike | null | undefined): boolean {
  return Boolean(user?.gymName && user.gymName.trim())
}

/**
 * Returns true when the user has a trainer configured on their profile,
 * or when the user is themselves a trainer.
 * Used to decide whether to show PT session actions.
 *
 * @param user - The user object to check.
 */
export function canAccessPTSessions(user: UserCapabilityLike | null | undefined): boolean {
  return (
    Boolean(user?.trainerId?.trim()) ||
    Boolean(user?.roles?.includes('trainer'))
  )
}
