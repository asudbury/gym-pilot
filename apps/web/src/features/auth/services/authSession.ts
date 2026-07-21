import {
  getSupabaseClient,
  loadSupabaseProfileAccessState,
  loadSupabaseProfileSnapshot,
  logger,
  normalizeUserRoles,
  saveSupabaseApplicationName,
  saveSupabaseGymBrand,
  saveSupabaseProfileEmail,
  saveSupabaseGymName,
  saveSupabaseProfileName,
  signOutFromSupabase,
} from '@gym-pilot/shared'
import type { User, UserRole } from '@gym-pilot/types'
import type { AuthUser } from '../domain/authTypes'

/**
 * Resolves the authenticated Supabase user into the app's auth user shape,
 * including profile-derived metadata and role access state.
 */
export async function resolveSupabaseAuthUser(
  users: User[] = [],
): Promise<AuthUser | null> {
  const client = getSupabaseClient()

  if (!client) {
    return null
  }

  try {
    const {
      data: { session },
      error,
    } = await client.auth.getSession()

    if (error) {
      logger.warn('[Auth] Could not read Supabase session', error)
      return null
    }

    const supabaseUser = session?.user

    if (!supabaseUser) {
      return null
    }

    const profileSnapshot = await loadSupabaseProfileSnapshot(supabaseUser.id)
    const accessState = await loadSupabaseProfileAccessState(supabaseUser.id)
    const matchingProfileUser = users.find(
      (user) => user.id === supabaseUser.id,
    )
    const displayName =
      profileSnapshot.friendlyName ||
      matchingProfileUser?.name ||
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      supabaseUser.email ||
      'Unknown user'
    const slug =
      displayName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-') || 'supabase-user'
    const resolvedRoles = normalizeUserRoles(
      matchingProfileUser?.roles,
      matchingProfileUser?.role,
    )
    const resolvedRole = (matchingProfileUser?.role ??
      resolvedRoles[0] ??
      'client') as UserRole

    if (accessState.isBlocked) {
      await signOutFromSupabase()
      return null
    }

    if (displayName !== (profileSnapshot.friendlyName ?? null)) {
      await saveSupabaseProfileName(displayName)
    }

    if ((supabaseUser.email ?? null) !== (profileSnapshot.email ?? null)) {
      await saveSupabaseProfileEmail(supabaseUser.email ?? null)
    }

    return {
      id: supabaseUser.id,
      name: displayName,
      slug: matchingProfileUser?.slug || slug,
      role: resolvedRole,
      roles: resolvedRoles,
      trainerId: matchingProfileUser?.trainerId ?? null,
      applicationName: 'Gym-Pilot',
      // applicationName:
      //   profileSnapshot.applicationName ??
      //   matchingProfileUser?.applicationName ??
      //   null,
      gymBrand:
        profileSnapshot.gymBrand ?? matchingProfileUser?.gymBrand ?? null,
      gymName: profileSnapshot.gymName ?? matchingProfileUser?.gymName ?? null,
      accountTier:
        profileSnapshot.accountTier ?? matchingProfileUser?.accountTier ?? null,
      accessEndsAt:
        profileSnapshot.accessEndsAt ??
        matchingProfileUser?.accessEndsAt ??
        null,
      isFrozen:
        profileSnapshot.isFrozen || matchingProfileUser?.isFrozen || false,
      email: supabaseUser.email ?? null,
      lastLoggedInAt: profileSnapshot.lastLoggedInAt,
      previousLastLoggedInAt: profileSnapshot.previousLastLoggedInAt,
    }
  } catch (error) {
    logger.warn('[Auth] Supabase session lookup failed', error)
    return null
  }
}

/**
 * Persists an updated profile name to Supabase when the user is authenticated.
 */
export async function updateProfileNameOnSupabase(
  user: AuthUser | null,
  friendlyName: string,
) {
  const trimmedName = friendlyName.trim()
  if (!user) {
    return
  }

  await saveSupabaseProfileName(trimmedName || null)
}

/**
 * Persists an updated application name to Supabase when the user is authenticated.
 */
export async function updateApplicationNameOnSupabase(
  user: AuthUser | null,
  applicationName: string,
) {
  const trimmedName = applicationName.trim()
  if (!user) {
    return
  }

  await saveSupabaseApplicationName(trimmedName || null)
}

/**
 * Persists an updated gym brand to Supabase when the user is authenticated.
 */
export async function updateGymBrandOnSupabase(
  user: AuthUser | null,
  gymBrand: string,
) {
  const trimmedValue = gymBrand.trim()
  if (!user) {
    return
  }

  await saveSupabaseGymBrand(trimmedValue || null)
}

/**
 * Persists an updated gym name to Supabase when the user is authenticated.
 */
export async function updateGymNameOnSupabase(
  user: AuthUser | null,
  gymName: string,
  gymBrand?: string | null,
) {
  const trimmedValue = gymName.trim()
  if (!user) {
    return
  }

  await saveSupabaseGymName(
    trimmedValue ? trimmedValue : null,
    gymBrand ?? user.gymBrand ?? null,
  )
}
