import type { SupabaseClient } from '@supabase/supabase-js'
import type { Assignment, Plan, UserRole } from '@gym-pilot/types'
import { getSupabaseClient, isSupabasePersistenceEnabled as isSupabasePersistenceEnabledBase } from './supabase'
import { logger } from './logging'
import { normalizeUserRoles } from './utils'
import { saveJsonRecord as saveDexieJsonRecord, loadJsonRecord as loadDexieJsonRecord } from './dexie'

const DEFAULT_SUPABASE_TABLE = 'gym_pilot_app_state'

type SupabaseAccessTier = 'free' | 'bronze' | 'silver' | 'gold'

type SupabaseProfileSnapshot = {
  friendlyName: string | null
  applicationName: string | null
  gymBrand: string | null
  gymName: string | null
  gymClubId: string | null
  accountTier: SupabaseAccessTier
  accessEndsAt: string | null
  isFrozen: boolean
  lastLoggedInAt: string | null
  previousLastLoggedInAt: string | null
  mustChangePassword: boolean
  termsAccepted: boolean
  termsAcceptedAt: string | null
  roles: UserRole[]
  trainerId: string | null
}

const profileSnapshotCache = new Map<string, Promise<SupabaseProfileSnapshot>>()

export function getSupabaseProfileLocalStorageKey(userId: string) {
  return `profile:${userId}`
}

export function buildSupabaseProfileLocalCacheEntry(userId: string, snapshot: SupabaseProfileSnapshot) {
  return {
    userId,
    snapshot,
    storedAt: new Date().toISOString(),
  }
}

async function persistSupabaseProfileSnapshotToLocalCache(userId: string, snapshot: SupabaseProfileSnapshot) {
  try {
    await saveDexieJsonRecord(getSupabaseProfileLocalStorageKey(userId), buildSupabaseProfileLocalCacheEntry(userId, snapshot))
  } catch (error) {
    logger.warn('[Supabase] Could not persist profile snapshot to local cache', error)
  }
}

async function loadSupabaseProfileSnapshotFromLocalCache(userId: string): Promise<SupabaseProfileSnapshot | null> {
  try {
    const cachedEntry = await loadDexieJsonRecord<{ userId: string; snapshot: SupabaseProfileSnapshot; storedAt: string } | null>(getSupabaseProfileLocalStorageKey(userId), null)
    if (!cachedEntry?.snapshot) {
      return null
    }

    return cachedEntry.snapshot
  } catch (error) {
    logger.warn('[Supabase] Could not load profile snapshot from local cache', error)
    return null
  }
}

// The app persists arbitrary JSON payloads as { user_id, key, value } rows.
// These records are stored in the shared app_state table rather than the
// domain-specific tables created for relational data.
const SUPABASE_TABLE_BY_KEY: Record<string, string> = {
  'gym-pilot-plans': 'gym_pilot_plan',
  'gym-pilot-assignments': 'gym_pilot_assignment',
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

export function getSupabaseTableName(key: string) {
  if (isFavoritesKey(key)) {
    return 'gym_pilot_favourite'
  }

  return SUPABASE_TABLE_BY_KEY[key] ?? DEFAULT_SUPABASE_TABLE
}

function normalizeProfileRoles(roles: unknown): UserRole[] {
  return normalizeUserRoles(Array.isArray(roles) ? roles : undefined)
}

export function normalizeSupabaseUserRoleRows(rows: Array<{ user_id?: unknown; role?: unknown }> | null | undefined): UserRole[] {
  const normalizedRoles = (Array.isArray(rows) ? rows : [])
    .map((row) => (row && typeof row === 'object' ? (row as Record<string, unknown>).role : undefined))
    .filter((role): role is UserRole => typeof role === 'string' && normalizeUserRoles([role]).length > 0)

  return normalizeUserRoles(normalizedRoles)
}

export function buildSupabaseUserRoleRows(userId: string, roles: Array<UserRole | string> | UserRole | null | undefined): Array<{ user_id: string; role: UserRole }> {
  const normalizedRoles = normalizeUserRoles(Array.isArray(roles) ? roles : roles ? [roles] : [])

  return normalizedRoles.map((role) => ({ user_id: userId, role }))
}

async function loadSupabaseUserRoles(client: ReturnType<typeof getSupabaseClient>, userId: string): Promise<UserRole[]> {
  if (!client) {
    return []
  }

  const { data, error } = await client
    .from('gym_pilot_user_role')
    .select('user_id, role')
    .eq('user_id', userId)

  if (error) {
    if (isMissingProfileColumnError(error, ['role'])) {
      return []
    }

    logger.warn('[Supabase] Could not load user roles', error)
    return []
  }

  return normalizeSupabaseUserRoleRows(data ?? [])
}

async function loadSupabaseUserRolesByUserIds(client: ReturnType<typeof getSupabaseClient>, userIds: string[]): Promise<Map<string, UserRole[]>> {
  const roleLookup = new Map<string, UserRole[]>()

  if (!client || userIds.length === 0) {
    return roleLookup
  }

  const { data, error } = await client
    .from('gym_pilot_user_role')
    .select('user_id, role')
    .in('user_id', userIds)

  if (error) {
    if (isMissingProfileColumnError(error, ['role'])) {
      return roleLookup
    }

    logger.warn('[Supabase] Could not load user roles for user list', error)
    return roleLookup
  }

  const rows = Array.isArray(data) ? data : []
  const groupedRows = new Map<string, Array<{ user_id?: unknown; role?: unknown }>>()

  rows.forEach((row) => {
    if (!row || typeof row !== 'object') {
      return
    }

    const candidate = row as Record<string, unknown>
    const candidateUserId = typeof candidate.user_id === 'string' ? candidate.user_id : null

    if (!candidateUserId) {
      return
    }

    const existingRows = groupedRows.get(candidateUserId) ?? []
    existingRows.push(candidate)
    groupedRows.set(candidateUserId, existingRows)
  })

  groupedRows.forEach((roleRows, candidateUserId) => {
    roleLookup.set(candidateUserId, normalizeSupabaseUserRoleRows(roleRows))
  })

  return roleLookup
}

function normalizeProfileAccessTier(value: unknown): SupabaseAccessTier {
  const normalizedValue = typeof value === 'string' ? value.trim().toLowerCase() : ''

  switch (normalizedValue) {
    case 'bronze':
      return 'bronze'
    case 'silver':
      return 'silver'
    case 'gold':
      return 'gold'
    default:
      return 'free'
  }
}

function createEmptyProfileSnapshot(): SupabaseProfileSnapshot {
  return {
    friendlyName: null,
    applicationName: null,
    gymBrand: null,
    gymName: null,
    gymClubId: null,
    accountTier: 'free',
    accessEndsAt: null,
    isFrozen: false,
    lastLoggedInAt: null,
    previousLastLoggedInAt: null,
    mustChangePassword: false,
    termsAccepted: false,
    termsAcceptedAt: null,
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
  account_tier?: string | null
  access_ends_at?: string | null
  is_frozen?: boolean | null
  roles?: unknown
  trainer_id?: string | null
  must_change_password: boolean
  created_at?: string
  updated_at?: string
}, roleOverride?: UserRole[]): SupabaseProfile {
  return {
    id: profile.id,
    user_id: profile.user_id,
    friendly_name: typeof profile.friendly_name === 'string' ? profile.friendly_name : null,
    application_name: typeof profile.application_name === 'string' ? profile.application_name : null,
    gym_brand: typeof profile.gym_brand === 'string' ? profile.gym_brand : null,
    gym_name: typeof profile.gym_name === 'string' ? profile.gym_name : null,
    account_tier: normalizeProfileAccessTier(profile.account_tier),
    access_ends_at: typeof profile.access_ends_at === 'string' ? profile.access_ends_at : null,
    is_frozen: Boolean(profile.is_frozen),
    roles: roleOverride ?? normalizeProfileRoles(profile.roles),
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
      logger.warn('[Supabase] Could not resolve authenticated session', error)
      return null
    }

    const userId = session?.user?.id ?? null

    if (!userId) {
      logger.info('[Supabase] No active session yet; skipping remote persistence work')
      return null
    }

    logger.info('[Supabase] Resolved authenticated user', { userId })
    return userId
  } catch (error) {
    logger.warn('[Supabase] Session lookup failed', error)
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
  account_tier: SupabaseAccessTier
  access_ends_at: string | null
  is_frozen: boolean
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
    const localCachedSnapshot = await loadSupabaseProfileSnapshotFromLocalCache(resolvedUserId)

    const { data, error } = await client
      .from('gym_pilot_profile')
      .select('friendly_name, application_name, gym_brand, gym_name, gym_club_id, account_tier, access_ends_at, is_frozen, last_logged_in_at, previous_last_logged_in_at, trainer_id, must_change_password, terms_accepted, terms_accepted_at')
      .eq('user_id', resolvedUserId)
      .maybeSingle()

    if (error) {
      if (isMissingProfileColumnError(error, ['friendly_name', 'application_name', 'gym_brand', 'gym_club_id', 'last_logged_in_at', 'previous_last_logged_in_at', 'roles', 'trainer_id', 'must_change_password', 'terms_accepted', 'terms_accepted_at'])) {
        return createEmptyProfileSnapshot()
      }

      logger.error('[Supabase] Could not load profile snapshot', error)
      return createEmptyProfileSnapshot()
    }

    const profileData = data && typeof data === 'object' ? data as Record<string, unknown> : null
    const gymBrand = typeof profileData?.gym_brand === 'string' ? profileData.gym_brand.trim() || null : null
    const gymName = typeof profileData?.gym_name === 'string' ? profileData.gym_name.trim() || null : null
    const gymClubId = typeof profileData?.gym_club_id === 'number' && Number.isFinite(profileData.gym_club_id)
      ? String(profileData.gym_club_id)
      : null
    const profileRoles = await loadSupabaseUserRoles(client, resolvedUserId)

    const snapshot = {
      friendlyName: typeof profileData?.friendly_name === 'string' ? profileData.friendly_name.trim() || null : null,
      applicationName: typeof profileData?.application_name === 'string' ? profileData.application_name.trim() || null : null,
      gymBrand,
      gymName: gymName ?? gymClubId,
      gymClubId,
      accountTier: normalizeProfileAccessTier(profileData?.account_tier),
      accessEndsAt: typeof profileData?.access_ends_at === 'string' ? profileData.access_ends_at : null,
      isFrozen: Boolean(profileData?.is_frozen),
      lastLoggedInAt: typeof profileData?.last_logged_in_at === 'string' ? profileData.last_logged_in_at : null,
      previousLastLoggedInAt: typeof profileData?.previous_last_logged_in_at === 'string' ? profileData.previous_last_logged_in_at : null,
      mustChangePassword: Boolean(profileData?.must_change_password),
      termsAccepted: Boolean(profileData?.terms_accepted),
      termsAcceptedAt: typeof profileData?.terms_accepted_at === 'string' ? profileData.terms_accepted_at : null,
      roles: profileRoles,
      trainerId: typeof profileData?.trainer_id === 'string' ? profileData.trainer_id : null,
    }

    if (localCachedSnapshot && (!data || error)) {
      return localCachedSnapshot
    }

    await persistSupabaseProfileSnapshotToLocalCache(resolvedUserId, snapshot)
    return snapshot
  })()

  profileSnapshotCache.set(cacheKey, requestPromise)
  return requestPromise
}

export async function loadSupabaseProfileName(): Promise<string | null> {
  const snapshot = await loadSupabaseProfileSnapshot()
  return snapshot.friendlyName
}

export async function loadSupabaseProfileAccessState(userId?: string): Promise<{ accountTier: SupabaseAccessTier; accessEndsAt: string | null; isFrozen: boolean; isBlocked: boolean; blockReason: 'frozen' | 'expired' | null }> {
  const snapshot = await loadSupabaseProfileSnapshot(userId)
  const now = Date.now()

  if (snapshot.isFrozen) {
    return { accountTier: snapshot.accountTier, accessEndsAt: snapshot.accessEndsAt, isFrozen: snapshot.isFrozen, isBlocked: true, blockReason: 'frozen' }
  }

  if (snapshot.accessEndsAt) {
    const accessEndsAt = new Date(snapshot.accessEndsAt)

    if (!Number.isNaN(accessEndsAt.getTime()) && accessEndsAt.getTime() <= now) {
      return { accountTier: snapshot.accountTier, accessEndsAt: snapshot.accessEndsAt, isFrozen: snapshot.isFrozen, isBlocked: true, blockReason: 'expired' }
    }
  }

  return { accountTier: snapshot.accountTier, accessEndsAt: snapshot.accessEndsAt, isFrozen: snapshot.isFrozen, isBlocked: false, blockReason: null }
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
    .from('gym_pilot_profile')
    .select('id, user_id, friendly_name, application_name, gym_brand, gym_name, account_tier, access_ends_at, is_frozen, trainer_id, must_change_password, created_at, updated_at')

  if (error && isMissingProfileColumnError(error, ['trainer_id', 'gym_brand'])) {
    const fallback = await client
      .from('gym_pilot_profile')
      .select('id, user_id, friendly_name, application_name, gym_name, account_tier, access_ends_at, is_frozen, must_change_password, created_at, updated_at')

    if (fallback.error) {
      logger.error('[Supabase] Could not load profiles', fallback.error)
      return []
    }

    const fallbackProfiles = ((fallback.data ?? []) as Array<{
      id: string
      user_id: string
      friendly_name: string | null
      must_change_password: boolean
      created_at?: string
      updated_at?: string
    }>).filter((profile) => typeof profile.user_id === 'string')

    return fallbackProfiles.map((profile) => mapSupabaseProfile({
      id: profile.id,
      user_id: profile.user_id,
      friendly_name: typeof profile.friendly_name === 'string' ? profile.friendly_name : null,
      application_name: null,
      gym_brand: null,
      gym_name: null,
      trainer_id: null,
      must_change_password: Boolean(profile.must_change_password),
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }))
  }

  if (error) {
    logger.error('[Supabase] Could not load profiles', error)
    return []
  }

  const profileRows = ((data ?? []) as Array<{
    id: string
    user_id: string
    friendly_name: string | null
    must_change_password: boolean
    created_at?: string
    updated_at?: string
  }>).filter((profile) => typeof profile.user_id === 'string')

  const profiles: SupabaseProfile[] = []
  const roleLookup = await loadSupabaseUserRolesByUserIds(client, profileRows.map((profile) => profile.user_id))

  for (const profile of profileRows) {
    profiles.push(mapSupabaseProfile({
      id: profile.id,
      user_id: profile.user_id,
      friendly_name: typeof profile.friendly_name === 'string' ? profile.friendly_name : null,
      application_name: null,
      gym_brand: null,
      gym_name: null,
      trainer_id: null,
      must_change_password: Boolean(profile.must_change_password),
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }, roleLookup.get(profile.user_id) ?? []))
  }

  if (!profiles.some((profile) => profile.user_id === userId)) {
    const { error: upsertError } = await client.from('gym_pilot_profile').upsert(
      { user_id: userId, friendly_name: null, application_name: null, gym_brand: null, trainer_id: null, must_change_password: false },
      { onConflict: 'user_id' },
    )

    if (upsertError && isMissingProfileColumnError(upsertError, ['trainer_id', 'gym_brand'])) {
      const fallback = await client.from('gym_pilot_profile').upsert(
        { user_id: userId, friendly_name: null, application_name: null, must_change_password: false },
        { onConflict: 'user_id' },
      )

      if (fallback.error) {
        logger.error('[Supabase] Could not create profile row for current user', fallback.error)
        return profiles
      }
    } else if (upsertError) {
      logger.error('[Supabase] Could not create profile row for current user', upsertError)
      return profiles
    }

    const { data: refreshedData, error: refreshError } = await client
      .from('gym_pilot_profile')
      .select('id, user_id, friendly_name, application_name, gym_brand, gym_name, account_tier, access_ends_at, is_frozen, trainer_id, must_change_password, created_at, updated_at')

    if (refreshError) {
      logger.error('[Supabase] Could not reload profiles after creating the current user row', refreshError)
      return profiles
    }

    const refreshedRows = ((refreshedData ?? []) as Array<{
      id: string
      user_id: string
      friendly_name: string | null
      must_change_password: boolean
      created_at?: string
      updated_at?: string
    }>).filter((profile) => typeof profile.user_id === 'string')
    const refreshedRoleLookup = await loadSupabaseUserRolesByUserIds(client, refreshedRows.map((profile) => profile.user_id))

    return refreshedRows.map((profile) => mapSupabaseProfile({
      id: profile.id,
      user_id: profile.user_id,
      friendly_name: typeof profile.friendly_name === 'string' ? profile.friendly_name : null,
      application_name: null,
      gym_brand: null,
      gym_name: null,
      trainer_id: null,
      must_change_password: Boolean(profile.must_change_password),
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }, refreshedRoleLookup.get(profile.user_id) ?? []))
  }

  return profiles
}

export async function loadSupabaseProfileRoles(userId: string): Promise<UserRole[]> {
  const client = getSupabaseClient()

  if (!client) {
    return []
  }

  return loadSupabaseUserRoles(client, userId)
}

export async function saveSupabaseProfileRoles(
  roles: Array<UserRole | string> | UserRole | null | undefined,
  userId?: string,
  clientOverride?: SupabaseClient,
) {
  const client = clientOverride ?? getSupabaseClient()

  if (!client) {
    return
  }

  const resolvedUserId = userId || await getAuthenticatedUserId(client)

  if (!resolvedUserId) {
    return
  }

  const roleRows = buildSupabaseUserRoleRows(resolvedUserId, roles)

  const { error: deleteError } = await client
    .from('gym_pilot_user_role')
    .delete()
    .eq('user_id', resolvedUserId)

  if (deleteError) {
    if (isMissingProfileColumnError(deleteError, ['role'])) {
      return
    }

    logger.error('[Supabase] Could not clear existing user roles', deleteError)
    return
  }

  if (roleRows.length === 0) {
    await invalidateSupabaseProfileCache(resolvedUserId)
    return
  }

  const { error: insertError } = await client
    .from('gym_pilot_user_role')
    .insert(roleRows)

  if (insertError) {
    if (isMissingProfileColumnError(insertError, ['role'])) {
      return
    }

    logger.error('[Supabase] Could not save user roles', insertError)
    return
  }

  await invalidateSupabaseProfileCache(resolvedUserId)
}

export async function loadSupabaseProfileFlag(flag: 'must_change_password', userId?: string): Promise<boolean> {
  if (flag !== 'must_change_password') {
    return false
  }

  const snapshot = await loadSupabaseProfileSnapshot(userId)
  return snapshot.mustChangePassword
}

export async function loadSupabaseProfileTermsAcceptance(userId?: string): Promise<boolean> {
  const snapshot = await loadSupabaseProfileSnapshot(userId)
  return snapshot.termsAccepted
}

export function buildSupabaseProfileTermsAcceptancePayload(userId: string, accepted: boolean, acceptedAt?: string | null) {
  return {
    user_id: userId,
    terms_accepted: Boolean(accepted),
    terms_accepted_at: accepted ? acceptedAt ?? new Date().toISOString() : null,
  }
}

async function invalidateSupabaseProfileCache(userId?: string) {
  if (!userId) {
    profileSnapshotCache.clear()
    return
  }

  profileSnapshotCache.delete(`profile:${userId}`)

  try {
    await saveDexieJsonRecord(getSupabaseProfileLocalStorageKey(userId), null)
  } catch (error) {
    logger.warn('[Supabase] Could not clear local profile snapshot cache', error)
  }
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

  const { error } = await client.from('gym_pilot_profile').upsert(
    { user_id: userId, friendly_name: normalizedName },
    { onConflict: 'user_id' },
  )

  if (error) {
    logger.error('[Supabase] Could not save profile name', error)
    return
  }

  await invalidateSupabaseProfileCache(userId)
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

  const { error } = await client.from('gym_pilot_profile').upsert(
    { user_id: resolvedUserId, [fieldName]: normalizedValue },
    { onConflict: 'user_id' },
  )

  if (error) {
    if (isMissingProfileColumnError(error, [fieldName])) {
      return
    }

    logger.error(`[Supabase] Could not save profile field ${fieldName}`, error)
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

  const { error } = await client.from('gym_pilot_profile').upsert(
    { user_id: resolvedUserId, gym_name: normalizedGymName, gym_club_id: normalizedClubId },
    { onConflict: 'user_id' },
  )

  if (error) {
    if (isMissingProfileColumnError(error, ['gym_name', 'gym_club_id'])) {
      return
    }

    logger.error('[Supabase] Could not save profile gym name', error)
    return
  }

  invalidateSupabaseProfileCache(resolvedUserId)
}

export async function saveSupabaseProfileAccessSettings(accountTier: string | null, accessEndsAt: string | null, isFrozen: boolean, userId?: string) {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const resolvedUserId = userId || await getAuthenticatedUserId(client)

  if (!resolvedUserId) {
    return
  }

  const normalizedTier = normalizeProfileAccessTier(accountTier)
  const trimmedAccessEndsAt = typeof accessEndsAt === 'string' ? accessEndsAt.trim() : ''

  const { error } = await client.from('gym_pilot_profile').upsert(
    { user_id: resolvedUserId, account_tier: normalizedTier, access_ends_at: trimmedAccessEndsAt || null, is_frozen: Boolean(isFrozen) },
    { onConflict: 'user_id' },
  )

  if (error) {
    logger.error('[Supabase] Could not save profile access settings', error)
    return
  }

  await invalidateSupabaseProfileCache(resolvedUserId)
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

  const { error } = await client.from('gym_pilot_profile').upsert(
    { user_id: resolvedUserId, [flag]: value },
    { onConflict: 'user_id' },
  )

  if (error) {
    logger.error('[Supabase] Could not save profile flag', error)
    return
  }

  await invalidateSupabaseProfileCache(resolvedUserId)
}

export async function saveSupabaseProfileTermsAcceptance(accepted: boolean, userId?: string) {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const resolvedUserId = userId || await getAuthenticatedUserId(client)

  if (!resolvedUserId) {
    return
  }

  const payload = buildSupabaseProfileTermsAcceptancePayload(resolvedUserId, accepted)
  const { error } = await client.from('gym_pilot_profile').upsert(payload, { onConflict: 'user_id' })

  if (error) {
    if (isMissingProfileColumnError(error, ['terms_accepted', 'terms_accepted_at'])) {
      return
    }

    logger.error('[Supabase] Could not save terms acceptance', error)
    return
  }

  invalidateSupabaseProfileCache(resolvedUserId)
}

export function shouldRecordLoginActivity(previousLastLoggedInAt: string | null | undefined, nextLastLoggedInAt: string | null | undefined) {
  if (!nextLastLoggedInAt) {
    return false
  }

  if (!previousLastLoggedInAt) {
    return true
  }

  return previousLastLoggedInAt !== nextLastLoggedInAt
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
    .from('gym_pilot_profile')
    .select('last_logged_in_at')
    .eq('user_id', resolvedUserId)
    .maybeSingle()

  if (loadError) {
    logger.error('[Supabase] Could not load existing profile login timestamp', loadError)
    return
  }

  const previousLastLoggedInAt = existingProfile?.last_logged_in_at ?? null
  const nextLastLoggedInAt = new Date().toISOString()
  const shouldRecord = shouldRecordLoginActivity(previousLastLoggedInAt, nextLastLoggedInAt)

  const { error } = await client.from('gym_pilot_profile').upsert(
    {
      user_id: resolvedUserId,
      last_logged_in_at: nextLastLoggedInAt,
      previous_last_logged_in_at: previousLastLoggedInAt,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    logger.error('[Supabase] Could not save profile last logged in timestamp', error)
    return
  }

  await invalidateSupabaseProfileCache(resolvedUserId)

  if (shouldRecord) {
    await recordSupabaseUserActivity('login', {}, resolvedUserId)
  }
}

export async function loadSupabaseJsonRecord<T>(key: string): Promise<SupabaseRecordResponse<T>> {
  logger.info('[Supabase] Loading remote record', { key })
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
      .from('gym_pilot_plan')
      .select('id, plan_name, plan_slug, plan_sessions, created_at, updated_at')
      .eq('user_id', userId)

    if (error) {
      logger.error('[Supabase] Remote plans load failed', { key, error })
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
      .from('gym_pilot_assignment')
      .select('id, assignment_name, plan_id, plan_name, plan_slug, plan_items, assigned_user_id, assigned_user_name, completed_exercises')
      .eq('user_id', userId)

    if (error) {
      logger.error('[Supabase] Remote assignments load failed', { key, error })
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
      .from('gym_pilot_favourite_folder')
      .select('id,name')
      .eq('user_id', userId)

    if (folderError) {
      logger.error('[Supabase] Remote favorite folders load failed', { key, error: folderError })
      throw folderError
    }

    const folderLookup = new Map((folderRows ?? []).map((row) => [row.id, row.name]))

    const { data, error } = await client
      .from('gym_pilot_favourite')
      .select('path,label,folder,folder_id')
      .eq('user_id', userId)

    if (error) {
      logger.error('[Supabase] Remote favorites load failed', { key, error })
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

    logger.info('[Supabase] Remote favorites loaded', { key, favorites, folders })
    return { found: true, value: payload as T }
  }

  const { data, error } = await client
    .from(getSupabaseTableName(key))
    .select('value')
    .eq('key', key)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    logger.error('[Supabase] Remote record load failed', { key, error })
    throw error
  }

  if (!data?.value) {
    logger.info('[Supabase] Remote record not found', { key })
    return { found: false, value: null }
  }

  logger.info('[Supabase] Remote record loaded', { key, value: data.value })
  return {
    found: true,
    value: JSON.parse(data.value) as T,
  }
}

export async function saveSupabaseJsonRecord<T>(key: string, value: T) {
  logger.info('[Supabase] Saving remote record', { key, value })
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

    const { error: deleteError } = await client.from('gym_pilot_plan').delete().eq('user_id', userId)

    if (deleteError) {
      throw deleteError
    }

    if (plans.length > 0) {
      const { error: insertError } = await client.from('gym_pilot_plan').insert(
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

    const { error: deleteError } = await client.from('gym_pilot_assignment').delete().eq('user_id', userId)

    if (deleteError) {
      throw deleteError
    }

    if (assignments.length > 0) {
      const { error: insertError } = await client.from('gym_pilot_assignment').insert(
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

    const { error: deleteFavoritesError } = await client.from('gym_pilot_favourite').delete().eq('user_id', userId)

    if (deleteFavoritesError) {
      throw deleteFavoritesError
    }

    const { error: deleteFoldersError } = await client.from('gym_pilot_favourite_folder').delete().eq('user_id', userId)

    if (deleteFoldersError) {
      throw deleteFoldersError
    }

    const folderRows = folderNames.length > 0
      ? await client.from('gym_pilot_favourite_folder').upsert(
        folderNames.map((name) => ({ user_id: userId, name })),
        { onConflict: 'user_id,name' },
      ).select('id,name')
      : { data: [] as Array<{ id: string; name: string }>, error: null }

    if (folderRows.error) {
      throw folderRows.error
    }

    const folderLookup = new Map((folderRows.data ?? []).map((row) => [row.name, row.id]))

    if (favorites.length > 0) {
      const { error: insertError } = await client.from('gym_pilot_favourite').insert(
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
  logger.info('[Supabase] Removing remote record', { key })
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const userId = await getAuthenticatedUserId(client)

  if (!userId) {
    return
  }

  if (isFavoritesKey(key)) {
    const { error: favoritesError } = await client.from('gym_pilot_favourite').delete().eq('user_id', userId)

    if (favoritesError) {
      throw favoritesError
    }

    const { error: foldersError } = await client.from('gym_pilot_favourite_folder').delete().eq('user_id', userId)

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

export function isLocalhostHost(hostname?: string) {
  if (!hostname) {
    return false
  }

  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]' || hostname === '0.0.0.0' || hostname.endsWith('.localhost')
}

export function shouldRecordSupabaseUserActivity() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : undefined
  return !isLocalhostHost(hostname)
}

export async function recordSupabaseUserActivity(eventType: string, eventData: Record<string, unknown> = {}, userId?: string) {
  if (!shouldRecordSupabaseUserActivity()) {
    logger.info('[Supabase] Skipping user activity recording on localhost host')
    return
  }

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
    logger.error('[Supabase] Could not record user activity', error)
  }
}

export type AttendanceHistoryEntry = {
  id: string
  userId?: string
  sessionId?: string | null
  classId?: string | null
  className?: string | null
  instructorName?: string | null
  startedAt?: string | null
  attendanceType: 'attended' | 'taught'
  notes?: string | null
  rating?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

type SupabaseAttendanceHistoryRow = {
  id: string
  user_id?: string | null
  session_id?: string | null
  class_id?: string | null
  class_name?: string | null
  instructor_name?: string | null
  started_at?: string | null
  attendance_type?: 'attended' | 'taught' | null
  notes?: string | null
  rating?: number | null
  created_at?: string | null
  updated_at?: string | null
}

const ATTENDANCE_HISTORY_STORAGE_KEY = 'gym-pilot.timetable-attendance-history'

export function getAttendanceHistoryTableName() {
  return 'gym_pilot_class_attendance'
}

function createAttendanceHistoryEntryId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `attendance-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function loadAttendanceHistoryRecordsFromStorage(): AttendanceHistoryEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  const storedValue = window.localStorage.getItem(ATTENDANCE_HISTORY_STORAGE_KEY)

  if (!storedValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(storedValue) as unknown

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter((record): record is AttendanceHistoryEntry => Boolean(record) && typeof record === 'object' && typeof (record as AttendanceHistoryEntry).id === 'string')
  } catch {
    return []
  }
}

function persistAttendanceHistoryRecords(records: AttendanceHistoryEntry[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ATTENDANCE_HISTORY_STORAGE_KEY, JSON.stringify(records))
}

export function mapAttendanceHistoryEntryFromSupabase(row: SupabaseAttendanceHistoryRow): AttendanceHistoryEntry {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    sessionId: row.session_id ?? null,
    classId: row.class_id ?? null,
    className: row.class_name ?? null,
    instructorName: row.instructor_name ?? null,
    startedAt: row.started_at ?? null,
    attendanceType: row.attendance_type === 'taught' ? 'taught' : 'attended',
    notes: row.notes ?? null,
    rating: typeof row.rating === 'number' ? row.rating : null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

export function formatAttendanceHistoryError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    const message = (error as { message: string }).message
    if (message.trim().length > 0) {
      return message
    }
  }

  return 'We could not load your attendance history right now.'
}

export async function loadAttendanceHistoryEntries(userId?: string): Promise<AttendanceHistoryEntry[]> {
  const client = getSupabaseClient()

  if (client) {
    const resolvedUserId = userId || await getAuthenticatedUserId(client)

    if (resolvedUserId) {
      const { data, error } = await client
        .from(getAttendanceHistoryTableName())
        .select('id, user_id, session_id, class_id, class_name, instructor_name, started_at, attendance_type, notes, rating, created_at')
        .eq('user_id', resolvedUserId)
        .order('created_at', { ascending: false })

      if (!error && Array.isArray(data)) {
        const remoteEntries = data.map((row) => mapAttendanceHistoryEntryFromSupabase(row as SupabaseAttendanceHistoryRow))
        persistAttendanceHistoryRecords(remoteEntries)
        return remoteEntries
      }

      if (error) {
        logger.warn('[Supabase] Could not load attendance history', error)
      }
    }
  }

  const records = loadAttendanceHistoryRecordsFromStorage()

  if (!userId) {
    return records
  }

  return records.filter((record) => record.userId === userId)
}

export async function saveAttendanceHistoryEntry(entry: AttendanceHistoryEntry, userId?: string): Promise<AttendanceHistoryEntry[]> {
  const client = getSupabaseClient()
  const resolvedUserId = userId || (client ? await getAuthenticatedUserId(client) : null)

  if (client && resolvedUserId) {
    const { error } = await client
      .from(getAttendanceHistoryTableName())
      .upsert({
        id: entry.id,
        user_id: resolvedUserId,
        session_id: entry.sessionId ?? null,
        class_id: entry.classId ?? null,
        class_name: entry.className ?? null,
        instructor_name: entry.instructorName ?? null,
        started_at: entry.startedAt ?? null,
        attendance_type: entry.attendanceType,
        notes: entry.notes ?? null,
        rating: entry.rating ?? null,
        created_at: entry.createdAt ?? null,
      }, { onConflict: 'id' })

    if (!error) {
      const nextRecords = upsertAttendanceHistoryEntry(loadAttendanceHistoryRecordsFromStorage(), entry)
      persistAttendanceHistoryRecords(nextRecords)
      return nextRecords
    }

    logger.warn('[Supabase] Could not persist updated attendance history entry', error)
  }

  const nextRecords = upsertAttendanceHistoryEntry(loadAttendanceHistoryRecordsFromStorage(), entry)
  persistAttendanceHistoryRecords(nextRecords)
  return nextRecords
}

export async function deleteAttendanceHistoryEntry(entryId: string, userId?: string): Promise<AttendanceHistoryEntry[]> {
  const client = getSupabaseClient()
  const resolvedUserId = userId || (client ? await getAuthenticatedUserId(client) : null)

  if (client && resolvedUserId) {
    const { error } = await client.from(getAttendanceHistoryTableName()).delete().eq('id', entryId).eq('user_id', resolvedUserId)

    if (!error) {
      const nextRecords = removeAttendanceHistoryEntry(loadAttendanceHistoryRecordsFromStorage(), entryId)
      persistAttendanceHistoryRecords(nextRecords)
      return nextRecords
    }

    logger.warn('[Supabase] Could not delete attendance history entry', error)
  }

  const nextRecords = removeAttendanceHistoryEntry(loadAttendanceHistoryRecordsFromStorage(), entryId)
  persistAttendanceHistoryRecords(nextRecords)
  return nextRecords
}

export function upsertAttendanceHistoryEntry(
  records: AttendanceHistoryEntry[],
  entry: AttendanceHistoryEntry,
): AttendanceHistoryEntry[] {
  const next = records.filter((candidate) => candidate.id !== entry.id)
  return [...next, entry]
}

export function removeAttendanceHistoryEntry(
  records: AttendanceHistoryEntry[],
  entryId: string,
): AttendanceHistoryEntry[] {
  return records.filter((candidate) => candidate.id !== entryId)
}

export async function saveTimetableAttendance(input: {
  userId?: string
  sessionId?: string | number | null
  classId?: string | number | null
  className?: string | null
  instructorName?: string | null
  startedAt?: string | null
  attendanceType: 'attended' | 'taught'
  notes?: string | null
  rating?: number | null
}) {
  const client = getSupabaseClient()

  if (!client) {
    return { success: false as const, error: new Error('Supabase client is not available') }
  }

  const resolvedUserId = input.userId || await getAuthenticatedUserId(client)

  if (!resolvedUserId) {
    return { success: false as const, error: new Error('Unable to resolve the current user') }
  }

  let existingId: string | null = null
  let tableExists = true

  if (input.sessionId != null || (input.classId != null && input.startedAt != null)) {
    let query = client
      .from(getAttendanceHistoryTableName())
      .select('id')
      .eq('user_id', resolvedUserId)

    if (input.sessionId != null) {
      query = query.eq('session_id', String(input.sessionId))
    } else {
      query = query.eq('class_id', String(input.classId)).eq('started_at', input.startedAt)
    }

    const { data: existingData, error: selectError } = await query.limit(1)
    if (selectError) {
      const isMissingTable = selectError.message?.includes("Could not find the table") || selectError.message?.includes('does not exist')
      if (isMissingTable) {
        tableExists = false
      }
    } else if (existingData && existingData.length > 0) {
      existingId = existingData[0].id
    }
  }

  let dbResult: { data: any[] | null; error: any } = { data: null, error: null }

  if (!tableExists) {
    dbResult.error = { message: `Could not find the table ${getAttendanceHistoryTableName()}` }
  } else if (existingId) {
    dbResult = await client
      .from(getAttendanceHistoryTableName())
      .update({
        class_name: input.className ?? null,
        instructor_name: input.instructorName?.trim() ? input.instructorName.trim() : null,
        attendance_type: input.attendanceType,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        rating: input.rating ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingId)
      .select()
  } else {
    dbResult = await client
      .from(getAttendanceHistoryTableName())
      .insert({
        user_id: resolvedUserId,
        session_id: input.sessionId != null ? String(input.sessionId) : null,
        class_id: input.classId != null ? String(input.classId) : null,
        class_name: input.className ?? null,
        instructor_name: input.instructorName?.trim() ? input.instructorName.trim() : null,
        started_at: input.startedAt ?? null,
        attendance_type: input.attendanceType,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        rating: input.rating ?? null,
        created_at: new Date().toISOString(),
      })
      .select()
  }

  const { data, error } = dbResult

  if (error) {
    const isMissingTableError = error.message?.includes("Could not find the table") || error.message?.includes('does not exist')

    if (isMissingTableError) {
      const historyEntry: AttendanceHistoryEntry = {
        id: createAttendanceHistoryEntryId(),
        userId: resolvedUserId,
        sessionId: input.sessionId != null ? String(input.sessionId) : null,
        classId: input.classId != null ? String(input.classId) : null,
        className: input.className ?? null,
        instructorName: input.instructorName?.trim() ? input.instructorName.trim() : null,
        startedAt: input.startedAt ?? null,
        attendanceType: input.attendanceType,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        rating: input.rating ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      logger.warn('[Supabase] gym_pilot_class_attendance table is not available yet; recording attendance as a user activity fallback', error)
      const existingEntries = await loadAttendanceHistoryEntries(resolvedUserId)
      const nextRecords = upsertAttendanceHistoryEntry(existingEntries, historyEntry)
      persistAttendanceHistoryRecords(nextRecords)
      await recordSupabaseUserActivity('timetable_attendance', {
        sessionId: input.sessionId != null ? String(input.sessionId) : null,
        classId: input.classId != null ? String(input.classId) : null,
        className: input.className ?? null,
        instructorName: input.instructorName?.trim() ? input.instructorName.trim() : null,
        startedAt: input.startedAt ?? null,
        attendanceType: input.attendanceType,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        rating: input.rating ?? null,
      }, resolvedUserId)

      return { success: true as const, fallback: true as const }
    }

    logger.error('[Supabase] Could not save timetable attendance', error)
    return { success: false as const, error }
  }

  const insertedRow = data && data[0]
  const historyEntry: AttendanceHistoryEntry = insertedRow
    ? mapAttendanceHistoryEntryFromSupabase(insertedRow as SupabaseAttendanceHistoryRow)
    : {
        id: existingId || createAttendanceHistoryEntryId(),
        userId: resolvedUserId,
        sessionId: input.sessionId != null ? String(input.sessionId) : null,
        classId: input.classId != null ? String(input.classId) : null,
        className: input.className ?? null,
        instructorName: input.instructorName?.trim() ? input.instructorName.trim() : null,
        startedAt: input.startedAt ?? null,
        attendanceType: input.attendanceType,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        rating: input.rating ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

  const existingEntries = await loadAttendanceHistoryEntries(resolvedUserId)
  const nextRecords = upsertAttendanceHistoryEntry(existingEntries, historyEntry)
  persistAttendanceHistoryRecords(nextRecords)

  return { success: true as const }
}

export function getSessionTableName() {
  return 'gym_pilot_session'
}

export function getSessionBookingTableName() {
  return 'gym_pilot_session_booking'
}

export async function createSession(input: {
  gymClubId?: number | null
  sessionType: 'class' | 'personal_training' | 'solo'
  classId?: string | null
  className?: string | null
  trainerId?: string | null
  trainerName?: string | null
  startAt: string
  durationMinutes?: number | null
  location?: string | null
  capacity?: number | null
  price?: number | null
  metadata?: any | null
}) {
  const client = getSupabaseClient()
  if (!client) {
    return { success: false as const, error: new Error('Supabase client is not available') }
  }

  const payload = {
    gym_club_id: input.gymClubId ?? null,
    session_type: input.sessionType,
    class_id: input.classId ?? null,
    class_name: input.className ?? null,
    trainer_id: input.trainerId ?? null,
    trainer_name: input.trainerName ?? null,
    start_at: input.startAt,
    duration_minutes: input.durationMinutes ?? null,
    location: input.location ?? null,
    capacity: input.capacity ?? null,
    price: input.price ?? null,
    metadata: input.metadata ?? null,
    created_at: new Date().toISOString(),
  }

  const { data, error } = await client.from(getSessionTableName()).insert(payload).select()

  if (error) {
    logger.error('[Supabase] Could not create session', error)
    return { success: false as const, error }
  }

  return { success: true as const, session: data && data[0] }
}

export async function bookSession(input: {
  sessionId: string
  userId?: string
  role: 'client' | 'trainer'
  notes?: string | null
}) {
  const client = getSupabaseClient()
  if (!client) {
    return { success: false as const, error: new Error('Supabase client is not available') }
  }

  const resolvedUserId = input.userId || await getAuthenticatedUserId(client)
  if (!resolvedUserId) {
    return { success: false as const, error: new Error('Unable to resolve the current user') }
  }

  const payload = {
    session_id: input.sessionId,
    user_id: resolvedUserId,
    role: input.role,
    status: 'booked',
    notes: input.notes ?? null,
    created_at: new Date().toISOString(),
  }

  const { data, error } = await client.from(getSessionBookingTableName()).insert(payload).select()

  if (error) {
    logger.error('[Supabase] Could not book session', error)
    return { success: false as const, error }
  }

  return { success: true as const, booking: data && data[0] }
}

export async function cancelBooking(input: { bookingId?: string; sessionId?: string; userId?: string }) {
  const client = getSupabaseClient()
  if (!client) {
    return { success: false as const, error: new Error('Supabase client is not available') }
  }

  const resolvedUserId = input.userId || await getAuthenticatedUserId(client)
  if (!resolvedUserId) {
    return { success: false as const, error: new Error('Unable to resolve the current user') }
  }

  let query = client.from(getSessionBookingTableName()).update({ status: 'cancelled', updated_at: new Date().toISOString() })

  if (input.bookingId) {
    query = query.eq('id', input.bookingId).eq('user_id', resolvedUserId)
  } else if (input.sessionId) {
    query = query.eq('session_id', input.sessionId).eq('user_id', resolvedUserId)
  } else {
    return { success: false as const, error: new Error('bookingId or sessionId required') }
  }

  const { data, error } = await query.select()

  if (error) {
    logger.error('[Supabase] Could not cancel booking', error)
    return { success: false as const, error }
  }

  return { success: true as const, bookings: data }
}

export async function listBookings(filters?: { userId?: string; trainerId?: string; from?: string; to?: string; status?: string }) {
  const client = getSupabaseClient()
  if (!client) {
    return [] as any[]
  }

  let query = client.from(getSessionBookingTableName()).select('*, session:session_id(*)')

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.trainerId) {
    // join via session.trainer_id isn't directly available; filter client-side after fetching
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) {
    logger.warn('[Supabase] Could not list bookings', error)
    return []
  }

  let results = Array.isArray(data) ? data : []

  if (filters?.trainerId) {
    results = results.filter((r: any) => r.session && r.session.trainer_id === filters.trainerId)
  }

  if (filters?.from || filters?.to) {
    results = results.filter((r: any) => {
      const start = r.session?.start_at ? new Date(r.session.start_at) : null
      if (!start) return false
      if (filters?.from && start < new Date(filters.from)) return false
      if (filters?.to && start > new Date(filters.to)) return false
      return true
    })
  }

  return results
}
