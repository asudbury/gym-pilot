import { useEffect } from 'react'
import { Routes, useLocation } from 'react-router-dom'
import { Header } from './components/navigation/Header'
import { Button } from './components/ui/Button'
import { createAuthRoutes } from './routes/authRoutes'
import { createPublicRoutes } from './routes/publicRoutes'
import { useAppShell } from './features/app-shell/hooks/useAppShell'
import { getInstallHint } from './utils/pwa'
import ErrorBoundary from './components/ErrorBoundary'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  const {
    appName,
    broadcastMessage,
    currentRouteVisibility,
    desktopMenuItems,
    favorites,
    folders,
    handleAuthClick,
    handleToggleFavoriteExercise,
    homeFilters,
    isCurrentRouteVisible,
    isExerciseFavorite,
    mobileMenuItems,
    mustChangePassword,
    setFavorites,
    setFolders,
    setHomeFilters,
    setMobileMenuOpen,
    showInstallHint,
    setShowInstallHint,
    tabletMenuItems,
    user,
    mobileMenuOpen,
  } = useAppShell()
  const SHOW_AUTH_BUTTON = true

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <ScrollToTop />
      {broadcastMessage.trim() ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900">
          {broadcastMessage}
        </div>
      ) : null}
      {showInstallHint ? (
        <div className="border-b border-slate-200 bg-slate-900 px-4 py-3 text-sm text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <span>{getInstallHint(true, false)}</span>
            <Button
              type="button"
              onClick={() => setShowInstallHint(false)}
              className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/25"
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
      <Header
        appName={appName}
        favorites={favorites}
        homeFilters={homeFilters}
        desktopMenuItems={desktopMenuItems}
        tabletMenuItems={tabletMenuItems}
        mobileMenuItems={mobileMenuItems}
        mobileMenuOpen={mobileMenuOpen}
        showAuthButton={SHOW_AUTH_BUTTON}
        user={user}
        mustChangePassword={mustChangePassword}
        folders={folders}
        onFoldersChange={setFolders}
        onFavoritesChange={setFavorites}
        onHomeFiltersChange={setHomeFilters}
        onAuthClick={handleAuthClick} // This prop is still needed for auth actions
        onToggleMobileMenu={() => setMobileMenuOpen((current) => !current)} // This prop is still needed for mobile menu
      />

      {currentRouteVisibility && !isCurrentRouteVisible ? (
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold">
            This screen is not available for your current tier or device.
          </h1>
        </div>
      ) : (
        <ErrorBoundary>
          <Routes>
            {createAuthRoutes()}
            {createPublicRoutes({
              user,
              homeFilters,
              onHomeFiltersChange: setHomeFilters,
              onFavoritesChange: setFavorites,
              onFoldersChange: setFolders,
              onToggleFavoriteExercise: handleToggleFavoriteExercise,
              isExerciseFavorite,
              favorites,
              folders,
            })}
          </Routes>
        </ErrorBoundary>
      )}
    </div>
  )
}

export default App
