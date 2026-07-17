import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_TABLE = 'gym_pilot_app_state'

let supabaseClient: SupabaseClient | null = null

// The app persists arbitrary JSON payloads as { user_id, key, value } rows.
// These records are stored in the shared app_state table rather than the
// domain-specific tables created for relational data.
const SUPABASE_TABLE_BY_KEY: Record<string, string> = {
  'gym-pilot-plans': 'gym_pilot_plans',
  'gym-pilot-assignments': 'gym_pilot_assignments',
  'gym-pilot-users': 'gym_pilot_users',
}

function getSupabaseUrl() {
  return import.meta.env?.VITE_SUPABASE_URL as string | undefined
}

function getSupabaseAnonKey() {
  return import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined
}

function isDummyAuthEnabled() {
  return import.meta.env?.VITE_FEATURE_DUMMY_AUTH_ENABLED === 'true'
}

export function isSupabasePersistenceEnabled() {
  const enabledFlag = import.meta.env?.VITE_FEATURE_SUPABASE_PERSISTENCE_ENABLED

  return enabledFlag === 'true' && !isDummyAuthEnabled() && Boolean(getSupabaseUrl()) && Boolean(getSupabaseAnonKey())
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

type SupabaseRecordResponse<T> = {
  found: boolean
  value: T | null
}

function getSupabaseTableName(key: string) {
  return SUPABASE_TABLE_BY_KEY[key] ?? DEFAULT_SUPABASE_TABLE
}

async function getAuthenticatedUserId(client: SupabaseClient): Promise<string | null> {
  if (isDummyAuthEnabled()) {
    console.log('[Supabase] Dummy auth enabled; skipping authenticated user lookup')
    return null
  }

  try {
    const { data: { user }, error } = await client.auth.getUser()

    if (error) {
      console.warn('[Supabase] Could not resolve authenticated user', error)
      return null
    }

    console.log('[Supabase] Resolved authenticated user', { userId: user?.id ?? null })
    return user?.id ?? null
  } catch {
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

  const { error } = await client.from(getSupabaseTableName(key)).delete().eq('key', key).eq('user_id', userId)

  if (error) {
    throw error
  }
}
