export const MIN_SEARCH_CHARS = Number.isFinite(
  Number(import.meta.env.VITE_MIN_SEARCH_CHARS),
)
  ? Number(import.meta.env.VITE_MIN_SEARCH_CHARS)
  : 3
