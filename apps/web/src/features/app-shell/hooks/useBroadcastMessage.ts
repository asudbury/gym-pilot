import { useEffect, useState } from 'react'
import { loadAppSetting, logger } from '@gym-pilot/shared'

export function useBroadcastMessage() {
  const [broadcastMessage, setBroadcastMessage] = useState('')

  useEffect(() => {
    let isActive = true

    const refreshBroadcastMessage = async () => {
      try {
        const message = await loadAppSetting('broadcast_messages', '')

        if (isActive) {
          setBroadcastMessage(typeof message === 'string' ? message : '')
        }
      } catch (error) {
        logger.error('Failed to load broadcast message', error)
        if (isActive) {
          setBroadcastMessage('')
        }
      }
    }

    void refreshBroadcastMessage()

    const handleSettingsUpdated = () => {
      void refreshBroadcastMessage()
    }

    window.addEventListener('gym-pilot-settings-updated', handleSettingsUpdated)

    return () => {
      isActive = false
      window.removeEventListener(
        'gym-pilot-settings-updated',
        handleSettingsUpdated,
      )
    }
  }, [])

  return { broadcastMessage }
}
