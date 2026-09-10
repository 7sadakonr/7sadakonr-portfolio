import type { DateRangeDays } from '../../hooks/useAnalytics'

interface DateRangeSelectorProps {
  days: DateRangeDays
  onChange: (days: DateRangeDays) => void
}

const DateRangeSelector = ({ days, onChange }: DateRangeSelectorProps) => {
  return (
    <div className="analytics-range-segmented" role="group" aria-label="Select date range">
      <button
        type="button"
        className={`analytics-range-pill ${days === 1 ? 'active' : ''}`}
        onClick={() => onChange(1)}
      >
        1 Day
      </button>
      <button
        type="button"
        className={`analytics-range-pill ${days === 7 ? 'active' : ''}`}
        onClick={() => onChange(7)}
      >
        7 Days
      </button>
      <button
        type="button"
        className={`analytics-range-pill ${days === 30 ? 'active' : ''}`}
        onClick={() => onChange(30)}
      >
        30 Days
      </button>
    </div>
  )
}

export default DateRangeSelector
