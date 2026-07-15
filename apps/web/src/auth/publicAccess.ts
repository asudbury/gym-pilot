const PUBLIC_PATH_PREFIXES = ['/exercise/']

export function isPublicRoute(pathname: string) {
  if (!pathname) {
    return false
  }

  if (pathname === '/' || pathname === '/login') {
    return true
  }

  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
