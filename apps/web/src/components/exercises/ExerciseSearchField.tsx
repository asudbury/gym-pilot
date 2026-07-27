import { forwardRef } from 'react'
import { appTokens } from '../../constants/tokens'

type ExerciseSearchFieldProps = {
  id?: string
  label?: string
  value?: string
  placeholder?: string
  className?: string
  onChange?: (value: string) => void
  onClear?: () => void
}

export const ExerciseSearchField = forwardRef<
  HTMLInputElement,
  ExerciseSearchFieldProps
>(
  (
    {
      id = 'exercise-search',
      value = '',
      placeholder = 'Search for exercise... (BB, DB, etc.)',
      className,
      onChange,
    },
    ref,
  ) => {
    return (
      <div className={className}>
        <div className="relative w-full">
          <input
            ref={ref}
            id={id}
            type="search"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="search"
            className={`${appTokens.input} h-10 w-full pr-16 text-sm outline-none ring-0 focus:border-slate-400 sm:pr-24`}
          />
        </div>
      </div>
    )
  },
)
