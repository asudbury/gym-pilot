export type ThemePreference = 'light' | 'dark'

const THEME_STORAGE_KEY = 'gym-pilot-theme-preference'
const SHOW_VERSION_STORAGE_KEY = 'gym-pilot-show-version'

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

export function readStoredShowVersion(): boolean {
  if (typeof window === 'undefined') {
    return true
  }

  const storedShowVersion = window.localStorage.getItem(SHOW_VERSION_STORAGE_KEY)
  return storedShowVersion === null ? true : storedShowVersion === 'true'
}

export function persistShowVersion(showVersion: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(SHOW_VERSION_STORAGE_KEY, showVersion ? 'true' : 'false')
}
