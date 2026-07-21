import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  exercises,
  exercisesSchema,
  getSupabaseClient,
  loadAppSetting,
  loadSupabaseProfileFlag,
  logger,
  usePlan,
} from '@gym-pilot/shared'
import { useAuth } from '../../../auth/AuthContext'
import { useDeviceType } from '../../../components/tierDeviceVisibility'
import {
  isVisibleForTierAndDevice,
  type TierVisibilityRules,
} from '../../../features/visibility/domain/tierDeviceVisibility'
import { HOME_FILTER_KEY } from '../../../constants/storageKeys'
import { getExercisePath } from '../../../utils/exerciseRouteUtils'
import { formatLabel } from '../../../utils/formatUtils'
import {
  getHashHomeUrl,
  normalizeHomeFilters,
  type HomeFilters,
} from '../../../utils/appUtils'
import { buildNavigationMenuItems } from '../../../utils/navigationUtils'
import { useFavouritesFeature } from '../../favourites/hooks/useFavouritesFeature'
import {
  sortQuickLinks,
  type QuickLink,
} from '../../favourites/domain/quickLinks'
import { isAppleDevice, isInstalledAsApp } from '../../../utils/pwa'

export function useAppShell() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { users, visiblePlans, visibleAssignments } = usePlan()
  const deviceType = useDeviceType()
  const currentTier = user?.accountTier ?? 'free'
  const { favorites, folders, setFavorites, setFolders } =
    useFavouritesFeature()

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [showInstallHint, setShowInstallHint] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('')

  useEffect(() => {
    window.sessionStorage.setItem(
      HOME_FILTER_KEY,
      JSON.stringify(normalizeHomeFilters(homeFilters)),
    )
  }, [homeFilters])

  useEffect(() => {
    const client = getSupabaseClient()

    if (!client || pathname !== '/auth/callback') {
      return
    }

    logger.info('[App] Handling Supabase auth callback', { pathname, search })

    void client.auth
      .exchangeCodeForSession(window.location.href)
      .then(({ error }) => {
        if (error) {
          logger.error('Supabase auth callback failed', error)
          return
        }

        logger.info('[App] Supabase auth callback succeeded; redirecting home')
        window.dispatchEvent(new Event('gym-pilot-auth-updated'))
        window.location.assign(getHashHomeUrl())
      })
  }, [pathname, search])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname, user?.id, user?.email])

  useEffect(() => {
    let isActive = true

    if (!user?.id) {
      setMustChangePassword(false)
      return
    }

    void (async () => {
      try {
        const flag = await loadSupabaseProfileFlag(
          'must_change_password',
          user.id,
        )
        if (!isActive) return
        setMustChangePassword(Boolean(flag))
      } catch {
        if (isActive) setMustChangePassword(false)
      }
    })()

    return () => {
      isActive = false
    }
  }, [user?.id])

  useEffect(() => {
    let isActive = true

    const refreshBroadcastMessage = async () => {
      const message = await loadAppSetting('broadcast_messages', '')

      if (isActive) {
        setBroadcastMessage(typeof message === 'string' ? message : '')
      }
    }

    void refreshBroadcastMessage()

    const handleSettingsUpdated = () => {
      void refreshBroadcastMessage()
    }

    window.addEventListener('gym-pilot-settings-updated', handleSettingsUpdated)

    return () => {
      isActive = false
      window.removeEventListener(
        'gym-pilot-settings-updated',
        handleSettingsUpdated,
      )
    }
  }, [])

  useEffect(() => {
    const isApple = isAppleDevice()
    const isInstalled = isInstalledAsApp()

    if (isInstalled || !isApple) {
      setShowInstallHint(false)
      return
    }

    setShowInstallHint(true)
  }, [])

  const handleToggleFavoriteExercise = (exerciseId: string) => {
    logger.debug(`Toggling favorite exercise: ${exerciseId}`)

    const parsed = exercisesSchema.parse(exercises)
    const exercise = parsed.find((item) => item.id === exerciseId)

    if (!exercise) {
      return
    }

    const favoriteLink: QuickLink = {
      id: `exercise-${exercise.id}`,
      label: formatLabel(exercise.name),
      path: getExercisePath(exercise),
    }

    const alreadySaved = favorites.some(
      (item) => item.path === favoriteLink.path,
    )

    if (alreadySaved) {
      setFavorites((current) =>
        sortQuickLinks(
          current.filter((item) => item.path !== favoriteLink.path),
        ),
      )
      return
    }

    setFavorites((current) =>
      sortQuickLinks([favoriteLink, ...current]).slice(0, 8),
    )
  }

  const isExerciseFavorite = (exerciseId: string) => {
    const parsed = exercisesSchema.parse(exercises)
    const exercise = parsed.find((item) => item.id === exerciseId)

    return Boolean(
      exercise &&
      favorites.some((item) => item.path === getExercisePath(exercise)),
    )
  }

  const plansCount = visiblePlans.length
  const isTrainer = Boolean(
    user && (user.role === 'trainer' || user.roles?.includes('trainer')),
  )
  const isClient = Boolean(
    user && (user.role === 'client' || user.roles?.includes('client')),
  )
  const assignedTrainer =
    isClient && user?.trainerId
      ? users.find((candidate) => candidate.id === user.trainerId)
      : undefined
  const appName = isTrainer
    ? user?.applicationName?.trim() || 'Gym-Pilot'
    : assignedTrainer &&
        (assignedTrainer.applicationName?.trim() ||
          assignedTrainer.name?.trim())
      ? assignedTrainer.applicationName?.trim() || assignedTrainer.name?.trim()
      : 'Gym-Pilot'
  const hasTimetableAccess = Boolean(
    user?.gymName?.trim() && /^\d+$/.test(user.gymName.trim()),
  )

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : []

  const desktopMenuItems = buildNavigationMenuItems({
    plansCount,
    assignmentsCount: visibleAssignments.length,
    isAuthenticated: Boolean(user),
    showTimetable: hasTimetableAccess,
    itemClassName: 'px-2 py-1.5 text-sm font-medium',
    userRoles,
    tier: currentTier,
    deviceType,
  })
  const tabletMenuItems = buildNavigationMenuItems({
    plansCount,
    assignmentsCount: visibleAssignments.length,
    isAuthenticated: Boolean(user),
    showTimetable: hasTimetableAccess,
    onItemClick: () => setMobileMenuOpen(false),
    itemClassName:
      'rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50',
    userRoles,
    tier: currentTier,
    deviceType,
  })
  const mobileMenuItems = buildNavigationMenuItems({
    plansCount,
    assignmentsCount: visibleAssignments.length,
    isAuthenticated: Boolean(user),
    showTimetable: hasTimetableAccess,
    onItemClick: () => setMobileMenuOpen(false),
    itemClassName:
      'rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50',
    userRoles,
    tier: currentTier,
    deviceType,
  })

  const routeVisibilityRules: Record<string, TierVisibilityRules | undefined> =
    {
      '/record-session': {
        minTier: 'bronze',
        visibleOn: ['desktop', 'tablet'],
      },
      '/sessions': { minTier: 'bronze', visibleOn: ['desktop', 'tablet'] },
    }

  const currentRouteVisibility = routeVisibilityRules[pathname]
  const isCurrentRouteVisible = isVisibleForTierAndDevice(
    currentTier,
    deviceType,
    currentRouteVisibility,
  )

  const handleAuthClick = () => {
    setMobileMenuOpen(false)

    if (user) {
      logout()
      return
    }

    navigate('/login')
  }

  return {
    appName,
    broadcastMessage,
    currentRouteVisibility,
    currentTier,
    desktopMenuItems,
    deviceType,
    favorites,
    folders,
    handleAuthClick,
    handleToggleFavoriteExercise,
    homeFilters,
    isCurrentRouteVisible,
    isExerciseFavorite,
    mobileMenuItems,
    mobileMenuOpen,
    mustChangePassword,
    pathname,
    setFavorites,
    setFolders,
    setHomeFilters,
    setMobileMenuOpen,
    setShowInstallHint,
    showInstallHint,
    tabletMenuItems,
    user,
  }
}
