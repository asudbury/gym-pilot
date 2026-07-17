import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_TABLE = 'gym_pilot_app_state'

let supabaseClient: SupabaseClient | null = null

// The app persists arbitrary JSON payloads as { user_id, key, value } rows.
// These records are stored in the shared app_state table rather than the
// domain-specific tables created for relational data.
const SUPABASE_TABLE_BY_KEY: Record<string, string> = {
  'gym-pilot-plans': DEFAULT_SUPABASE_TABLE,
  'gym-pilot-assignments': DEFAULT_SUPABASE_TABLE,
  'gym-pilot-users': DEFAULT_SUPABASE_TABLE,
}

function getSupabaseUrl() {
  return import.meta.env?.VITE_SUPABASE_URL as string | undefined
}

function getSupabaseAnonKey() {
  return import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined
}


export function isSupabasePersistenceEnabled() {
  const enabledFlag = import.meta.env?.VITE_FEATURE_SUPABASE_PERSISTENCE_ENABLED
  return enabledFlag === 'true' && Boolean(getSupabaseUrl()) && Boolean(getSupabaseAnonKey())
}

export function getSupabaseClient() {
  if (!isSupabasePersistenceEnabled()) {
    console.log('[Supabase] Persistence disabled or client unavailable')
    return null
  }

  if (!supabaseClient) {
    const url = getSupabaseUrl()
    const anonKey = getSupabaseAnonKey()

    if (!url || !anonKey) {
      return null
    }

    console.log('[Supabase] Creating client', { url })
    supabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return supabaseClient
}

export async function signInWithGoogle() {
  console.log('[Supabase] Starting Google OAuth sign-in')
  const client = getSupabaseClient()

  if (!client) {
    console.error('[Supabase] Google sign-in skipped because client is unavailable')
    return { error: new Error('Supabase client is not available') }
  }

  return client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

export async function signInWithPassword(email: string, password: string) {
  console.log('[Supabase] Starting password sign-in')
  const client = getSupabaseClient()

  if (!client) {
    console.error('[Supabase] Password sign-in skipped because client is unavailable')
    return { error: new Error('Supabase client is not available') }
  }

  return client.auth.signInWithPassword({ email, password })
}

export async function signOutFromSupabase() {
  console.log('[Supabase] Signing out')
  const client = getSupabaseClient()

  if (!client) {
    return { error: null }
  }

  const { error } = await client.auth.signOut()

  if (error) {
    console.error('[Supabase] Sign-out failed', error)
  }

  return { error }
}

export async function loadSupabaseProfileName(): Promise<string | null> {
  const client = getSupabaseClient()

  if (!client) {
    return null
  }

  const userId = await getAuthenticatedUserId(client)

  if (!userId) {
    return null
  }

  const { data, error } = await client
    .from('gym_pilot_profiles')
    .select('friendly_name')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[Supabase] Could not load profile name', error)
    return null
  }

  return data?.friendly_name?.trim() || null
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
  }
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

function normalizeFolderName(value?: string) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

function isFavoritesKey(key: string) {
  return key === 'gym-pilot.favorites'
}

function getSupabaseTableName(key: string) {
  if (isFavoritesKey(key)) {
    return 'gym_pilot_favorites'
  }

  return SUPABASE_TABLE_BY_KEY[key] ?? DEFAULT_SUPABASE_TABLE
}

async function getAuthenticatedUserId(client: SupabaseClient): Promise<string | null> {

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

    console.log('[Supabase] Remote favorites loaded', { key, favorites })
    return { found: true, value: favorites as T }
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

  if (isFavoritesKey(key)) {
    const favorites = Array.isArray(value)
      ? (value as FavoriteLink[]).filter((item): item is FavoriteLink => Boolean(item && typeof item === 'object' && typeof item.path === 'string' && typeof item.label === 'string'))
      : []

    const folderNames = Array.from(new Set(favorites.map((favorite) => normalizeFolderName(favorite.folder)).filter(Boolean)))

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
