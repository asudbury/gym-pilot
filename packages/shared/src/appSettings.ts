export type AppSettingKey =
  | 'login_enabled'
  | 'post_login_message'
  | 'broadcast_messages'
  | 'error_logging_enabled'
  | 'audit_logging_enabled'
  | 'log_level'
  | 'user_activity_logging_enabled'
  | 'activities_my_logging_enabled'

export type AppSettingValue = string | boolean | null

export type AppSettingRecord = {
  setting_key: AppSettingKey
  setting_value: AppSettingValue
}

export type AppSettings = Record<AppSettingKey, AppSettingValue>

export function getDefaultAppSettings(): AppSettings {
  return {
    login_enabled: true,
    post_login_message: '',
    broadcast_messages: '',
    error_logging_enabled: true,
    audit_logging_enabled: true,
    log_level: 'info',
    user_activity_logging_enabled: true,
    activities_my_logging_enabled: true,
  }
}

export function buildAppSettingsMap(records: Array<Partial<AppSettingRecord>> = []): Record<string, AppSettingValue> {
  const settings = getDefaultAppSettings()

  records.forEach((record) => {
    if (!record.setting_key) {
      return
    }

    const normalizedKey = record.setting_key as AppSettingKey
    const normalizedValue = record.setting_value ?? settings[normalizedKey]

    settings[normalizedKey] = normalizedValue
  })

  return settings
}

export function getAppSettingBoolean(settings: Record<string, AppSettingValue> | null | undefined, key: AppSettingKey, fallback: boolean): boolean {
  const value = settings?.[key]

  if (typeof value === 'boolean') {
    return value
  }

  return fallback
}

export function getAppSettingString(settings: Record<string, AppSettingValue> | null | undefined, key: AppSettingKey, fallback: string): string {
  const value = settings?.[key]

  if (typeof value === 'string') {
    return value
  }

  return fallback
}
