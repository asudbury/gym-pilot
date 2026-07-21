import { recordSupabaseUserActivity } from '@gym-pilot/shared'

function getDeviceContext() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceType: 'unknown',
      isMobile: false,
    }
  }

  const userAgent = navigator.userAgent || ''
  const hasTouch = Boolean(
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 0,
  )
  const hasCoarsePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches

  const isMobileUserAgent = /android|iphone|ipod|ipad|mobile/i.test(userAgent)
  const isTabletUserAgent = /ipad|tablet/i.test(userAgent)

  if (isTabletUserAgent) {
    return {
      deviceType: 'tablet',
      isMobile: true,
    }
  }

  if (isMobileUserAgent || hasTouch || hasCoarsePointer) {
    return {
      deviceType: 'mobile',
      isMobile: true,
    }
  }

  return {
    deviceType: 'desktop',
    isMobile: false,
  }
}

function sanitizeWelcomeJourneyData(eventData: Record<string, unknown>) {
  const sanitizedPayload: Record<string, unknown> = { ...eventData }

  for (const key of Object.keys(sanitizedPayload)) {
    if (
      typeof key === 'string' &&
      /(email|phone|password|pwd|token|secret|api[_-]?key|authorization|cookie)/i.test(
        key,
      )
    ) {
      delete sanitizedPayload[key]
    }
  }

  return sanitizedPayload
}

export function buildWelcomeJourneyActivity(
  eventType: string,
  eventData: Record<string, unknown> = {},
) {
  const deviceContext = getDeviceContext()

  return {
    eventType,
    eventData: sanitizeWelcomeJourneyData({
      ...eventData,
      ...deviceContext,
    }),
  }
}

export async function recordWelcomeJourneyActivity(
  eventType: string,
  eventData: Record<string, unknown> = {},
  userId?: string | null,
  friendlyName?: string | null,
) {
  const activity = buildWelcomeJourneyActivity(eventType, eventData)

  if (!userId) {
    return
  }

  await recordSupabaseUserActivity(
    activity.eventType,
    activity.eventData,
    userId,
    friendlyName,
  )
}
