import { describe, expect, it } from 'vitest'

import { detectDateTimeLocalSupport } from './RecordSessionPage'

describe('detectDateTimeLocalSupport', () => {
  it('returns true when the browser reports datetime-local support', () => {
    const mockWindow = {
      document: {
        createElement: () => ({
          setAttribute: () => undefined,
          type: 'datetime-local',
        }),
      },
    } as unknown as Window

    expect(detectDateTimeLocalSupport(mockWindow)).toBe(true)
  })

  it('returns false when the input type is not preserved', () => {
    const mockWindow = {
      document: {
        createElement: () => ({
          setAttribute: () => undefined,
          type: 'text',
        }),
      },
    } as unknown as Window

    expect(detectDateTimeLocalSupport(mockWindow)).toBe(false)
  })

  it('defaults to true when no window object is available', () => {
    expect(detectDateTimeLocalSupport(null)).toBe(true)
  })
})
