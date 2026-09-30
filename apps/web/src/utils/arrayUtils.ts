/**
 * Moves an item at `index` one position in the given `direction` within `items`.
 * Returns the original array unchanged when the move is out of bounds.
 */
export function reorder<T>(
  items: T[],
  index: number,
  direction: 'up' | 'down',
): T[] {
  if (index < 0) {
    return items
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const [currentItem] = nextItems.splice(index, 1)
  nextItems.splice(targetIndex, 0, currentItem)

  return nextItems
}
