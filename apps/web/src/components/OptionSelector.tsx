import { Button } from './ui/Button'

type OptionSelectorProps<T extends string> = {
  options: readonly T[]
  value: T | null
  onChange: (value: T) => void
  getLabel: (option: T) => string
  className?: string
}

export function OptionSelector<T extends string>({
  options,
  value,
  onChange,
  getLabel,
  className = '',
}: OptionSelectorProps<T>) {
  return (
    <div
      className={['flex flex-wrap gap-2', className].filter(Boolean).join(' ')}
    >
      {options.map((option) => {
        const isSelected = value === option

        return (
          <Button
            key={option}
            onClick={() => onChange(option)}
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
            {getLabel(option)}
          </Button>
        )
      })}
    </div>
  )
}
