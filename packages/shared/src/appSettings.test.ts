import { describe, expect, it } from 'vitest'
import { buildAppSettingsMap, getAppSettingBoolean, getAppSettingString, getDefaultAppSettings } from './appSettings'

describe('app settings helpers', () => {
  it('returns the default settings when nothing is present', () => {
    const defaults = getDefaultAppSettings()

    expect(defaults.login_enabled).toBe(true)
    expect(defaults.post_login_message).toBe('')
    expect(defaults.log_level).toBe('info')
  })

  it('reads typed values from a settings map', () => {
    const settings = buildAppSettingsMap([
      { setting_key: 'login_enabled', setting_value: false },
      { setting_key: 'post_login_message', setting_value: 'Welcome back' },
    ])

    expect(getAppSettingBoolean(settings, 'login_enabled', true)).toBe(false)
    expect(getAppSettingString(settings, 'post_login_message', '')).toBe('Welcome back')
  })
})
