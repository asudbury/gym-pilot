import type { AuthUser } from '../domain/authTypes'
import {
  loadAuthSessionWithRepository,
  saveAuthSessionWithRepository,
} from './authRepository'

export const CURRENT_USER_ID_STORAGE_KEY = 'gym-pilot-current-user-id'
export const LOGOUT_PENDING_STORAGE_KEY = 'gym-pilot-auth-logout-pending'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function getSessionStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage
}

export async function readStoredSession(): Promise<AuthUser | null> {
  return loadAuthSessionWithRepository()
}

export async function persistSession(user: AuthUser | null) {
  await saveAuthSessionWithRepository(user)
}

export function readCurrentUserId(
  storage: StorageLike | null = getSessionStorage(),
) {
  return storage?.getItem(CURRENT_USER_ID_STORAGE_KEY) ?? null
}

export function persistCurrentUserId(
  userId: string | null,
  storage: StorageLike | null = getSessionStorage(),
) {
  if (!storage) {
    return
  }

  if (userId) {
    storage.setItem(CURRENT_USER_ID_STORAGE_KEY, userId)
    return
  }

  storage.removeItem(CURRENT_USER_ID_STORAGE_KEY)
}

export function readLogoutPending(
  storage: StorageLike | null = getSessionStorage(),
) {
  return storage?.getItem(LOGOUT_PENDING_STORAGE_KEY) === 'true'
}

export function persistLogoutPending(
  isPending: boolean,
  storage: StorageLike | null = getSessionStorage(),
) {
  if (!storage) {
    return
  }

  if (isPending) {
    storage.setItem(LOGOUT_PENDING_STORAGE_KEY, 'true')
    return
  }

  storage.removeItem(LOGOUT_PENDING_STORAGE_KEY)
}
