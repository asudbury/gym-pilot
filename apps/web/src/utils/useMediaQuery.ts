import { useState, useEffect } from 'react'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    const media = window.matchMedia(query)
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// Pre-defined media queries for Tailwind CSS breakpoints
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)') // lg breakpoint
export const useIsTablet = () =>
  useMediaQuery('(min-width: 768px) and (max-width: 1023px)') // md breakpoint
export const useIsMobile = () => useMediaQuery('(max-width: 767px)') // sm breakpoint
