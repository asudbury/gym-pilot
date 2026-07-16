import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_TABLE = 'gym-pilot-app-state'

let supabaseClient: SupabaseClient | null = null

// Each Supabase table uses the same simple row shape: { key, value }.
// No separate "records" wrapper table is required for this setup.
const SUPABASE_TABLE_BY_KEY: Record<string, string> = {
  'gym-pilot-plans': 'gym-pilot-plans',
  'gym-pilot-assignments': 'gym-pilot-assignments',
  'gym-pilot-users': 'gym-pilot-users',
  'gym-pilot-auth-session': 'gym-pilot-auth-sessions',
  'gym-pilot-auth-bypass': 'gym-pilot-auth-bypass',
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
    return null
  }

  if (!supabaseClient) {
    const url = getSupabaseUrl()
    const anonKey = getSupabaseAnonKey()

    if (!url || !anonKey) {
      return null
    }

    supabaseClient = createClient(url, anonKey)
  }

  return supabaseClient
}

type SupabaseRecordResponse<T> = {
  found: boolean
  value: T | null
}

function getSupabaseTableName(key: string) {
  return SUPABASE_TABLE_BY_KEY[key] ?? DEFAULT_SUPABASE_TABLE
}

export async function loadSupabaseJsonRecord<T>(key: string): Promise<SupabaseRecordResponse<T>> {
  const client = getSupabaseClient()

  if (!client) {
    return { found: false, value: null }
  }

  const { data, error } = await client
    .from(getSupabaseTableName(key))
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data?.value) {
    return { found: false, value: null }
  }

  return {
    found: true,
    value: JSON.parse(data.value) as T,
  }
}

export async function saveSupabaseJsonRecord<T>(key: string, value: T) {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const json = JSON.stringify(value)

  const { error } = await client.from(getSupabaseTableName(key)).upsert(
    { key, value: json },
    { onConflict: 'key' },
  )

  if (error) {
    throw error
  }
}

export async function removeSupabaseJsonRecord(key: string) {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const { error } = await client.from(getSupabaseTableName(key)).delete().eq('key', key)

  if (error) {
    throw error
  }
}
