import { describe, expect, it, vi } from 'vitest'
import { createPersistenceRepository } from '@gym-pilot/shared'
import { createAuthSessionRepository } from './authRepository'

describe('auth session repository', () => {
  it('loads the session repository fallback when no session is stored', async () => {
    const repository = createAuthSessionRepository()
    await expect(repository.load('other-key', null)).resolves.toBeNull()
  })

  it('saves a session through the repository abstraction', async () => {
    const saveLocal = vi.fn().mockResolvedValue(undefined)
    const repository = createPersistenceRepository({
      loadLocal: vi.fn().mockResolvedValue(null),
      saveLocal,
      removeLocal: vi.fn().mockResolvedValue(undefined),
      listLocal: vi.fn().mockResolvedValue([]),
      loadRemote: vi.fn().mockResolvedValue({ found: false, value: null }),
      saveRemote: vi.fn().mockResolvedValue(undefined),
      removeRemote: vi.fn().mockResolvedValue(undefined),
      isRemoteEnabled: () => false,
      shouldUseRemoteForKey: () => false,
    })

    await repository.save('gym-pilot-auth-session', { id: 'user-1', name: 'Ada', slug: 'ada' })

    expect(saveLocal).toHaveBeenCalledWith('gym-pilot-auth-session', { id: 'user-1', name: 'Ada', slug: 'ada' })
  })
})
