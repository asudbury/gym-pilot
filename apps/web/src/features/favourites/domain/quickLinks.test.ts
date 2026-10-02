import { describe, expect, it } from 'vitest'
import {
  getQuickLinkForPath,
  groupFavoritesByFolder,
  normalizeFavouriteStorageValue,
  normalizeFavouritesState,
  normalizeHomeFilters,
  normalizeFolderName,
  sortQuickLinks,
  type QuickLink,
} from './quickLinks'

describe('normalizeFolderName', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeFolderName('  Legs  ')).toBe('Legs')
  })

  it('returns an empty string unchanged', () => {
    expect(normalizeFolderName('')).toBe('')
  })
})

describe('sortQuickLinks', () => {
  it('sorts alphabetically by label', () => {
    const links: QuickLink[] = [
      { id: 'b', label: 'Bench Press', path: '/exercise/bench-press' },
      { id: 'a', label: 'Abs Crunch', path: '/exercise/abs-crunch' },
    ]
    const sorted = sortQuickLinks(links)
    expect(sorted[0].label).toBe('Abs Crunch')
    expect(sorted[1].label).toBe('Bench Press')
  })

  it('does not mutate the original array', () => {
    const links: QuickLink[] = [
      { id: 'z', label: 'Zzz', path: '/z' },
      { id: 'a', label: 'Aaa', path: '/a' },
    ]
    const original = [...links]
    sortQuickLinks(links)
    expect(links).toEqual(original)
  })
})

describe('normalizeFavouriteStorageValue', () => {
  it('returns empty defaults for null', () => {
    expect(normalizeFavouriteStorageValue(null)).toEqual({
      favorites: [],
      folders: [],
    })
  })

  it('handles a legacy array format (v1)', () => {
    const legacy = [{ id: '1', label: 'Home', path: '/' }]
    const result = normalizeFavouriteStorageValue(legacy)
    expect(result.favorites).toHaveLength(1)
    expect(result.folders).toHaveLength(0)
  })

  it('filters out items missing required fields', () => {
    const input = {
      favorites: [
        { id: '1', label: 'Home', path: '/' },
        { id: '2', label: 'Bad' }, // missing path
      ],
      folders: [],
    }
    const result = normalizeFavouriteStorageValue(input)
    expect(result.favorites).toHaveLength(1)
    expect(result.favorites[0].label).toBe('Home')
  })

  it('deduplicates and sorts folder names', () => {
    const input = {
      favorites: [],
      folders: ['Legs', 'Arms', 'Legs'],
    }
    const result = normalizeFavouriteStorageValue(input)
    expect(result.folders).toEqual(['Arms', 'Legs'])
  })
})

describe('normalizeFavouritesState', () => {
  it('sorts favorites alphabetically', () => {
    const input = {
      favorites: [
        { id: 'z', label: 'Zzz', path: '/z' },
        { id: 'a', label: 'Aaa', path: '/a' },
      ],
      folders: [],
    }
    const result = normalizeFavouritesState(input)
    expect(result.favorites[0].label).toBe('Aaa')
  })
})

describe('normalizeHomeFilters', () => {
  it('returns safe defaults for undefined input', () => {
    expect(normalizeHomeFilters(undefined)).toEqual({
      searchTerm: '',
      selectedCategory: null,
      showImages: true,
    })
  })

  it('normalises "All" category to null', () => {
    const result = normalizeHomeFilters({ selectedCategory: 'All' })
    expect(result.selectedCategory).toBeNull()
  })

  it('normalises empty string category to null', () => {
    const result = normalizeHomeFilters({ selectedCategory: '' })
    expect(result.selectedCategory).toBeNull()
  })

  it('preserves a valid category string', () => {
    const result = normalizeHomeFilters({ selectedCategory: 'Chest' })
    expect(result.selectedCategory).toBe('Chest')
  })
})

describe('groupFavoritesByFolder', () => {
  it('groups items by folder', () => {
    const links: QuickLink[] = [
      { id: '1', label: 'A', path: '/a', folder: 'Upper' },
      { id: '2', label: 'B', path: '/b', folder: 'Lower' },
      { id: '3', label: 'C', path: '/c', folder: 'Upper' },
    ]
    const groups = groupFavoritesByFolder(links)
    const upper = groups.find(([name]) => name === 'Upper')
    expect(upper?.[1]).toHaveLength(2)
  })

  it('puts items without a folder into "No folder"', () => {
    const links: QuickLink[] = [{ id: '1', label: 'A', path: '/a' }]
    const groups = groupFavoritesByFolder(links)
    expect(groups[0][0]).toBe('No folder')
  })
})

describe('getQuickLinkForPath', () => {
  const lookup = new Map([
    ['bench-press', { id: 'bench-press', name: 'Bench Press' }],
  ])

  it('returns a home link for "/"', () => {
    const link = getQuickLinkForPath('/', lookup)
    expect(link?.label).toBe('Home')
    expect(link?.path).toBe('/')
  })

  it('returns a plans link for "/plans"', () => {
    const link = getQuickLinkForPath('/plans', lookup)
    expect(link?.label).toBe('Plans')
  })

  it('resolves exercise name from lookup', () => {
    const link = getQuickLinkForPath('/exercise/bench-press', lookup)
    expect(link?.label).toBe('Bench Press')
  })

  it('falls back gracefully for unknown exercise', () => {
    const link = getQuickLinkForPath('/exercise/unknown-exercise', lookup)
    expect(link?.label).toBe('Exercise')
  })

  it('returns null for an unrecognised path', () => {
    const link = getQuickLinkForPath('/settings/profile', lookup)
    // returns path-based fallback
    expect(link?.path).toBe('/settings/profile')
  })
})
