import { describe, expect, it, vi } from 'vitest'
import { createPersistenceRepository } from '@gym-pilot/shared'
import { createFavouritesRepository } from './favouritesRepository'

describe('favourites repository', () => {
  it('loads favourites from the repository fallback when the key is not supported', async () => {
    const repository = createFavouritesRepository()
    await expect(
      repository.load('other-key', { favorites: [], folders: [] }),
    ).resolves.toEqual({ favorites: [], folders: [] })
  })

  it('saves favourites through the repository abstraction', async () => {
    const saveLocal = vi.fn().mockResolvedValue(undefined)
    const saveRemote = vi.fn().mockResolvedValue(undefined)
    const repository = createPersistenceRepository({
      loadLocal: vi.fn().mockResolvedValue({
        favorites: [{ id: '1', label: 'Home', path: '/home' }],
        folders: [],
      }),
      saveLocal,
      removeLocal: vi.fn().mockResolvedValue(undefined),
      listLocal: vi.fn().mockResolvedValue([]),
      loadRemote: vi.fn().mockResolvedValue({ found: false, value: null }),
      saveRemote,
      removeRemote: vi.fn().mockResolvedValue(undefined),
      isRemoteEnabled: () => false,
      shouldUseRemoteForKey: () => false,
    })

    await repository.save('gym-pilot.favorites', {
      favorites: [{ id: '1', label: 'Home', path: '/home' }],
      folders: [],
    })

    expect(saveLocal).toHaveBeenCalledWith('gym-pilot.favorites', {
      favorites: [{ id: '1', label: 'Home', path: '/home' }],
      folders: [],
    })
    expect(saveRemote).not.toHaveBeenCalled()
  })
})
