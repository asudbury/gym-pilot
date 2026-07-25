import { Button } from './ui/Button'

interface ItemControlsProps<T extends { id: string }> {
  item: T
  onReorder: (id: string, direction: 'up' | 'down') => void
  onRemove: (id: string) => void
  getItemName?: (item: T) => string
  isFirst: boolean
  isLast: boolean
}

export const ItemControls = <T extends { id: string }>({
  item,
  onReorder,
  onRemove,
  getItemName,
  isFirst,
  isLast,
}: ItemControlsProps<T>) => {
  const itemName = getItemName ? getItemName(item) : 'item'

  return (
    <div className="flex flex-wrap gap-2 md:justify-end">
      <Button
        type="button"
        tone="default"
        className="px-2 py-1 text-xs"
        onClick={() => onReorder(item.id, 'up')}
        disabled={isFirst}
        aria-label={`Move ${itemName} up`}
      >
        ↑
      </Button>
      <Button
        type="button"
        tone="default"
        className="px-2 py-1 text-xs"
        onClick={() => onReorder(item.id, 'down')}
        disabled={isLast}
        aria-label={`Move ${itemName} down`}
      >
        ↓
      </Button>
      <Button
        type="button"
        tone="destructive"
        onClick={() => onRemove(item.id)}
      >
        Remove
      </Button>
    </div>
  )
}
