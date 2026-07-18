import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null
let supabaseClientNoPersist: SupabaseClient | null = null

export type SupabaseAuthUser = {
  id: string
  email: string | null
  created_at?: string
  last_sign_in_at?: string | null
  user_metadata?: Record<string, unknown>
}

function getSupabaseUrl() {
  return import.meta.env?.VITE_SUPABASE_URL as string | undefined
}

function getSupabaseAnonKey() {
  return import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined
}

function getSupabaseServiceRoleKey() {
  return import.meta.env?.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined
}

function getSupabaseAdminClient() {
  const url = getSupabaseUrl()
  const serviceRoleKey = getSupabaseServiceRoleKey()

  if (!url || !serviceRoleKey) {
    return null
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function isSupabasePersistenceEnabled() {
  const enabledFlag = import.meta.env?.VITE_FEATURE_SUPABASE_PERSISTENCE_ENABLED

  if (enabledFlag === 'false') {
    return false
  }

  return Boolean(getSupabaseUrl()) && Boolean(getSupabaseAnonKey())
}

type SupabaseClientOptions = {
  persistSession?: boolean
  autoRefreshToken?: boolean
}

export function getSupabaseClient(options?: SupabaseClientOptions) {
  if (!isSupabasePersistenceEnabled()) {
    console.log('[Supabase] Persistence disabled or client unavailable')
    return null
  }

  const shouldPersistSession = options?.persistSession ?? true
  const shouldAutoRefreshToken = options?.autoRefreshToken ?? true
  const targetClient = shouldPersistSession ? supabaseClient : supabaseClientNoPersist

  if (!targetClient) {
    const url = getSupabaseUrl()
    const anonKey = getSupabaseAnonKey()

    if (!url || !anonKey) {
      return null
    }

    console.log('[Supabase] Creating client', { url, persistSession: shouldPersistSession, autoRefreshToken: shouldAutoRefreshToken })

    const nextClient = createClient(url, anonKey, {
      auth: {
        persistSession: shouldPersistSession,
        autoRefreshToken: shouldAutoRefreshToken,
        detectSessionInUrl: true,
      },
    })

    if (shouldPersistSession) {
      supabaseClient = nextClient
    } else {
      supabaseClientNoPersist = nextClient
    }

    return nextClient
  }

  return targetClient
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

export async function signUpWithPassword(email: string, password: string, options?: { passwordChangeRequired?: boolean; persistSession?: boolean }) {
  console.log('[Supabase] Creating password-based account', { email, passwordChangeRequired: options?.passwordChangeRequired, persistSession: options?.persistSession })
  const client = getSupabaseClient({ persistSession: options?.persistSession ?? false, autoRefreshToken: false })

  if (!client) {
    console.error('[Supabase] Account creation skipped because client is unavailable')
    return { error: new Error('Supabase client is not available') }
  }

  return client.auth.signUp({
    email,
    password,
    options: {
      data: {
        password_change_required: Boolean(options?.passwordChangeRequired),
      },
    },
  })
}

async function getCurrentSessionSupabaseUser(): Promise<SupabaseAuthUser | null> {
  const client = getSupabaseClient()

  if (!client) {
    return null
  }

  try {
    const { data: { session }, error } = await client.auth.getSession()

    if (error) {
      console.warn('[Supabase] Could not read current session for auth user lookup', error)
      return null
    }

    const sessionUser = session?.user

    if (!sessionUser) {
      return null
    }

    return {
      id: sessionUser.id,
      email: sessionUser.email ?? null,
      created_at: sessionUser.created_at,
      last_sign_in_at: sessionUser.last_sign_in_at ?? null,
      user_metadata: sessionUser.user_metadata ?? undefined,
    }
  } catch (error) {
    console.warn('[Supabase] Session-based auth user lookup failed', error)
    return null
  }
}

export async function listSupabaseAuthUsers(): Promise<SupabaseAuthUser[]> {
  console.log('[Supabase] Listing auth users')
  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    console.warn('[Supabase] Admin client unavailable; using current session user as fallback for auth user lookup')
    const currentUser = await getCurrentSessionSupabaseUser()
    return currentUser ? [currentUser] : []
  }

  const { data, error } = await adminClient.auth.admin.listUsers()

  if (error) {
    console.error('[Supabase] Could not list auth users', error)
    const currentUser = await getCurrentSessionSupabaseUser()
    return currentUser ? [currentUser] : []
  }

  const authUsers = (data.users ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? null,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
    user_metadata: user.user_metadata ?? undefined,
  }))

  if (authUsers.length > 0) {
    return authUsers
  }

  const currentUser = await getCurrentSessionSupabaseUser()
  return currentUser ? [currentUser] : []
}

export async function resetSupabasePassword(email: string) {
  console.log('[Supabase] Sending password reset email')
  const client = getSupabaseClient()

  if (!client) {
    console.error('[Supabase] Password reset skipped because client is unavailable')
    return { error: new Error('Supabase client is not available') }
  }

  return client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}

export async function changeSupabasePassword(newPassword: string) {
  console.log('[Supabase] Changing password for current user')
  const client = getSupabaseClient()

  if (!client) {
    console.error('[Supabase] Password change skipped because client is unavailable')
    return { error: new Error('Supabase client is not available') }
  }

  return client.auth.updateUser({ password: newPassword })
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

