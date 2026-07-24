import {
  normalizeFolderName,
  sortFavorites,
  type QuickLink,
} from '../../../utils/favouriteUtils'

export type BuilderFavoriteGroup = {
  folderName: string
  links: QuickLink[]
}

export function resolveFavoriteLinkGroups(
  favoriteLinks: QuickLink[],
): BuilderFavoriteGroup[] {
  const sortedLinks = sortFavorites(favoriteLinks)
  const groups = new Map<string, QuickLink[]>()
  const folderNames = new Set<string>()

  sortedLinks.forEach((link: QuickLink) => {
    const folderName = normalizeFolderName(link.folder ?? '') || 'No folder'
    folderNames.add(folderName)
    groups.set(folderName, [...(groups.get(folderName) ?? []), link])
  })

  return Array.from(folderNames)
    .sort((left, right) => {
      if (left === 'No folder') {
        return 1
      }

      if (right === 'No folder') {
        return -1
      }

      return left.localeCompare(right)
    })
    .map((folderName) => ({ folderName, links: groups.get(folderName) ?? [] }))
}
