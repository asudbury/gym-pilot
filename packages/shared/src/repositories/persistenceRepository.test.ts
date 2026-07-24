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

  it('skips remote saves when the incoming value matches the existing local value', async () => {
    const saveLocal = vi.fn().mockResolvedValue(undefined)
    const saveRemote = vi.fn().mockResolvedValue(undefined)
    const loadLocal = vi.fn().mockResolvedValue({ ok: true })

    const repository = createPersistenceRepository({
      loadLocal,
      saveLocal,
      removeLocal: vi.fn(),
      listLocal: vi.fn().mockResolvedValue([]),
      loadRemote: vi.fn(),
      saveRemote,
      removeRemote: vi.fn(),
      isRemoteEnabled: () => true,
      shouldUseRemoteForKey: () => true,
    })

    await repository.save('demo', { ok: true })

    expect(saveLocal).toHaveBeenCalledWith('demo', { ok: true })
    expect(saveRemote).not.toHaveBeenCalled()
  })
})
