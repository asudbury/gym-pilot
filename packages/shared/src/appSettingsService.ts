import { getSupabaseClient } from './supabase'
import { logger } from './logging'
import {
  buildAppSettingsMap,
  getDefaultAppSettings,
  type AppSettingKey,
  type AppSettingValue,
} from './appSettings'

export async function loadAppSettings(): Promise<Record<string, AppSettingValue>> {
  const client = getSupabaseClient()

  if (!client) {
    return getDefaultAppSettings()
  }

  const { data, error } = await client
    .from('gym_pilot_app_setting')
    .select('setting_key, setting_value')

  if (error) {
    logger.warn('[Supabase] Could not load app settings', error)
    return getDefaultAppSettings()
  }

  return buildAppSettingsMap(
    (data ?? []) as Array<Partial<{ setting_key: AppSettingKey; setting_value: AppSettingValue }>>,
  )
}

export async function loadAppSetting(key: AppSettingKey, fallback?: AppSettingValue): Promise<AppSettingValue> {
  const settings = await loadAppSettings()
  const defaultSettings = getDefaultAppSettings()
  const resolvedValue = settings[key] ?? defaultSettings[key]

  return typeof resolvedValue === 'undefined' ? (fallback ?? null) : resolvedValue
}

export async function saveAppSetting(key: AppSettingKey, value: AppSettingValue) {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  const { error } = await client.from('gym_pilot_app_setting').upsert(
    { setting_key: key, setting_value: value },
    { onConflict: 'setting_key' },
  )

  if (error) {
    logger.error('[Supabase] Could not save app setting', error)
  }
}

export async function saveAppSettings(settings: Record<string, AppSettingValue>) {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  await Promise.all(
    Object.entries(settings).map(([key, value]) => saveAppSetting(key as AppSettingKey, value)),
  )
}
