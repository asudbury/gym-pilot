import { loadJsonRecord, saveJsonRecord } from '@gym-pilot/shared'
import type { AuthUser } from '../domain/authTypes'

const SESSION_STORAGE_KEY = 'gym-pilot-auth-session'
const BYPASS_STORAGE_KEY = 'gym-pilot-auth-bypass'

export async function readStoredSession(): Promise<AuthUser | null> {
  const stored = await loadJsonRecord<Partial<AuthUser> | null>(SESSION_STORAGE_KEY, null)

  if (!stored?.id || !stored?.name || !stored?.slug) {
    return null
  }

  return stored as AuthUser
}

export async function readBypassFlag(): Promise<boolean> {
  return loadJsonRecord<boolean>(BYPASS_STORAGE_KEY, false)
}

export async function persistSession(user: AuthUser | null) {
  await saveJsonRecord(SESSION_STORAGE_KEY, user)
}

export async function persistBypassFlag(isEnabled: boolean) {
  await saveJsonRecord(BYPASS_STORAGE_KEY, isEnabled)
}
