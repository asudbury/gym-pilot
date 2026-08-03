import { useEffect, useState } from 'react'
import { isAppleDevice, isInstalledAsApp } from '../../../utils/pwa'

const INSTALL_HINT_STORAGE_KEY = 'gym-pilot:install-hint-dismissed'

export function useInstallHint() {
  const [showInstallHint, setShowInstallHint] = useState(false)

  useEffect(() => {
    const isApple = isAppleDevice()
    const isInstalled = isInstalledAsApp()

    if (typeof window === 'undefined') {
      return
    }

    const dismissed =
      window.localStorage.getItem(INSTALL_HINT_STORAGE_KEY) === 'true'

    if (isInstalled || !isApple || dismissed) {
      setShowInstallHint(false)
      return
    }

    setShowInstallHint(true)
  }, [])

  const handleSetShowInstallHint = (value: boolean) => {
    setShowInstallHint(value)

    if (typeof window !== 'undefined' && !value) {
      window.localStorage.setItem(INSTALL_HINT_STORAGE_KEY, 'true')
    }
  }

  return { showInstallHint, setShowInstallHint: handleSetShowInstallHint }
}
