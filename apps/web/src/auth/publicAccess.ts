const PUBLIC_PATH_PREFIXES = ['/exercise/', '/help', '/timetable']

export function isPublicRoute(pathname: string) {
  if (!pathname) {
    return false
  }

  if (pathname === '/' || pathname === '/login') {
    return true
  }

  if (pathname === '/timetable' || pathname.startsWith('/timetable/')) {
    return true
  }

  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
