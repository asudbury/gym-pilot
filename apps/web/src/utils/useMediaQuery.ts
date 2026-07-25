import { useState, useEffect } from 'react'

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

// Pre-defined media queries for Tailwind CSS breakpoints
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)') // lg breakpoint
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)') // md breakpoint
export const useIsMobile = () => useMediaQuery('(max-width: 767px)') // sm breakpoint
