import { Button } from './ui/Button'

type RatingSelectorProps = {
  value: number | null
  onChange: (value: number) => void
  className?: string
}

export function RatingSelector({
  value,
  onChange,
  className = '',
}: RatingSelectorProps) {
  return (
    <div
      className={['flex flex-wrap gap-2', className].filter(Boolean).join(' ')}
    >
      {[1, 2, 3, 4, 5].map((rating) => {
        const isSelected = value === rating

        return (
          <Button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            tone={isSelected ? 'blue' : 'white'}
            className={[
              'px-3 py-1.5 text-sm font-semibold shadow-sm',
              isSelected ? 'ring-2 ring-sky-200' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={isSelected}
          >
            {rating} / 5
          </Button>
        )
      })}
    </div>
  )
}
