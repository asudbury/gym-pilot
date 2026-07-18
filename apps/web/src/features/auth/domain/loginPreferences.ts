const REMEMBERED_EMAIL_STORAGE_KEY = 'gym-pilot-remembered-email'
const REMEMBER_EMAIL_PREFERENCE_STORAGE_KEY = 'gym-pilot-remember-email-preference'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function getStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage) {
    return storage
  }

  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export function readStoredRememberEmailPreference(storage?: StorageLike | null): boolean {
  const activeStorage = getStorage(storage)

  if (!activeStorage) {
    return true
  }

  const storedPreference = activeStorage.getItem(REMEMBER_EMAIL_PREFERENCE_STORAGE_KEY)
  return storedPreference === null ? true : storedPreference === 'true'
}

export function readStoredRememberedEmail(storage?: StorageLike | null): string {
  const activeStorage = getStorage(storage)

  if (!activeStorage) {
    return ''
  }

  return activeStorage.getItem(REMEMBERED_EMAIL_STORAGE_KEY) ?? ''
}

export function persistRememberEmailPreference(shouldRememberEmail: boolean, storage?: StorageLike | null) {
  const activeStorage = getStorage(storage)

  if (!activeStorage) {
    return
  }

  activeStorage.setItem(REMEMBER_EMAIL_PREFERENCE_STORAGE_KEY, String(shouldRememberEmail))
}

export function persistRememberedEmail(value: string, shouldRememberEmail: boolean, storage?: StorageLike | null) {
  const activeStorage = getStorage(storage)

  if (!activeStorage) {
    return
  }

  if (!shouldRememberEmail) {
    activeStorage.removeItem(REMEMBERED_EMAIL_STORAGE_KEY)
    return
  }

  const trimmedValue = value.trim()

  if (trimmedValue) {
    activeStorage.setItem(REMEMBERED_EMAIL_STORAGE_KEY, trimmedValue)
    return
  }

  activeStorage.removeItem(REMEMBERED_EMAIL_STORAGE_KEY)
}

export function getLoginPreferenceStorageKeys() {
  return {
    rememberedEmail: REMEMBERED_EMAIL_STORAGE_KEY,
    rememberEmailPreference: REMEMBER_EMAIL_PREFERENCE_STORAGE_KEY,
  }
}
