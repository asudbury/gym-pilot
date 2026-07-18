import { useEffect, useState } from 'react'
import { normalizeFavoritesState, type QuickLink } from '../domain/quickLinks'
import { loadFavoritesStorage, saveFavoritesStorage } from '../services/favoritesStorage'

export function useFavoritesFeature() {
  const [favorites, setFavorites] = useState<QuickLink[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false

    void loadFavoritesStorage()
      .then((storedValue) => {
        if (cancelled) {
          return
        }

        const normalizedValue = normalizeFavoritesState(storedValue)
        setFavorites(normalizedValue.favorites)
        setFolders(normalizedValue.folders)
        setHydrated(true)
      })
      .catch(() => {
        if (!cancelled) {
          setFavorites([])
          setFolders([])
          setHydrated(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    void saveFavoritesStorage({ favorites, folders })
  }, [favorites, folders, hydrated])

  return {
    favorites,
    folders,
    hydrated,
    setFavorites,
    setFolders,
  }
}
