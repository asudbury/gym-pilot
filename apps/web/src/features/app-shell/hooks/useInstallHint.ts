import { useEffect, useState } from 'react'
import { isAppleDevice, isInstalledAsApp } from '../../../utils/pwa'

export function useInstallHint() {
  const [showInstallHint, setShowInstallHint] = useState(false)

  useEffect(() => {
    const isApple = isAppleDevice()
    const isInstalled = isInstalledAsApp()

    if (isInstalled || !isApple) {
      setShowInstallHint(false)
      return
    }

    setShowInstallHint(true)
  }, [])

  return { showInstallHint, setShowInstallHint }
}
