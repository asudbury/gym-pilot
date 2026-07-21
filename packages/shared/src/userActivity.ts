import { getSupabaseClient } from './supabase'
import { logger } from './logging'
import { loadAppSetting } from './appSettingsService'
import { getAuthenticatedUserId } from './supabaseAuth'
import { invalidateSupabaseProfileCache } from './gymPilotSupabase'

function isLocalhostHost(hostname?: string) {
  if (!hostname) {
    return false
  }

  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]' || hostname === '0.0.0.0' || hostname.endsWith('.localhost')
}

function getDeviceContext() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceType: 'unknown',
      isMobile: false,
    }
  }

  const userAgent = navigator.userAgent || ''
  const hasTouch = Boolean(
    typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0,
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

function sanitizeActivityValue(key: string, value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  if (/email/i.test(key) && /.+@.+\..+/.test(value)) {
    return '*user-email-address'
  }

  return value
}

export function buildSupabaseUserActivityEventData(eventData: Record<string, unknown> = {}, friendlyName?: string | null) {
  const sanitizedPayload: Record<string, unknown> = { ...eventData }

  for (const key of Object.keys(sanitizedPayload)) {
    if (
      typeof key === 'string' &&
      /(phone|password|pwd|token|secret|api[_-]?key|authorization|cookie|notes|details|message)/i.test(key)
    ) {
      delete sanitizedPayload[key]
    }
  }

  for (const key of Object.keys(sanitizedPayload)) {
    const value = sanitizedPayload[key]
    sanitizedPayload[key] = sanitizeActivityValue(key, value)
  }

  if (typeof friendlyName === 'string') {
    const trimmedFriendlyName = friendlyName.trim()

    if (trimmedFriendlyName) {
      sanitizedPayload.friendlyName = trimmedFriendlyName
    }
  }

  const deviceContext = getDeviceContext()
  const hostname = typeof window !== 'undefined' ? window.location?.hostname : undefined

  return {
    ...sanitizedPayload,
    ...deviceContext,
    isLocalHost: isLocalhostHost(hostname),
  }
}

export async function shouldRecordSupabaseUserActivity() {
  const enabledValue = await loadAppSetting('user_activity_logging_enabled', true)
  return enabledValue === true || enabledValue === 'true'
}

export function shouldRecordLoginActivity(previousLastLoggedInAt: string | null | undefined, nextLastLoggedInAt: string | null | undefined) {
  if (!nextLastLoggedInAt) {
    return false
  }

  if (!previousLastLoggedInAt) {
    return true
  }

  return previousLastLoggedInAt !== nextLastLoggedInAt
}

export async function recordSupabaseUserActivity(
  eventType: string,
  eventData: Record<string, unknown> = {},
  userId?: string,
  friendlyName?: string | null,
) {
  if (!(await shouldRecordSupabaseUserActivity())) {
    logger.info('[Supabase] Skipping user activity recording')
    return
  }

  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const resolvedUserId = userId || await getAuthenticatedUserId(client)

  if (!resolvedUserId) {
    return
  }

  const payload = buildSupabaseUserActivityEventData(eventData, friendlyName)

  const { error } = await client.from('gym_pilot_user_activity').insert({
    user_id: resolvedUserId,
    event_type: eventType,
    event_data: payload,
  })

  if (error) {
    logger.error('[Supabase] Could not record user activity', error)
  }
}

export async function saveSupabaseProfileLastLoggedIn(
  userId?: string,
  friendlyName?: string | null,
  options?: { shouldRecordActivity?: boolean },
) {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const resolvedUserId = userId || await getAuthenticatedUserId(client)

  if (!resolvedUserId) {
    return
  }

  const { data: existingProfile, error: loadError } = await client
    .from('gym_pilot_profile')
    .select('last_logged_in_at')
    .eq('user_id', resolvedUserId)
    .maybeSingle()

  if (loadError) {
    logger.error('[Supabase] Could not load existing profile login timestamp', loadError)
    return
  }

  const previousLastLoggedInAt = existingProfile?.last_logged_in_at ?? null
  const nextLastLoggedInAt = new Date().toISOString()
  const shouldRecord = options?.shouldRecordActivity !== false && shouldRecordLoginActivity(previousLastLoggedInAt, nextLastLoggedInAt)

  const { error } = await client.from('gym_pilot_profile').upsert(
    {
      user_id: resolvedUserId,
      last_logged_in_at: nextLastLoggedInAt,
      previous_last_logged_in_at: previousLastLoggedInAt,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    logger.error('[Supabase] Could not save profile last logged in timestamp', error)
    return
  }

  await invalidateSupabaseProfileCache(resolvedUserId)

  if (shouldRecord) {
    await recordSupabaseUserActivity('login', {}, resolvedUserId, friendlyName)
  }
}
