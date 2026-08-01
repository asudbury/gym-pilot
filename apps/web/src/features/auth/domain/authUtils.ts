export function getHashHomeUrl(
  locationHref = typeof window !== 'undefined'
    ? window.location.href
    : 'http://localhost/',
) {
  const targetUrl = new URL(
    locationHref,
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost/',
  )
  targetUrl.hash = '#/'
  return targetUrl.toString()
}

export function resolvePostLoginRedirectPath(from?: string | null) {
  const normalizedFrom = from?.trim()

  if (!normalizedFrom || normalizedFrom === '/login') {
    return '/'
  }

  return normalizedFrom
}
