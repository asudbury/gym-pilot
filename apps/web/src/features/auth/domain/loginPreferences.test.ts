import { describe, expect, it } from 'vitest'
import {
  readStoredRememberEmailPreference,
  readStoredRememberedEmail,
  persistRememberEmailPreference,
  persistRememberedEmail,
} from './loginPreferences'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function createMemoryStorage(initialEntries: Record<string, string> = {}) {
  const entries = { ...initialEntries }

  const storage: StorageLike = {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(entries, key) ? entries[key] : null
    },
    setItem(key: string, value: string) {
      entries[key] = value
    },
    removeItem(key: string) {
      delete entries[key]
    },
  }

  return storage
}

describe('login preference helpers', () => {
  it('defaults to remembering the email when no preference is stored', () => {
    expect(readStoredRememberEmailPreference(null)).toBe(true)
  })

  it('persists and reads the remembered email and preference', () => {
    const storage = createMemoryStorage()

    persistRememberEmailPreference(true, storage)
    persistRememberedEmail('  user@example.com  ', true, storage)

    expect(readStoredRememberEmailPreference(storage)).toBe(true)
    expect(readStoredRememberedEmail(storage)).toBe('user@example.com')
  })

  it('removes the remembered email when the preference is disabled', () => {
    const storage = createMemoryStorage({
      'gym-pilot-remembered-email': 'user@example.com',
    })

    persistRememberEmailPreference(false, storage)
    persistRememberedEmail('user@example.com', false, storage)

    expect(readStoredRememberEmailPreference(storage)).toBe(false)
    expect(readStoredRememberedEmail(storage)).toBe('')
  })
})
