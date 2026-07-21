import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logging'

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
  return (import.meta.env?.VITE_SUPABASE_URL as string | undefined)?.trim() || 'http://127.0.0.1:54321'
}

function getSupabaseAnonKey() {
  return (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
}

function getSupabaseServiceRoleKey() {
  return import.meta.env?.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined
}

export function getSupabaseAdminClient() {
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
    logger.info('[Supabase] Persistence disabled or client unavailable')
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

    logger.info('[Supabase] Creating client', { url, persistSession: shouldPersistSession, autoRefreshToken: shouldAutoRefreshToken })

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
  logger.info('[Supabase] Starting Google OAuth sign-in')
  const client = getSupabaseClient()

  if (!client) {
    logger.error('[Supabase] Google sign-in skipped because client is unavailable')
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
  logger.info('[Supabase] Starting password sign-in')
  const client = getSupabaseClient()

  if (!client) {
    logger.error('[Supabase] Password sign-in skipped because client is unavailable')
    return { error: new Error('Supabase client is not available') }
  }

  return client.auth.signInWithPassword({ email, password })
}

function normalizeAuthEmail(email: string) {
  const trimmedEmail = email?.trim().toLowerCase() ?? ''

  if (!trimmedEmail) {
    return 'user@gym-pilot.local'
  }

  if (trimmedEmail.includes('@')) {
    return trimmedEmail
  }

  const safeBase = trimmedEmail.replace(/\s+/g, '.').replace(/[^a-z0-9._-]/g, '') || 'user'
  return `${safeBase}@gym-pilot.local`
}

export async function signUpWithPassword(email: string, password: string, options?: { passwordChangeRequired?: boolean; persistSession?: boolean }) {
  const normalizedEmail = normalizeAuthEmail(email)
  logger.info('[Supabase] Creating password-based account', { email: normalizedEmail, passwordChangeRequired: options?.passwordChangeRequired, persistSession: options?.persistSession })
  const client = getSupabaseClient({ persistSession: options?.persistSession ?? false, autoRefreshToken: false })

  if (!client) {
    logger.error('[Supabase] Account creation skipped because client is unavailable')
    return { error: new Error('Supabase client is not available') }
  }

  return client.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        password_change_required: Boolean(options?.passwordChangeRequired),
      },
    },
  })
}

export async function ensureAuthenticatedSupabaseSession(
  client: SupabaseClient,
  email: string,
  password: string,
  signUpResult: Awaited<ReturnType<SupabaseClient['auth']['signUp']>>,
) {
  if (signUpResult.error) {
    return signUpResult
  }

  const session = signUpResult.data?.session

  if (session) {
    return signUpResult
  }

  logger.info('[Supabase] Signup did not return a session; signing in with password to establish an auth session')

  const signInResult = await client.auth.signInWithPassword({
    email: normalizeAuthEmail(email),
    password,
  })

  if (signInResult.error || !signInResult.data?.session) {
    return signInResult
  }

  await client.auth.setSession({
    access_token: signInResult.data.session.access_token,
    refresh_token: signInResult.data.session.refresh_token,
  })

  return signInResult
}

async function getCurrentSessionSupabaseUser(): Promise<SupabaseAuthUser | null> {
  const client = getSupabaseClient()

  if (!client) {
    return null
  }

  try {
    const { data: { session }, error } = await client.auth.getSession()

    if (error) {
      logger.warn('[Supabase] Could not read current session for auth user lookup', error)
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
    logger.warn('[Supabase] Session-based auth user lookup failed', error)
    return null
  }
}

export async function listSupabaseAuthUsers(): Promise<SupabaseAuthUser[]> {
  logger.info('[Supabase] Listing auth users')
  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    logger.warn('[Supabase] Admin client unavailable; using current session user as fallback for auth user lookup')
    const currentUser = await getCurrentSessionSupabaseUser()
    return currentUser ? [currentUser] : []
  }

  const { data, error } = await adminClient.auth.admin.listUsers()

  if (error) {
    logger.error('[Supabase] Could not list auth users', error)
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
  logger.info('[Supabase] Sending password reset email')
  const client = getSupabaseClient()

  if (!client) {
    logger.error('[Supabase] Password reset skipped because client is unavailable')
    return { error: new Error('Supabase client is not available') }
  }

  return client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}

export async function changeSupabasePassword(newPassword: string) {
  logger.info('[Supabase] Changing password for current user')
  const client = getSupabaseClient()

  if (!client) {
    logger.error('[Supabase] Password change skipped because client is unavailable')
    return { error: new Error('Supabase client is not available') }
  }

  return client.auth.updateUser({ password: newPassword })
}

export async function signOutFromSupabase() {
  logger.info('[Supabase] Signing out')
  const client = getSupabaseClient()

  if (!client) {
    return { error: null }
  }

  const { error } = await client.auth.signOut()

  if (error) {
    logger.error('[Supabase] Sign-out failed', error)
  }

  return { error }
}

