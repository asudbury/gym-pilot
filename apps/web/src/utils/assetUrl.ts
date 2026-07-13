export function getAssetUrl(path: string) {
  if (!path) {
    return path
  }

  if (/^(https?:)?\/\//i.test(path)) {
    return path
  }

  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
