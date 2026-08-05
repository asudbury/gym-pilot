import type { ComponentProps } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { Button } from '../ui/Button'

type DateRange = [Date, Date]

type CalendarValue = ComponentProps<typeof Calendar>['value']

type DateRangePickerProps = {
  customRange: DateRange | null
  onCustomRangeChange: (range: DateRange | null) => void
}

export function CustomDateRangePicker({
  customRange,
  onCustomRangeChange,
}: DateRangePickerProps) {
  const handleFromChange = (value: CalendarValue) => {
    if (Array.isArray(value) || value === null || value === undefined) {
      return
    }

    if (value instanceof Date) {
      onCustomRangeChange(
        value === null ? null : [value, customRange?.[1] ?? value],
      )
    }
  }

  const handleToChange = (value: CalendarValue) => {
    if (Array.isArray(value) || value === null || value === undefined) {
      return
    }

    if (value instanceof Date) {
      onCustomRangeChange(
        value === null ? null : [customRange?.[0] ?? value, value],
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
        <div className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 md:min-w-[280px] md:p-3">
          <p className="mb-2 text-sm font-semibold">From</p>
          <Calendar
            onChange={handleFromChange}
            value={customRange?.[0] ?? null}
            className="react-calendar-mobile"
          />
        </div>
        <div className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 md:min-w-[280px] md:p-3">
          <p className="mb-2 text-sm font-semibold">To</p>
          <Calendar
            onChange={handleToChange}
            value={customRange?.[1] ?? null}
            minDate={customRange ? customRange[0] : undefined}
            className="react-calendar-mobile"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onCustomRangeChange(null)} tone="default">
          Clear range
        </Button>
        {customRange?.[0] != null && customRange?.[1] != null && (
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {customRange[0].toLocaleDateString('en-US')} -{' '}
            {customRange[1].toLocaleDateString('en-US')}
          </span>
        )}
      </div>
    </div>
  )
}
