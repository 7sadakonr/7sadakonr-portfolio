import { useMemo, useState } from 'react'
import Panel from '../ui/Panel'
import {
  buildHeatmap,
  buildWeekdayHeatmap,
  busiestHours,
  heatLevel,
  HEATMAP_METRICS,
  type HeatmapMetric,
} from '../../hooks/analyticsActivity'
import type { AnalyticsWindow, RangeKey } from '../../hooks/analyticsTime'
import type { SeriesPoint } from '../../hooks/useAnalytics'

interface ActivityHeatmapProps {
  window: AnalyticsWindow
  timeseries: SeriesPoint[]
  /** 30d sums each weekday-hour across the month; 24h and 7d show the last 7 real days. */
  range: RangeKey
  isLoading: boolean
  error?: string | null
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const pad = (hour: number) => String(hour).padStart(2, '0')

const ActivityHeatmap = ({ window, timeseries, range, isLoading, error }: ActivityHeatmapProps) => {
  const [metric, setMetric] = useState<HeatmapMetric>('page_views')
  const [selected, setSelected] = useState<string | null>(null)
  const isMonth = range === '30d'
  const metricInfo = HEATMAP_METRICS.find((item) => item.key === metric)
  const heatmap = useMemo(
    () => (isMonth ? buildWeekdayHeatmap(timeseries, metric) : buildHeatmap(window, timeseries, metric)),
    [isMonth, window, timeseries, metric],
  )
  const top = useMemo(() => busiestHours(heatmap, 3), [heatmap])
  const periodLabel = isMonth ? 'last 30 days' : 'last 7 days'

  const detail = useMemo(() => {
    if (!selected) return null
    for (const day of heatmap.days) {
      for (const cell of day.cells) if (`${day.key}-${cell.hour}` === selected) return cell.label
    }
    return null
  }, [heatmap, selected])

  const tabs = (
    <div className="adm-segmented adm-segmented--small" role="tablist" aria-label="Heatmap metric">
      {HEATMAP_METRICS.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={metric === item.key}
          className={`adm-segmented__option${metric === item.key ? ' is-active' : ''}`}
          onClick={() => { setMetric(item.key); setSelected(null) }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )

  return (
    <Panel
      title={`Busiest hours, ${periodLabel}`}
      description={
        isMonth
          ? 'Each row is a weekday, each square an hour, summed over the month. Darker means more (Bangkok time).'
          : 'Each row is a day, each square an hour. Darker means more (Bangkok time).'
      }
      actions={tabs}
      isLoading={isLoading}
      error={error}
      empty={heatmap.max === 0 ? { title: `No ${metricInfo?.noun} in the ${periodLabel}` } : null}
    >
      {top.length > 0 && (
        <p className="adm-gh-heat__summary">
          <strong>Busiest hour: {pad(top[0]!.hour)}:00–{pad((top[0]!.hour + 1) % 24)}:00</strong>
          <span> · {top[0]!.value.toLocaleString()} {metricInfo?.noun}</span>
          {top.length > 1 && (
            <span className="adm-gh-heat__runners"> · then {top.slice(1).map((item) => `${pad(item.hour)}:00`).join(', ')}</span>
          )}
        </p>
      )}

      <div className="adm-gh-heat" role="group" aria-label={`${metricInfo?.label} by ${isMonth ? 'weekday' : 'day'} and hour`}>
        <div className="adm-gh-heat__axis" aria-hidden="true">
          <span className="adm-gh-heat__corner" />
          {HOURS.map((hour) => (
            <span key={hour} className="adm-gh-heat__hour">{hour % 6 === 0 ? pad(hour) : ''}</span>
          ))}
        </div>
        {heatmap.days.map((day) => (
          <div key={day.key} className="adm-gh-heat__row">
            <span className="adm-gh-heat__day">{day.label}</span>
            {day.cells.map((cell) => {
              const id = `${day.key}-${cell.hour}`
              return (
                <button
                  key={cell.hour}
                  type="button"
                  className={`adm-gh-heat__cell adm-heat-${heatLevel(cell.value, heatmap.max)}${cell.value === null ? ' is-future' : ''}${selected === id ? ' is-selected' : ''}`}
                  title={cell.label}
                  aria-label={cell.label}
                  aria-pressed={selected === id}
                  onClick={() => setSelected(selected === id ? null : id)}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="adm-gh-heat__footer">
        <p className="adm-gh-heat__detail" role="status">{detail ?? 'Tap a square to see the exact hour.'}</p>
        <div className="adm-heatmap__legend" aria-hidden="true">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => <span key={level} className={`adm-heatmap__swatch adm-heat-${level}`} />)}
          <span>More</span>
        </div>
      </div>
    </Panel>
  )
}

export default ActivityHeatmap
