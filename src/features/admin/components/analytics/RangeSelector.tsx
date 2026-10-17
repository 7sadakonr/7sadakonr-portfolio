import { RANGE_OPTIONS, type RangeKey } from '../../hooks/analyticsTime'

interface RangeSelectorProps {
  value: RangeKey
  onChange: (range: RangeKey) => void
}

const RangeSelector = ({ value, onChange }: RangeSelectorProps) => (
  <div className="ad-segmented" role="radiogroup" aria-label="Date range">
    {RANGE_OPTIONS.map((option) => (
      <button
        key={option.key}
        type="button"
        role="radio"
        aria-checked={value === option.key}
        aria-label={option.long}
        className={`ad-segmented__option${value === option.key ? ' is-active' : ''}`}
        onClick={() => onChange(option.key)}
      >
        {option.label}
      </button>
    ))}
  </div>
)

export default RangeSelector
