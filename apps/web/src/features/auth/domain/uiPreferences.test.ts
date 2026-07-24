import { describe, expect, it } from 'vitest'
import { readStoredThemePreference } from './uiPreferences'

describe('ui preference helpers', () => {
  it('defaults to light theme when no stored value exists', () => {
    expect(readStoredThemePreference()).toBe('light')
  })
})
