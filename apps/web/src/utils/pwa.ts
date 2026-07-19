type NavigatorWithStandalone = Navigator & { standalone?: boolean }

export function isAppleDevice(userAgent = window.navigator.userAgent): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent)
}

export function isInstalledAsApp(
  navigatorRef: NavigatorWithStandalone = window.navigator as NavigatorWithStandalone,
): boolean {
  return Boolean(
    navigatorRef.standalone ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches,
  )
}

export function isLocalhostPreview(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)$/.test(window.location.hostname)
}

export function shouldShowInstallHint(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  if (isInstalledAsApp()) {
    return false
  }

  return isAppleDevice()
}

export function getInstallHint(isApple: boolean, isInstalled: boolean): string {
  if (isInstalled) {
    return 'You already have this app installed.'
  }

  if (isApple) {
    return 'On iPhone, tap Share and choose Add to Home Screen to create a shortcut.'
  }

  return 'Preview mode: use your browser\'s install option to add this app to your device.'
}
