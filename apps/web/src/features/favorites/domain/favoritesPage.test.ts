import { describe, expect, it } from 'vitest'
import { getFolderOptions, groupFavorites, resolveFavoritesPageViewModel } from './favoritesPage'
import { type QuickLink } from '../../../utils/favouriteUtils'

describe('resolveFavoritesPageViewModel', () => {
  it('builds folder options from folders and favorites', () => {
    const favorites: QuickLink[] = [
      { id: 'gym', label: 'Gym', path: '/gym', folder: 'Training' },
      { id: 'docs', label: 'Docs', path: '/docs' },
    ]

    const viewModel = resolveFavoritesPageViewModel(favorites, ['Work'])

    expect(viewModel.folderOptions).toEqual(['Training', 'Work'])
    expect(viewModel.groupedFavorites.map(([folderName]) => folderName)).toEqual(expect.arrayContaining(['Training', 'Work', 'No folder']))
  })
})

describe('groupFavorites', () => {
  it('puts unfiled favorites in the No folder bucket', () => {
    const favorites: QuickLink[] = [{ id: 'docs', label: 'Docs', path: '/docs' }]

    expect(groupFavorites(favorites, [])).toEqual([['No folder', favorites]])
  })
})

describe('getFolderOptions', () => {
  it('returns all folder names sorted', () => {
    const favorites: QuickLink[] = [{ id: 'docs', label: 'Docs', path: '/docs', folder: 'Zeta' }]

    expect(getFolderOptions(['Alpha'], favorites)).toEqual(['Alpha', 'Zeta'])
  })
})
