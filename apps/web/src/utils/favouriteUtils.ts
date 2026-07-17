import { formatLabel } from './formatUtils'

export type QuickLink = {
  id: string
  label: string
  path: string
  folder?: string
}

export function sortFavorites(items: QuickLink[]) {
  return [...items].sort((left, right) => {
    const leftLabel = left.label.toLowerCase()
    const rightLabel = right.label.toLowerCase()

    if (leftLabel < rightLabel) {
      return -1
    }

    if (leftLabel > rightLabel) {
      return 1
    }

    return left.path.localeCompare(right.path)
  })
}

export function normalizeFolderName(value: string) {
  return value.trim()
}

export function groupFavoritesByFolder(items: QuickLink[]) {
  const groups = new Map<string, QuickLink[]>()

  items.forEach((item) => {
    const folderName = normalizeFolderName(item.folder ?? '') || 'No folder'
    const currentItems = groups.get(folderName) ?? []

    currentItems.push(item)
    groups.set(folderName, currentItems)
  })

  return Array.from(groups.entries()).sort(([leftName], [rightName]) => {
    if (leftName === 'Unfiled') {
      return 1
    }

    if (rightName === 'Unfiled') {
      return -1
    }

    return leftName.localeCompare(rightName)
  })
}

export function getQuickLinkForPath(pathname: string, exerciseLookup: Map<string, { id: string; name: string }>): QuickLink | null {
  if (pathname === '/') {
    return { id: 'home', label: 'Home', path: '/' }
  }

  if (pathname === '/plans') {
    return { id: 'plans', label: 'Plans', path: '/plans' }
  }

  if (pathname === '/plans/new') {
    return { id: 'new-plan', label: 'New plan', path: '/plans/new' }
  }

  if (pathname.startsWith('/exercise/')) {
    const exerciseId = pathname.split('/').pop()

    if (!exerciseId) {
      return { id: 'exercise', label: 'Exercise', path: pathname }
    }

    const exercise = exerciseLookup.get(exerciseId)

    return exercise
      ? { id: `exercise-${exercise.id}`, label: formatLabel(exercise.name), path: pathname }
      : { id: `exercise-${exerciseId}`, label: 'Exercise', path: pathname }
  }

  if (pathname.startsWith('/plans/')) {
    return { id: pathname, label: 'Plan', path: pathname }
  }

  return { id: pathname, label: pathname, path: pathname }
}
