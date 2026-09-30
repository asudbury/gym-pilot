import { useState } from 'react'
import clsx from 'clsx'
import { Button } from './ui/Button'
import { DecorativeIcon } from './ui/DecorativeIcon'

interface ItemControlsProps {
  itemName: string
  onReorder: (direction: 'up' | 'down') => void
  onRemove: () => void
  isFirst: boolean
  isLast: boolean
  removeText: boolean
  className?: string
}

export const ItemControls = ({
  itemName,
  onReorder,
  onRemove,
  isFirst,
  isLast,
  removeText,
  className,
}: ItemControlsProps) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  return (
    <div className={clsx('flex flex-wrap gap-2', className)}>
      {isConfirmingDelete ? (
        <>
          <Button
            onClick={() => setIsConfirmingDelete(false)}
            tone="default"
            className="min-h-10 px-3 py-2"
          >
            <DecorativeIcon icon="close" className="h-4 w-4" />
            <span>Cancel</span>
          </Button>
          <Button
            onClick={() => {
              onRemove()
              setIsConfirmingDelete(false)
            }}
            tone="destructive"
            className="min-h-10 px-3 py-2"
          >
            <DecorativeIcon icon="check" className="h-4 w-4" />
            <span>Confirm</span>
          </Button>
        </>
      ) : (
        <>
          {isFirst ? (
            <span />
          ) : (
            <Button
              tone="default"
              onClick={() => onReorder('up')}
              disabled={isFirst}
              aria-label={`Move ${itemName} up`}
              className="min-h-10 px-3 py-2"
            >
              <DecorativeIcon icon="arrowUp" className="h-4 w-4" />
            </Button>
          )}

          {isLast ? (
            <Button
              tone="default"
              disabled
              aria-hidden="true"
              className="min-h-10 px-3 py-2 opacity-0 pointer-events-none"
            >
              <DecorativeIcon icon="arrowDown" className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              tone="default"
              onClick={() => onReorder('down')}
              disabled={isLast}
              aria-label={`Move ${itemName} down`}
              className="min-h-10 px-3 py-2"
            >
              <DecorativeIcon icon="arrowDown" className="h-4 w-4" />
            </Button>
          )}
          <Button
            tone="destructive"
            onClick={() => setIsConfirmingDelete(true)}
            className="min-h-10 px-3 py-2"
          >
            <DecorativeIcon icon="trash" className="h-4 w-4" />
            {removeText && 'Remove'}
          </Button>
        </>
      )}
    </div>
  )
}
