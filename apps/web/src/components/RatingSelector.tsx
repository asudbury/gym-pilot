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
            onClick={() => onChange(rating)}
            tone="chip"
            className={[
              isSelected
                ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                : '',
              'text-sm font-semibold',
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
