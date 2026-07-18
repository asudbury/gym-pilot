import { describe, expect, it } from 'vitest'
import { resolveFavoritesHydrationState, resolveFavoritesPersistenceState } from './favoritesTransitions'

describe('favoritesTransitions', () => {
  it('hydrates favorites from stored state', () => {
    const state = resolveFavoritesHydrationState({ favorites: [{ id: '1', label: 'Bench', path: '/bench', folder: 'Work' }], folders: ['Work'] })

    expect(state.favorites).toHaveLength(1)
    expect(state.folders).toEqual(['Work'])
  })

  it('creates the persistence payload from current state', () => {
    const persisted = resolveFavoritesPersistenceState({ favorites: [{ id: '1', label: 'Bench', path: '/bench' }], folders: ['Work'] })

    expect(persisted).toMatchObject({ favorites: [{ label: 'Bench' }], folders: ['Work'] })
  })
})
