import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const ANALYTICS_ID = 'G-P2QV3LZH5Y'
const ANALYTICS_ENABLED = import.meta.env?.VITE_ENABLE_ANALYTICS === 'true'

export function GoogleAnalytics() {
  const location = useLocation()

  useEffect(() => {
    if (!ANALYTICS_ENABLED || window.location.hostname === 'localhost') {
      return
    }

    if (!document.getElementById('gym-pilot-analytics-script')) {
      const analyticsScript = document.createElement('script')
      analyticsScript.id = 'gym-pilot-analytics-script'
      analyticsScript.async = true
      analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`
      document.head.appendChild(analyticsScript)
    }

    window.dataLayer = window.dataLayer ?? []
    window.gtag =
      window.gtag ??
      ((...args: unknown[]) => {
        window.dataLayer?.push(args)
      })

    window.gtag('js', new Date())
    window.gtag('config', ANALYTICS_ID, {
      page_path: location.hash || location.pathname + location.search,
    })
  }, [location])

  return null
}
