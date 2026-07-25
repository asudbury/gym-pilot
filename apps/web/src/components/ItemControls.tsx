import { useState } from 'react'
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
    <div className={className ?? ''}>
      {isConfirmingDelete ? (
        <>
          <Button
            type="button"
            onClick={() => {
              onRemove()
              setIsConfirmingDelete(false)
            }}
            tone="destructive"
           >
            <DecorativeIcon icon="check" className="h-4 w-4" />
            <span>Confirm</span>
          </Button>
          <Button
            type="button"
            onClick={() => setIsConfirmingDelete(false)}
            tone="default"
            className="ml-2"
           >
            <DecorativeIcon icon="close" className="h-4 w-4" />
            <span>Cancel</span>
          </Button>
        </>
      ) : (
        <>
           {isFirst ? (
                <span/>
              ) : (
                <Button
                  type="button"
                  tone="default"
                  onClick={() => onReorder('up')}
                  disabled={isFirst}
                  aria-label={`Move ${itemName} up`}
                  className="mr-2"
                >
                  {isFirst ? (
                      <DecorativeIcon className="h-4 w-4" />
                    ) : (
                      <DecorativeIcon icon="arrowUp" className="h-4 w-4" />
                    )
                  }
                </Button>
              )
            }
  
          {isLast ? (
            <span/>
          ) : (
            <Button
              type="button"
              tone="default"
              onClick={() => onReorder('down')}
            disabled={isLast}
              aria-label={`Move ${itemName} down`}
              className="mr-2"
            >
              {isLast ? (
                <DecorativeIcon className="h-4 w-4" />
              ) : (
                <DecorativeIcon icon="arrowDown" className="h-4 w-4" />
              )}
            </Button>
          )}  
          <Button
            type="button"
            tone="destructive"
            onClick={() => setIsConfirmingDelete(true)}
          >
            <DecorativeIcon icon="trash" className="h-4 w-4" />
            {removeText && 'Remove'}
          </Button>
        </>
      )}
    </div>
  )
}
