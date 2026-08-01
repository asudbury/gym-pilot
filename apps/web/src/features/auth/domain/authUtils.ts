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
