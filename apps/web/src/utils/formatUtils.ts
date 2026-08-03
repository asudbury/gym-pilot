export const formatLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      // If the first word is 'BB' or 'DB' (case-insensitive), keep it as is (uppercase)
      if (
        index === 0 &&
        (word.toUpperCase() === 'BB' || word.toUpperCase() === 'DB')
      ) {
        return word.toUpperCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
