export type ThemePreference = 'light' | 'dark'

const THEME_STORAGE_KEY = 'gym-pilot-theme-preference'

export function readStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return storedTheme === 'dark' ? 'dark' : 'light'
}

export function persistThemePreference(themePreference: ThemePreference) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, themePreference)
}
