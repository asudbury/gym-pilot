import { useEffect, useMemo, useState } from 'react'
import { HOME_FILTER_KEY } from '../../../constants/storageKeys'
import { normalizeHomeFilters, type HomeFilters } from '../domain/quickLinks'

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

  return useMemo(
    () => ({
      menuOpen,
      setMenuOpen,
      selectedFolder,
      setSelectedFolder,
      homeFilters,
      setHomeFilters,
    }),
    [homeFilters, menuOpen, selectedFolder],
  )
}
