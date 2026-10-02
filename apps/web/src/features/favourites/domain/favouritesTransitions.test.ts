import { describe, expect, it } from 'vitest'
import {
  resolveFavouritesHydrationState,
  resolveFavouritesPersistenceState,
} from './favouritesTransitions'

describe('resolveFavouritesHydrationState', () => {
  it('returns empty defaults for null input', () => {
    const result = resolveFavouritesHydrationState(null)
    expect(result.favorites).toEqual([])
    expect(result.folders).toEqual([])
  })

  it('filters out items missing required fields', () => {
    const input = {
      favorites: [
        { id: '1', label: 'Home', path: '/' },
        { id: '2', label: 'Bad' }, // missing path → excluded
      ],
      folders: ['Legs'],
    }
    const result = resolveFavouritesHydrationState(input)
    expect(result.favorites).toHaveLength(1)
    expect(result.favorites[0].path).toBe('/')
  })

  it('preserves optional folder property', () => {
    const input = {
      favorites: [
        { id: '1', label: 'Squat', path: '/exercise/squat', folder: 'Legs' },
      ],
      folders: ['Legs'],
    }
    const result = resolveFavouritesHydrationState(input)
    expect(result.favorites[0].folder).toBe('Legs')
  })

  it('filters out non-string folder values', () => {
    const input = { favorites: [], folders: ['Legs', 42, null] }
    const result = resolveFavouritesHydrationState(input)
    expect(result.folders).toEqual(['Legs'])
  })
})

describe('resolveFavouritesPersistenceState', () => {
  it('round-trips the state correctly', () => {
    const state = {
      favorites: [{ id: '1', label: 'Home', path: '/', folder: 'Top' }],
      folders: ['Top'],
    }
    const persisted = resolveFavouritesPersistenceState(state)
    expect(persisted.favorites[0]).toEqual({
      id: '1',
      label: 'Home',
      path: '/',
      folder: 'Top',
    })
    expect(persisted.folders).toEqual(['Top'])
  })
})
