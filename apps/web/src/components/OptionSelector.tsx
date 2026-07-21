import { Button } from './Button'

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
            type="button"
            onClick={() => onChange(option)}
            tone={isSelected ? 'blue' : 'white'}
            className={[
              'px-3 py-1.5 text-sm font-semibold shadow-sm',
              isSelected ? 'ring-2 ring-sky-200' : '',
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
