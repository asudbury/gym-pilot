export type ThemePreference = 'light' | 'dark'

const THEME_STORAGE_KEY = 'gym-pilot-theme-preference'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function getStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage) {
    return storage
  }

  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export function readStoredThemePreference(
  storage?: StorageLike | null,
): ThemePreference {
  const activeStorage = getStorage(storage)

  if (!activeStorage) {
    return 'light'
  }

  const storedTheme = activeStorage.getItem(THEME_STORAGE_KEY)
  return storedTheme === 'dark' ? 'dark' : 'light'
}

export function persistThemePreference(
  themePreference: ThemePreference,
  storage?: StorageLike | null,
) {
  const activeStorage = getStorage(storage)

  if (!activeStorage) {
    return
  }

  activeStorage.setItem(THEME_STORAGE_KEY, themePreference)
}
