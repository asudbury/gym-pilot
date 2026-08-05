import { describe, expect, it } from 'vitest'

import { resolvePersistedSessionId } from './RecordSessionPage'

describe('resolvePersistedSessionId', () => {
  it('uses the persisted id when present', () => {
    expect(
      resolvePersistedSessionId(
        { id: 'persisted-id' } as { id?: string | null },
        'generated-id',
      ),
    ).toBe('persisted-id')
  })

  it('falls back to the generated id when the response has no id', () => {
    expect(resolvePersistedSessionId(null, 'generated-id')).toBe('generated-id')
  })
})
