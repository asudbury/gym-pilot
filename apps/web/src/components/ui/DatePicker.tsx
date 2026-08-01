import React from 'react'

interface DatePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  className?: string
}

const DatePicker: React.FC<DatePickerProps> = ({
  selected,
  onChange,
  className,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value
    if (dateValue) {
      onChange(new Date(dateValue))
    } else {
      onChange(null)
    }
  }

  const toISODateString = (date: Date | null) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }


  return (
    <input
      type="date"
      value={toISODateString(selected)}
      onChange={handleChange}
      className={`form-input rounded-md border-slate-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${className}`}
    />
  )
}

export default DatePicker
