import type { Assignment, Plan, UserRole } from '@gym-pilot/types'
import { getSupabaseClient, isSupabasePersistenceEnabled as isSupabasePersistenceEnabledBase } from './supabase'
import { normalizeUserRoles } from './utils'

const DEFAULT_SUPABASE_TABLE = 'gym_pilot_app_state'

type SupabaseProfileSnapshot = {
  friendlyName: string | null
  applicationName: string | null
  gymBrand: string | null
  gymName: string | null
  gymClubId: string | null
  lastLoggedInAt: string | null
  previousLastLoggedInAt: string | null
  mustChangePassword: boolean
  roles: UserRole[]
  trainerId: string | null
}

const profileSnapshotCache = new Map<string, Promise<SupabaseProfileSnapshot>>()

// The app persists arbitrary JSON payloads as { user_id, key, value } rows.
// These records are stored in the shared app_state table rather than the
// domain-specific tables created for relational data.
const SUPABASE_TABLE_BY_KEY: Record<string, string> = {
  'gym-pilot-plans': 'gym_pilot_plans',
  'gym-pilot-assignments': 'gym_pilot_assignments',
}

export function isSupabasePersistenceEnabled() {
  return isSupabasePersistenceEnabledBase()
}

type SupabaseRecordResponse<T> = {
  found: boolean
  value: T | null
}

type FavoriteLink = {
  id?: string
  label: string
  path: string
  folder?: string
}

type FavoriteStorageValue = {
  favorites: FavoriteLink[]
  folders: string[]
}

function normalizeFolderName(value?: string) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

function isFavoritesKey(key: string) {
  return key === 'gym-pilot.favorites'
}

function normalizeFavoriteStorageValue(value: unknown): FavoriteStorageValue {
  if (Array.isArray(value)) {
    return {
      favorites: value.filter((item): item is FavoriteLink => Boolean(item && typeof item === 'object' && typeof (item as FavoriteLink).path === 'string' && typeof (item as FavoriteLink).label === 'string')),
      folders: [],
    }
  }

  if (value && typeof value === 'object') {
    const candidate = value as Partial<FavoriteStorageValue>
    const folders = Array.isArray(candidate.folders)
      ? candidate.folders.filter((folder): folder is string => typeof folder === 'string' && folder.trim().length > 0)
      : []
    const favorites = Array.isArray(candidate.favorites)
      ? candidate.favorites.filter((item): item is FavoriteLink => Boolean(item && typeof item === 'object' && typeof (item as FavoriteLink).path === 'string' && typeof (item as FavoriteLink).label === 'string'))
      : []

    return {
      favorites,
      folders: Array.from(new Set(folders.map((folder) => folder.trim()))).sort((left, right) => left.localeCompare(right)),
    }
  }

  return { favorites: [], folders: [] }
}

function getSupabaseTableName(key: string) {
  if (isFavoritesKey(key)) {
    return 'gym_pilot_favourites'
  }

  return SUPABASE_TABLE_BY_KEY[key] ?? DEFAULT_SUPABASE_TABLE
}

function normalizeProfileRoles(roles: unknown): UserRole[] {
  return normalizeUserRoles(Array.isArray(roles) ? roles : undefined)
}

function createEmptyProfileSnapshot(): SupabaseProfileSnapshot {
  return {
    friendlyName: null,
    applicationName: null,
    gymBrand: null,
    gymName: null,
    gymClubId: null,
    lastLoggedInAt: null,
    previousLastLoggedInAt: null,
    mustChangePassword: false,
    roles: [],
    trainerId: null,
  }
}

function isMissingProfileColumnError(error: { message?: string } | null | undefined, columns: string[]) {
  const message = error?.message ?? ''

  if (!message) {
    return false
  }

  if (/does not exist|column .* does not exist/i.test(message)) {
    return true
  }

  return columns.some((column) => new RegExp(`\\b${column}\\b`, 'i').test(message))
}

function mapSupabaseProfile(profile: {
  id: string
  user_id: string
  friendly_name: string | null
  application_name?: string | null
  gym_brand?: string | null
  gym_name?: string | null
  gym_club_id?: number | null
  roles?: unknown
  trainer_id?: string | null
  must_change_password: boolean
  created_at?: string
  updated_at?: string
}): SupabaseProfile {
  return {
    id: profile.id,
    user_id: profile.user_id,
    friendly_name: typeof profile.friendly_name === 'string' ? profile.friendly_name : null,
    application_name: typeof profile.application_name === 'string' ? profile.application_name : null,
    gym_brand: typeof profile.gym_brand === 'string' ? profile.gym_brand : null,
    gym_name: typeof profile.gym_name === 'string' ? profile.gym_name : null,
    roles: normalizeProfileRoles(profile.roles),
    trainer_id: typeof profile.trainer_id === 'string' ? profile.trainer_id : null,
    must_change_password: Boolean(profile.must_change_password),
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  }
}

async function getAuthenticatedUserId(client: ReturnType<typeof getSupabaseClient>): Promise<string | null> {
  if (!client) {
    return null
  }

  try {
    const { data: { session }, error } = await client.auth.getSession()

    if (error) {
      console.warn('[Supabase] Could not resolve authenticated session', error)
      return null
    }

    const userId = session?.user?.id ?? null

    if (!userId) {
      console.log('[Supabase] No active session yet; skipping remote persistence work')
      return null
    }

    console.log('[Supabase] Resolved authenticated user', { userId })
    return userId
  } catch (error) {
    console.warn('[Supabase] Session lookup failed', error)
    return null
  }
}

export type SupabaseProfile = {
  id: string
  user_id: string
  friendly_name: string | null
  application_name: string | null
  gym_brand: string | null
  gym_name: string | null
  roles: UserRole[]
  trainer_id: string | null
  must_change_password: boolean
  created_at?: string
  updated_at?: string
}

export async function loadSupabaseProfileSnapshot(userId?: string): Promise<SupabaseProfileSnapshot> {
  const client = getSupabaseClient()

  if (!client) {
    return createEmptyProfileSnapshot()
  }

  const resolvedUserId = userId || await getAuthenticatedUserId(client)

  if (!resolvedUserId) {
    return createEmptyProfileSnapshot()
  }

  const cacheKey = `profile:${resolvedUserId}`
  const cachedPromise = profileSnapshotCache.get(cacheKey)

  if (cachedPromise) {
    return cachedPromise
  }

  const requestPromise = (async () => {
    const { data, error } = await client
      .from('gym_pilot_profiles')
      .select('friendly_name, application_name, gym_brand, gym_name, gym_club_id, last_logged_in_at, previous_last_logged_in_at, roles, trainer_id, must_change_password')
      .eq('user_id', resolvedUserId)
      .maybeSingle()

    if (error) {
      if (isMissingProfileColumnError(error, ['friendly_name', 'application_name', 'gym_brand', 'gym_name', 'gym_club_id', 'last_logged_in_at', 'previous_last_logged_in_at', 'roles', 'trainer_id', 'must_change_password'])) {
        return createEmptyProfileSnapshot()
      }

      console.error('[Supabase] Could not load profile snapshot', error)
      return createEmptyProfileSnapshot()
    }

    const profileData = data && typeof data === 'object' ? data as Record<string, unknown> : null
    const gymBrand = typeof profileData?.gym_brand === 'string' ? profileData.gym_brand.trim() || null : null
    const gymClubId = typeof profileData?.gym_club_id === 'number' && Number.isFinite(profileData.gym_club_id)
      ? String(profileData.gym_club_id)
      : null
    const isVirginBrand = gymBrand?.trim().toLowerCase() === 'virgin'

    return {
      friendlyName: typeof profileData?.friendly_name === 'string' ? profileData.friendly_name.trim() || null : null,
      applicationName: typeof profileData?.application_name === 'string' ? profileData.application_name.trim() || null : null,
      gymBrand,
      gymName: isVirginBrand ? gymClubId : null,
      gymClubId,
      lastLoggedInAt: typeof profileData?.last_logged_in_at === 'string' ? profileData.last_logged_in_at : null,
      previousLastLoggedInAt: typeof profileData?.previous_last_logged_in_at === 'string' ? profileData.previous_last_logged_in_at : null,
      mustChangePassword: Boolean(profileData?.must_change_password),
      roles: normalizeProfileRoles(profileData?.roles),
      trainerId: typeof profileData?.trainer_id === 'string' ? profileData.trainer_id : null,
    }
  })()

  profileSnapshotCache.set(cacheKey, requestPromise)
  return requestPromise
}

export async function loadSupabaseProfileName(): Promise<string | null> {
  const snapshot = await loadSupabaseProfileSnapshot()
  return snapshot.friendlyName
}

export async function loadSupabaseApplicationName(): Promise<string | null> {
  const snapshot = await loadSupabaseProfileSnapshot()
  return snapshot.applicationName
}

export async function loadSupabaseGymBrand(): Promise<string | null> {
  const snapshot = await loadSupabaseProfileSnapshot()
  return snapshot.gymBrand
}

export async function loadSupabaseGymName(): Promise<string | null> {
  const snapshot = await loadSupabaseProfileSnapshot()
  return snapshot.gymName
}

export async function loadSupabaseProfileLoginHistory(): Promise<{ lastLoggedInAt: string | null; previousLastLoggedInAt: string | null }> {
  const snapshot = await loadSupabaseProfileSnapshot()
  return {
    lastLoggedInAt: snapshot.lastLoggedInAt,
    previousLastLoggedInAt: snapshot.previousLastLoggedInAt,
  }
}

export async function listSupabaseProfiles(): Promise<SupabaseProfile[]> {
  const client = getSupabaseClient()

  if (!client) {
    return []
  }

  const userId = await getAuthenticatedUserId(client)

  if (!userId) {
    return []
  }

  const { data, error } = await client
    .from('gym_pilot_profiles')
    .select('id, user_id, friendly_name, application_name, gym_brand, gym_name, roles, trainer_id, must_change_password, created_at, updated_at')

  if (error && isMissingProfileColumnError(error, ['trainer_id', 'gym_brand', 'gym_name'])) {
    const fallback = await client
      .from('gym_pilot_profiles')
      .select('id, user_id, friendly_name, application_name, roles, must_change_password, created_at, updated_at')

    if (fallback.error) {
      console.error('[Supabase] Could not load profiles', fallback.error)
      return []
    }

    return ((fallback.data ?? []) as Array<{
      id: string
      user_id: string
      friendly_name: string | null
      roles?: unknown
      must_change_password: boolean
      created_at?: string
      updated_at?: string
    }>).filter((profile) => typeof profile.user_id === 'string').map(mapSupabaseProfile)
  }

  if (error) {
    console.error('[Supabase] Could not load profiles', error)
    return []
  }

  const profiles: SupabaseProfile[] = ((data ?? []) as Array<{
    id: string
    user_id: string
    friendly_name: string | null
    roles?: unknown
    must_change_password: boolean
    created_at?: string
    updated_at?: string
  }>).filter((profile) => typeof profile.user_id === 'string').map(mapSupabaseProfile)

  if (!profiles.some((profile) => profile.user_id === userId)) {
    const { error: upsertError } = await client.from('gym_pilot_profiles').upsert(
      { user_id: userId, friendly_name: null, application_name: null, gym_brand: null, gym_name: null, roles: ['client'], trainer_id: null, must_change_password: false },
      { onConflict: 'user_id' },
    )

    if (upsertError && isMissingProfileColumnError(upsertError, ['trainer_id', 'gym_brand', 'gym_name'])) {
      const fallback = await client.from('gym_pilot_profiles').upsert(
        { user_id: userId, friendly_name: null, application_name: null, roles: ['client'], must_change_password: false },
        { onConflict: 'user_id' },
      )

      if (fallback.error) {
        console.error('[Supabase] Could not create profile row for current user', fallback.error)
        return profiles
      }
    } else if (upsertError) {
      console.error('[Supabase] Could not create profile row for current user', upsertError)
      return profiles
    }

    const { data: refreshedData, error: refreshError } = await client
      .from('gym_pilot_profiles')
      .select('id, user_id, friendly_name, application_name, gym_brand, gym_name, roles, trainer_id, must_change_password, created_at, updated_at')

    if (refreshError) {
      console.error('[Supabase] Could not reload profiles after creating the current user row', refreshError)
      return profiles
    }

    return (refreshedData ?? []).map((profile) => mapSupabaseProfile({
      id: profile.id,
      user_id: profile.user_id,
      friendly_name: typeof profile.friendly_name === 'string' ? profile.friendly_name : null,
      application_name: typeof profile.application_name === 'string' ? profile.application_name : null,
      gym_brand: typeof profile.gym_brand === 'string' ? profile.gym_brand : null,
      gym_name: typeof profile.gym_name === 'string' ? profile.gym_name : null,
      roles: profile.roles,
      trainer_id: typeof profile.trainer_id === 'string' ? profile.trainer_id : null,
      must_change_password: Boolean(profile.must_change_password),
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }))
  }

  return profiles
}

export async function loadSupabaseProfileFlag(flag: 'must_change_password', userId?: string): Promise<boolean> {
  if (flag !== 'must_change_password') {
    return false
  }

  const snapshot = await loadSupabaseProfileSnapshot(userId)
  return snapshot.mustChangePassword
}

function invalidateSupabaseProfileCache(userId?: string) {
  if (!userId) {
    profileSnapshotCache.clear()
    return
  }

  profileSnapshotCache.delete(`profile:${userId}`)
}

export async function saveSupabaseProfileName(friendlyName: string | null) {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const userId = await getAuthenticatedUserId(client)

  if (!userId) {
    return
  }

  const normalizedName = friendlyName?.trim() ? friendlyName.trim() : null

  const { error } = await client.from('gym_pilot_profiles').upsert(
    { user_id: userId, friendly_name: normalizedName },
    { onConflict: 'user_id' },
  )

  if (error) {
    console.error('[Supabase] Could not save profile name', error)
    return
  }

  invalidateSupabaseProfileCache(userId)
}

async function saveSupabaseProfileTextValue(fieldName: 'application_name' | 'gym_brand' | 'gym_name' | 'gym_club_id', value: string | null, userId?: string) {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const resolvedUserId = userId || await getAuthenticatedUserId(client)

  if (!resolvedUserId) {
    return
  }

  const normalizedValue = fieldName === 'gym_club_id'
    ? (() => {
        const parsedValue = Number(value)
        return Number.isFinite(parsedValue) ? parsedValue : null
      })()
    : value?.trim() ? value.trim() : null

  const { error } = await client.from('gym_pilot_profiles').upsert(
    { user_id: resolvedUserId, [fieldName]: normalizedValue },
    { onConflict: 'user_id' },
  )

  if (error) {
    if (isMissingProfileColumnError(error, [fieldName])) {
      return
    }

    console.error(`[Supabase] Could not save profile field ${fieldName}`, error)
    return
  }

  invalidateSupabaseProfileCache(resolvedUserId)
}

export async function saveSupabaseApplicationName(applicationName: string | null) {
  return saveSupabaseProfileTextValue('application_name', applicationName)
}

export async function saveSupabaseGymBrand(gymBrand: string | null) {
  return saveSupabaseProfileTextValue('gym_brand', gymBrand)
}

export async function saveSupabaseGymName(gymName: string | null, gymBrand?: string | null) {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const resolvedUserId = await getAuthenticatedUserId(client)

  if (!resolvedUserId) {
    return
  }

  const trimmedGymBrand = gymBrand?.trim().toLowerCase() ?? ''
  const isVirginBrand = trimmedGymBrand === 'virgin'
  const normalizedGymName = gymName?.trim() ? gymName.trim() : null
  const normalizedClubId = isVirginBrand && normalizedGymName && /^\d+$/.test(normalizedGymName)
    ? Number(normalizedGymName)
    : null

  const { error } = await client.from('gym_pilot_profiles').upsert(
    { user_id: resolvedUserId, gym_name: null, gym_club_id: normalizedClubId },
    { onConflict: 'user_id' },
  )

  if (error) {
    if (isMissingProfileColumnError(error, ['gym_club_id'])) {
      return
    }

    console.error('[Supabase] Could not save profile gym name', error)
    return
  }

  invalidateSupabaseProfileCache(resolvedUserId)
}

export async function saveSupabaseProfileFlag(flag: 'must_change_password', value: boolean, userId?: string) {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const resolvedUserId = userId || await getAuthenticatedUserId(client)

  if (!resolvedUserId) {
    return
  }

  const { error } = await client.from('gym_pilot_profiles').upsert(
    { user_id: resolvedUserId, [flag]: value },
    { onConflict: 'user_id' },
  )

  if (error) {
    console.error('[Supabase] Could not save profile flag', error)
    return
  }

  invalidateSupabaseProfileCache(resolvedUserId)
}

export async function saveSupabaseProfileLastLoggedIn(userId?: string) {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const resolvedUserId = userId || await getAuthenticatedUserId(client)

  if (!resolvedUserId) {
    return
  }

  const { data: existingProfile, error: loadError } = await client
    .from('gym_pilot_profiles')
    .select('last_logged_in_at')
    .eq('user_id', resolvedUserId)
    .maybeSingle()

  if (loadError) {
    console.error('[Supabase] Could not load existing profile login timestamp', loadError)
    return
  }

  const previousLastLoggedInAt = existingProfile?.last_logged_in_at ?? null
  const nextLastLoggedInAt = new Date().toISOString()

  const { error } = await client.from('gym_pilot_profiles').upsert(
    {
      user_id: resolvedUserId,
      last_logged_in_at: nextLastLoggedInAt,
      previous_last_logged_in_at: previousLastLoggedInAt,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    console.error('[Supabase] Could not save profile last logged in timestamp', error)
    return
  }

  invalidateSupabaseProfileCache(resolvedUserId)

  await recordSupabaseUserActivity('login', {
  }, resolvedUserId)
}

export async function loadSupabaseJsonRecord<T>(key: string): Promise<SupabaseRecordResponse<T>> {
  console.log('[Supabase] Loading remote record', { key })
  const client = getSupabaseClient()

  if (!client) {
    return { found: false, value: null }
  }

  const userId = await getAuthenticatedUserId(client)

  if (!userId) {
    return { found: false, value: null }
  }

  if (key === 'gym-pilot-plans') {
    const { data, error } = await client
      .from('gym_pilot_plans')
      .select('id, plan_name, plan_slug, plan_sessions, created_at, updated_at')
      .eq('user_id', userId)

    if (error) {
      console.error('[Supabase] Remote plans load failed', { key, error })
      throw error
    }

    const plans = (data ?? []).map((row) => ({
      id: row.id,
      planName: row.plan_name,
      planSlug: row.plan_slug,
      planSessions: Array.isArray(row.plan_sessions) ? row.plan_sessions : [],
      createdByUserId: userId,
    }))

    return { found: true, value: plans as T }
  }

  if (key === 'gym-pilot-assignments') {
    const { data, error } = await client
      .from('gym_pilot_assignments')
      .select('id, assignment_name, plan_id, plan_name, plan_slug, plan_items, assigned_user_id, assigned_user_name, completed_exercises')
      .eq('user_id', userId)

    if (error) {
      console.error('[Supabase] Remote assignments load failed', { key, error })
      throw error
    }

    const assignments = (data ?? []).map((row) => ({
      id: row.id,
      assignmentName: row.assignment_name,
      planId: row.plan_id,
      planName: row.plan_name ?? undefined,
      planSlug: row.plan_slug ?? undefined,
      planSessions: Array.isArray(row.plan_items) ? row.plan_items : [],
      assignedUserId: row.assigned_user_id ?? undefined,
      assignedUserName: row.assigned_user_name ?? undefined,
      completedExercises: row.completed_exercises ?? {},
    }))

    return { found: true, value: assignments as T }
  }

  if (isFavoritesKey(key)) {
    const { data: folderRows, error: folderError } = await client
      .from('gym_pilot_favourite_folders')
      .select('id,name')
      .eq('user_id', userId)

    if (folderError) {
      console.error('[Supabase] Remote favorite folders load failed', { key, error: folderError })
      throw folderError
    }

    const folderLookup = new Map((folderRows ?? []).map((row) => [row.id, row.name]))

    const { data, error } = await client
      .from('gym_pilot_favourites')
      .select('path,label,folder,folder_id')
      .eq('user_id', userId)

    if (error) {
      console.error('[Supabase] Remote favorites load failed', { key, error })
      throw error
    }

    const favorites = (data ?? []).map((row) => {
      const folderName = row.folder_id ? folderLookup.get(row.folder_id) : undefined
      const fallbackFolder = normalizeFolderName(row.folder)

      return {
        id: row.path,
        label: row.label,
        path: row.path,
        folder: folderName ?? (fallbackFolder || undefined),
      }
    })

    const folders = Array.from(new Set((folderRows ?? []).map((row) => normalizeFolderName(row.name)).filter(Boolean))).sort((left, right) => left.localeCompare(right))

    const payload: FavoriteStorageValue = { favorites, folders }

    console.log('[Supabase] Remote favorites loaded', { key, favorites, folders })
    return { found: true, value: payload as T }
  }

  const { data, error } = await client
    .from(getSupabaseTableName(key))
    .select('value')
    .eq('key', key)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[Supabase] Remote record load failed', { key, error })
    throw error
  }

  if (!data?.value) {
    console.log('[Supabase] Remote record not found', { key })
    return { found: false, value: null }
  }

  console.log('[Supabase] Remote record loaded', { key, value: data.value })
  return {
    found: true,
    value: JSON.parse(data.value) as T,
  }
}

export async function saveSupabaseJsonRecord<T>(key: string, value: T) {
  console.log('[Supabase] Saving remote record', { key, value })
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const userId = await getAuthenticatedUserId(client)

  if (!userId) {
    return
  }

  if (key === 'gym-pilot-plans') {
    const plans = Array.isArray(value) ? (value as Plan[]) : []

    const { error: deleteError } = await client.from('gym_pilot_plans').delete().eq('user_id', userId)

    if (deleteError) {
      throw deleteError
    }

    if (plans.length > 0) {
      const { error: insertError } = await client.from('gym_pilot_plans').insert(
        plans.map((plan) => ({
          id: plan.id,
          user_id: userId,
          plan_name: plan.planName,
          plan_slug: plan.planSlug,
          plan_sessions: plan.planSessions ?? [],
        })),
      )

      if (insertError) {
        throw insertError
      }
    }

    return
  }

  if (key === 'gym-pilot-assignments') {
    const assignments = Array.isArray(value) ? (value as Assignment[]) : []

    const { error: deleteError } = await client.from('gym_pilot_assignments').delete().eq('user_id', userId)

    if (deleteError) {
      throw deleteError
    }

    if (assignments.length > 0) {
      const { error: insertError } = await client.from('gym_pilot_assignments').insert(
        assignments.map((assignment) => ({
          id: assignment.id,
          user_id: userId,
          plan_id: assignment.planId,
          assignment_name: assignment.assignmentName,
          assigned_user_id: assignment.assignedUserId ?? null,
          assigned_user_name: assignment.assignedUserName ?? null,
          completed_exercises: assignment.completedExercises ?? {},
          plan_items: assignment.planSessions ?? [],
          plan_name: assignment.planName ?? null,
          plan_slug: assignment.planSlug ?? null,
        })),
      )

      if (insertError) {
        throw insertError
      }
    }

    return
  }

  if (isFavoritesKey(key)) {
    const normalizedValue = normalizeFavoriteStorageValue(value)
    const favorites = normalizedValue.favorites
    const folderNames = Array.from(new Set([
      ...normalizedValue.folders,
      ...favorites.map((favorite) => normalizeFolderName(favorite.folder)).filter(Boolean),
    ]))

    const { error: deleteFavoritesError } = await client.from('gym_pilot_favourites').delete().eq('user_id', userId)

    if (deleteFavoritesError) {
      throw deleteFavoritesError
    }

    const { error: deleteFoldersError } = await client.from('gym_pilot_favourite_folders').delete().eq('user_id', userId)

    if (deleteFoldersError) {
      throw deleteFoldersError
    }

    const folderRows = folderNames.length > 0
      ? await client.from('gym_pilot_favourite_folders').upsert(
        folderNames.map((name) => ({ user_id: userId, name })),
        { onConflict: 'user_id,name' },
      ).select('id,name')
      : { data: [] as Array<{ id: string; name: string }>, error: null }

    if (folderRows.error) {
      throw folderRows.error
    }

    const folderLookup = new Map((folderRows.data ?? []).map((row) => [row.name, row.id]))

    if (favorites.length > 0) {
      const { error: insertError } = await client.from('gym_pilot_favourites').insert(
        favorites.map((favorite) => {
          const normalizedFolder = normalizeFolderName(favorite.folder)

          return {
            user_id: userId,
            path: favorite.path,
            label: favorite.label,
            folder: normalizedFolder || null,
            folder_id: normalizedFolder ? folderLookup.get(normalizedFolder) ?? null : null,
          }
        }),
      )

      if (insertError) {
        throw insertError
      }
    }

    return
  }

  const json = JSON.stringify(value)

  const { error } = await client.from(getSupabaseTableName(key)).upsert(
    { user_id: userId, key, value: json },
    { onConflict: 'user_id,key' },
  )

  if (error) {
    throw error
  }
}

export async function removeSupabaseJsonRecord(key: string) {
  console.log('[Supabase] Removing remote record', { key })
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const userId = await getAuthenticatedUserId(client)

  if (!userId) {
    return
  }

  if (isFavoritesKey(key)) {
    const { error: favoritesError } = await client.from('gym_pilot_favourites').delete().eq('user_id', userId)

    if (favoritesError) {
      throw favoritesError
    }

    const { error: foldersError } = await client.from('gym_pilot_favourite_folders').delete().eq('user_id', userId)

    if (foldersError) {
      throw foldersError
    }

    return
  }

  const { error } = await client.from(getSupabaseTableName(key)).delete().eq('key', key).eq('user_id', userId)

  if (error) {
    throw error
  }
}

export async function recordSupabaseUserActivity(eventType: string, eventData: Record<string, unknown> = {}, userId?: string) {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const resolvedUserId = userId || await getAuthenticatedUserId(client)

  if (!resolvedUserId) {
    return
  }

  const { error } = await client.from('gym_pilot_user_activity').insert({
    user_id: resolvedUserId,
    event_type: eventType,
    event_data: eventData,
  })

  if (error) {
    console.error('[Supabase] Could not record user activity', error)
  }
}
