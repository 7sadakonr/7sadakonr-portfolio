import type { ReactNode } from 'react'
import type { Delta } from '../../hooks/analyticsTime'

interface StatCardProps {
  label: string
  /** null renders the unavailable state with `unavailableText`. */
  value: number | null
  delta?: Delta
  /** e.g. "vs previous 7 days" */
  comparison?: string
  /** Plain-language definition and data source, shown under the label. */
  hint: string
  sparkline?: number[]
  unavailableText?: string
  isLoading?: boolean
  icon?: ReactNode
}

const Sparkline = ({ values }: { values: number[] }) => {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const step = 100 / (values.length - 1)
  const points = values.map((value, index) => `${(index * step).toFixed(2)},${(28 - (value / max) * 26).toFixed(2)}`).join(' ')
  return (
    <svg className="ad-stat__spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

const DeltaBadge = ({ delta, comparison }: { delta: Delta; comparison?: string }) => {
  if (delta.direction === 'new') {
    return <span className="ad-delta ad-delta--up">New activity<span className="sr-only"> {comparison}</span></span>
  }
  if (delta.pct === null) return null
  const symbol = delta.direction === 'up' ? '▲' : delta.direction === 'down' ? '▼' : '–'
  const word = delta.direction === 'up' ? 'up' : delta.direction === 'down' ? 'down' : 'unchanged'
  return (
    <span className={`ad-delta ad-delta--${delta.direction}`}>
      <span aria-hidden="true">{symbol}</span> {Math.abs(delta.pct)}%
      <span className="sr-only"> {word} {comparison}</span>
    </span>
  )
}

const StatCard = ({ label, value, delta, comparison, hint, sparkline, unavailableText = 'Unavailable', isLoading, icon }: StatCardProps) => (
  <article className="ad-stat">
    <div className="ad-stat__top">
      <h3 className="ad-stat__label">{label}</h3>
      {icon && <span className="ad-stat__icon" aria-hidden="true">{icon}</span>}
    </div>
    {isLoading ? (
      <div className="ad-skeleton ad-skeleton--value" role="status" aria-label={`Loading ${label}`} />
    ) : value === null ? (
      <p className="ad-stat__unavailable">{unavailableText}</p>
    ) : (
      <p className="ad-stat__value">{value.toLocaleString('en-US')}</p>
    )}
    <div className="ad-stat__meta">
      {!isLoading && value !== null && delta && <DeltaBadge delta={delta} comparison={comparison} />}
      {!isLoading && value !== null && delta && comparison && <span className="ad-stat__comparison" aria-hidden="true">{comparison}</span>}
    </div>
    {!isLoading && value !== null && sparkline && <Sparkline values={sparkline} />}
    <p className="ad-stat__hint">{hint}</p>
  </article>
)

export default StatCard
