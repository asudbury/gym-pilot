import { loadJsonRecord } from '@gym-pilot/shared'
import { FAVORITES_KEY } from '../../../constants/storageKeys'

export type PlanBuilderFavoriteStorageValue = {
  favorites?: Array<{
    id?: string
    label?: string
    path?: string
    folder?: string
  }>
  folders?: string[]
}

export type PlanBuilderFavoriteStorageDependencies = {
  loadJsonRecord?: <T>(key: string, fallback: T) => Promise<T>
}

export function normalizePlanBuilderFavoriteStorageValue(
  value: unknown,
): PlanBuilderFavoriteStorageValue {
  if (value && typeof value === 'object') {
    const candidate = value as Partial<PlanBuilderFavoriteStorageValue>
    const folders = Array.isArray(candidate.folders)
      ? candidate.folders.filter(
          (folder): folder is string =>
            typeof folder === 'string' && folder.trim().length > 0,
        )
      : []
    const favorites = Array.isArray(candidate.favorites)
      ? candidate.favorites.filter(
          (
            item,
          ): item is {
            id?: string
            label?: string
            path?: string
            folder?: string
          } =>
            Boolean(
              item &&
              typeof item === 'object' &&
              typeof (item as { path?: string }).path === 'string' &&
              typeof (item as { label?: string }).label === 'string',
            ),
        )
      : []

    return {
      favorites,
      folders,
    }
  }

  return { favorites: [], folders: [] }
}

export async function loadPlanBuilderFavoriteStorage(
  dependencies: PlanBuilderFavoriteStorageDependencies = {},
): Promise<PlanBuilderFavoriteStorageValue> {
  const loadRecord = dependencies.loadJsonRecord ?? loadJsonRecord
  const storedValue = await loadRecord<unknown>(FAVORITES_KEY, {
    favorites: [],
    folders: [],
  })
  return normalizePlanBuilderFavoriteStorageValue(storedValue)
}
