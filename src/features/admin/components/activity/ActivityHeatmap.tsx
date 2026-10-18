import { useMemo, useState } from 'react'
import Panel from '../ui/Panel'
import {
  buildCalendarWeeks,
  buildDayCells,
  buildHourCells,
  heatLevel,
  HEATMAP_METRICS,
  peakCell,
  type HeatCell,
  type HeatmapMetric,
} from '../../hooks/analyticsActivity'
import type { AnalyticsWindow, RangeKey } from '../../hooks/analyticsTime'
import type { SeriesPoint } from '../../hooks/useAnalytics'

interface ActivityHeatmapProps {
  /** Hourly window for 24h, daily window for 7d / 30d. */
  window: AnalyticsWindow
  timeseries: SeriesPoint[]
  range: RangeKey
  isLoading: boolean
  error?: string | null
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PERIOD: Record<RangeKey, string> = { '24h': 'last 24 hours', '7d': 'last 7 days', '30d': 'last 30 days' }

const ActivityHeatmap = ({ window, timeseries, range, isLoading, error }: ActivityHeatmapProps) => {
  const [metric, setMetric] = useState<HeatmapMetric>('page_views')
  const [selected, setSelected] = useState<string | null>(null)
  const metricInfo = HEATMAP_METRICS.find((item) => item.key === metric)
  const isHours = range === '24h'
  const { cells, max } = useMemo(
    () => (isHours ? buildHourCells(window, timeseries, metric) : buildDayCells(window, timeseries, metric)),
    [isHours, window, timeseries, metric],
  )
  const weeks = useMemo(() => (range === '30d' ? buildCalendarWeeks(cells) : []), [range, cells])
  const peak = useMemo(() => peakCell(cells), [cells])
  const detail = cells.find((cell) => cell.key === selected)?.label ?? null

  const caption = (cell: HeatCell) => (isHours ? cell.title : range === '7d' ? `${cell.title} ${cell.day}` : String(cell.day))

  const renderCell = (cell: HeatCell) => (
    <button
      key={cell.key}
      type="button"
      className={`adm-hm-cell adm-heat-${heatLevel(cell.value, max)}${cell.isCurrent ? ' is-current' : ''}${selected === cell.key ? ' is-selected' : ''}`}
      title={cell.label}
      aria-label={cell.label}
      aria-pressed={selected === cell.key}
      onClick={() => setSelected(selected === cell.key ? null : cell.key)}
    >
      <span className="adm-hm-cell__caption">{caption(cell)}</span>
      <span className="adm-hm-cell__value">{cell.value}</span>
    </button>
  )

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
      title={`Busiest ${isHours ? 'hours' : 'days'}, ${PERIOD[range]}`}
      description={`${isHours ? 'Each square is one hour' : 'Each square is one day'}. Darker means more (Bangkok time).`}
      actions={tabs}
      isLoading={isLoading}
      error={error}
      empty={max === 0 ? { title: `No ${metricInfo?.noun} in the ${PERIOD[range]}` } : null}
    >
      {peak && (
        <p className="adm-hm-summary">
          <strong>Busiest {isHours ? 'hour' : 'day'}:</strong> {peak.label}
        </p>
      )}

      {isHours && <div className="adm-hm-hours" role="group" aria-label={`${metricInfo?.label} by hour`}>{cells.map(renderCell)}</div>}
      {range === '7d' && <div className="adm-hm-strip" role="group" aria-label={`${metricInfo?.label} by day`}>{cells.map(renderCell)}</div>}
      {range === '30d' && (
        <div className="adm-hm-cal" role="group" aria-label={`${metricInfo?.label} by day`}>
          {WEEKDAYS.map((name) => <span key={name} className="adm-hm-cal__weekday" aria-hidden="true">{name}</span>)}
          {weeks.flat().map((cell, index) => (cell ? renderCell(cell) : <span key={`pad-${index}`} className="adm-hm-pad" aria-hidden="true" />))}
        </div>
      )}

      <div className="adm-hm-footer">
        <p className="adm-hm-detail" role="status">{detail ?? 'Tap a square to see the exact figure.'}</p>
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
