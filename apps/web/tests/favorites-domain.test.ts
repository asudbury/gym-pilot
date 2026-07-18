import { describe, expect, it } from 'vitest'
import {
  normalizeFavoriteStorageValue,
  normalizeFolderName,
  sortQuickLinks,
  type QuickLink,
} from '../src/features/favorites/domain/quickLinks'

describe('favorites domain helpers', () => {
  it('normalizes stored favorites and preserves folder ordering', () => {
    const value = {
      favorites: [
        { id: '2', label: 'Beta', path: '/beta', folder: '  Zeta  ' },
        { id: '1', label: 'Alpha', path: '/alpha' },
        { id: '3', label: 'Gamma', path: '/gamma', folder: 'Alpha' },
      ],
      folders: ['  Zeta  ', 'Alpha', 'Alpha'],
    }

    const normalized = normalizeFavoriteStorageValue(value)

    expect(normalized.folders).toEqual(['Alpha', 'Zeta'])
    expect(normalized.favorites).toHaveLength(3)
    expect(normalized.favorites[0].label).toBe('Beta')
    expect(normalized.favorites[2].folder).toBe('Alpha')
  })

  it('sorts quick links by label and normalizes folder names', () => {
    const items: QuickLink[] = [
      { id: 'b', label: 'Beta', path: '/beta', folder: '  Zeta  ' },
      { id: 'a', label: 'Alpha', path: '/alpha' },
      { id: 'c', label: 'Alpha', path: '/gamma', folder: 'Alpha' },
    ]

    const sorted = sortQuickLinks(items)

    expect(sorted.map((item) => item.id)).toEqual(['a', 'c', 'b'])
    expect(normalizeFolderName('  Alpha  ')).toBe('Alpha')
  })
})
