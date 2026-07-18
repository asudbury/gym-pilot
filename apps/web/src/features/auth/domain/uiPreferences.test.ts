import { describe, expect, it } from 'vitest'
import {
  readStoredShowVersion,
  readStoredThemePreference,
} from './uiPreferences'

describe('ui preference helpers', () => {
  it('defaults to light theme when no stored value exists', () => {
    expect(readStoredThemePreference()).toBe('light')
  })

  it('defaults to showing the version when no stored value exists', () => {
    expect(readStoredShowVersion()).toBe(true)
  })
})
