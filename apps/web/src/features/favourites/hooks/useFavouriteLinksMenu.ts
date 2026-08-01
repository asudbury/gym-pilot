import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { exercises, exercisesSchema } from '@gym-pilot/shared'
import { HOME_FILTER_KEY } from '../../../constants/storageKeys'
import {
  getQuickLinkForPath,
  groupFavoritesByFolder,
  normalizeHomeFilters,
  type HomeFilters,
  type QuickLink,
} from '../domain/quickLinks'
import { useFavouritesFeature } from './useFavouritesFeature'

type UseFavouriteLinksMenuOptions = {
  onMenuOpenChange?: (open: boolean) => void
}

export function useFavouriteLinksMenu({
  onMenuOpenChange,
}: UseFavouriteLinksMenuOptions = {}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('')
  const [homeFilters, setHomeFilters] = useState<HomeFilters>(() => {
    if (typeof window === 'undefined') {
      return { searchTerm: '', selectedCategory: null, showImages: true }
    }

    const savedFilters = window.sessionStorage.getItem(HOME_FILTER_KEY)

    if (!savedFilters) {
      return { searchTerm: '', selectedCategory: null, showImages: true }
    }

    try {
      const parsed = JSON.parse(savedFilters) as Partial<HomeFilters>
      return normalizeHomeFilters(parsed)
    } catch {
      window.sessionStorage.removeItem(HOME_FILTER_KEY)
      return { searchTerm: '', selectedCategory: null, showImages: true }
    }
  })

  const { favorites, setFavorites, folders } = useFavouritesFeature()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    window.sessionStorage.setItem(
      HOME_FILTER_KEY,
      JSON.stringify(normalizeHomeFilters(homeFilters)),
    )
  }, [homeFilters])

  useEffect(() => {
    onMenuOpenChange?.(menuOpen)
  }, [menuOpen, onMenuOpenChange])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null
      const menu = document.getElementById('quick-links-menu')
      const trigger = document.getElementById('quick-links-trigger')

      if (
        menu &&
        trigger &&
        !menu.contains(target) &&
        !trigger.contains(target)
      ) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
    }
  }, [menuOpen])

  useEffect(() => {
    const handleOpenRequest = () => {
      setMenuOpen(true)
    }

    window.addEventListener('gym-pilot-open-favourites-menu', handleOpenRequest)

    return () => {
      window.removeEventListener(
        'gym-pilot-open-favourites-menu',
        handleOpenRequest,
      )
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setMenuOpen((current) => !current)
      }
    }

    window.addEventListener('keydown', handleShortcut)

    return () => {
      window.removeEventListener('keydown', handleShortcut)
    }
  }, [menuOpen])

  const exerciseLookup = useMemo(() => {
    try {
      const parsedExercises = exercisesSchema.parse(exercises)
      return new Map(parsedExercises.map((exercise) => [exercise.id, exercise]))
    } catch {
      return new Map<string, { id: string; name: string }>()
    }
  }, [])

  const currentQuickLink = useMemo(() => {
    return getQuickLinkForPath(location.pathname, exerciseLookup)
  }, [exerciseLookup, location.pathname])

  const favoriteGroups = useMemo(() => {
    const visibleFavorites = selectedFolder
      ? favorites.filter((item) => (item.folder ?? '') === selectedFolder)
      : favorites

    return groupFavoritesByFolder(visibleFavorites)
  }, [favorites, selectedFolder])

  const folderOptions = useMemo(() => {
    const folderNames = Array.from(
      new Set([
        ...folders,
        ...favorites.flatMap((item) => (item.folder ? [item.folder] : [])),
      ]),
    ).filter(Boolean)

    return folderNames.sort((left, right) => left.localeCompare(right))
  }, [favorites, folders])

  const isCurrentLinkFavorite = useMemo(() => {
    if (!currentQuickLink) {
      return false
    }

    return favorites.some((item) => item.path === currentQuickLink.path)
  }, [currentQuickLink, favorites])

  const handleToggleCurrentFavorite = () => {
    if (!currentQuickLink) {
      return
    }

    const isFavorite = favorites.some((item) => item.path === currentQuickLink.path)

    if (isFavorite) {
      setFavorites((current) =>
        current.filter((item) => item.path !== currentQuickLink.path),
      )
      return
    }

    setFavorites((current) => [
      ...current,
      {
        ...currentQuickLink,
        folder: selectedFolder || undefined,
      },
    ])
  }

  const handleRemoveFavoriteLink = (link: QuickLink) => {
    setFavorites((current) =>
      current.filter((item) => item.path !== link.path && item.id !== link.id),
    )
  }

  const handleOpenQuickLink = (link: QuickLink) => {
    navigate(link.path)
    setMenuOpen(false)
  }

  const handleOpenFavouritesPage = () => {
    navigate('/favourites')
    setMenuOpen(false)
  }

  return useMemo(
    () => ({
      menuOpen,
      setMenuOpen,
      selectedFolder,
      setSelectedFolder,
      favorites,
      currentQuickLink,
      favoriteGroups,
      folderOptions,
      isCurrentLinkFavorite,
      handleToggleCurrentFavorite,
      handleRemoveFavoriteLink,
      handleOpenQuickLink,
      handleOpenFavouritesPage,
      homeFilters,
      setHomeFilters,
    }),
    [
      currentQuickLink,
      favoriteGroups,
      favorites,
      folderOptions,
      homeFilters,
      isCurrentLinkFavorite,
      menuOpen,
      selectedFolder,
    ],
  )
}
