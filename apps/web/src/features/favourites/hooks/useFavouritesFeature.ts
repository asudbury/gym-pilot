import { useEffect, useState } from 'react'
import { type QuickLink } from '../domain/quickLinks'
import { resolveFavouritesHydrationState, resolveFavouritesPersistenceState } from '../domain/favouritesTransitions'
import { loadFavouritesStorage, saveFavouritesStorage } from '../services/favouritesStorage'

export function useFavouritesFeature() {
  const [favorites, setFavorites] = useState<QuickLink[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false

    void loadFavouritesStorage()
      .then((storedValue) => {
        if (cancelled) {
          return
        }

        const normalizedValue = resolveFavouritesHydrationState(storedValue)
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

    void saveFavouritesStorage(resolveFavouritesPersistenceState({ favorites, folders }))
  }, [favorites, folders, hydrated])

  return {
    favorites,
    folders,
    hydrated,
    setFavorites,
    setFolders,
  }
}
