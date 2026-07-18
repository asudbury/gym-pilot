import { describe, expect, it } from 'vitest'
import { normalizeFavoriteStorageValue, normalizeHomeFilters, sortQuickLinks } from './quickLinks'

describe('favorites domain helpers', () => {
  it('normalizes legacy array storage into favorites and empty folders', () => {
    const normalized = normalizeFavoriteStorageValue([
      { id: '1', label: 'Bench', path: '/bench' },
    ])

    expect(normalized.favorites).toHaveLength(1)
    expect(normalized.folders).toEqual([])
  })

  it('normalizes home filters with sensible defaults', () => {
    const normalized = normalizeHomeFilters({ searchTerm: 'bench', selectedCategory: 'All', showImages: false })

    expect(normalized.searchTerm).toBe('bench')
    expect(normalized.selectedCategory).toBeNull()
    expect(normalized.showImages).toBe(false)
  })

  it('sorts quick links by label and path', () => {
    const sorted = sortQuickLinks([
      { id: '2', label: 'Zulu', path: '/z' },
      { id: '1', label: 'Alpha', path: '/a' },
    ])

    expect(sorted.map((item) => item.id)).toEqual(['1', '2'])
  })
})
