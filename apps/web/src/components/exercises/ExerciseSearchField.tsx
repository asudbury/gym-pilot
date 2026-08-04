import { forwardRef } from 'react';
import { appTokens } from '../../constants/tokens';

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
      onClear,
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
          {value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
    )
  },
)
