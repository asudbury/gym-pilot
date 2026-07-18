import { describe, expect, it, vi } from 'vitest'
import { createPersistenceRepository } from './persistenceRepository'

describe('createPersistenceRepository', () => {
  it('loads from the remote source when enabled and the local source is unavailable', async () => {
    const loadLocal = vi.fn().mockRejectedValue(new Error('local unavailable'))
    const loadRemote = vi.fn().mockResolvedValue({ found: true, value: { ok: true } })

    const repository = createPersistenceRepository({
      loadLocal,
      saveLocal: vi.fn(),
      removeLocal: vi.fn(),
      listLocal: vi.fn().mockResolvedValue([]),
      loadRemote,
      saveRemote: vi.fn(),
      removeRemote: vi.fn(),
      isRemoteEnabled: () => true,
      shouldUseRemoteForKey: () => true,
    })

    await expect(repository.load('demo', { ok: false })).resolves.toEqual({ ok: true })
    expect(loadLocal).toHaveBeenCalledWith('demo', { ok: false })
    expect(loadRemote).toHaveBeenCalledWith('demo')
  })
})
