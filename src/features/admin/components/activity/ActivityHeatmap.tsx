import { useMemo, useState } from 'react'
import Panel from '../ui/Panel'
import {
  buildCalendarWeeks,
  buildDayCells,
  heatLevel,
  HEATMAP_METRICS,
  peakCell,
  type HeatCell,
  type HeatmapMetric,
} from '../../hooks/analyticsActivity'
import type { AnalyticsWindow } from '../../hooks/analyticsTime'
import type { SeriesPoint } from '../../hooks/useAnalytics'

interface ActivityHeatmapProps {
  /** Daily window covering the last 30 days. */
  window: AnalyticsWindow
  timeseries: SeriesPoint[]
  isLoading: boolean
  error?: string | null
}

// GitHub shows Mon / Wed / Fri only; the rows still cover all seven days.
const ROW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const ActivityHeatmap = ({ window, timeseries, isLoading, error }: ActivityHeatmapProps) => {
  const [metric, setMetric] = useState<HeatmapMetric>('page_views')
  const [selected, setSelected] = useState<string | null>(null)
  const metricInfo = HEATMAP_METRICS.find((item) => item.key === metric)
  const { cells, max } = useMemo(() => buildDayCells(window, timeseries, metric), [window, timeseries, metric])
  const weeks = useMemo(() => buildCalendarWeeks(cells), [cells])
  const peak = useMemo(() => peakCell(cells), [cells])
  const detail = cells.find((cell) => cell.key === selected)?.label ?? null

  // Month name above the first week that starts a new month (and the first week), like GitHub.
  const monthLabels = weeks.map((week, index) => {
    const first = week.find((cell): cell is HeatCell => cell !== null)
    if (!first) return ''
    const month = Number(first.key.slice(5, 7)) - 1
    const previous = weeks[index - 1]?.find((cell): cell is HeatCell => cell !== null)
    return !previous || Number(previous.key.slice(5, 7)) - 1 !== month ? MONTHS[month]! : ''
  })

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
      title="Busiest days, last 30 days"
      description="Each square is a day. Darker means more (Bangkok time)."
      actions={tabs}
      isLoading={isLoading}
      error={error}
      empty={max === 0 ? { title: `No ${metricInfo?.noun} in the last 30 days` } : null}
    >
      {peak && (
        <p className="adm-hm-summary">
          <strong>Busiest day:</strong> {peak.label}
        </p>
      )}

      {/* One grid: a month-label row, then seven weekday rows. Columns are weeks, like GitHub. */}
      <div
        className="adm-hm-month"
        role="group"
        aria-label={`${metricInfo?.label} by day`}
        style={{ gridTemplateColumns: `28px repeat(${weeks.length}, minmax(0, 1fr))` }}
      >
        {monthLabels.map((label, week) => (
          <span key={`month-${week}`} className="adm-hm-month__label" style={{ gridColumn: week + 2, gridRow: 1 }} aria-hidden="true">{label}</span>
        ))}
        {ROW_LABELS.map((label, day) => (
          <span key={`row-${day}`} className="adm-hm-month__row" style={{ gridColumn: 1, gridRow: day + 2 }} aria-hidden="true">{label}</span>
        ))}
        {weeks.map((week, weekIndex) =>
          week.map((cell, day) =>
            cell ? (
              <button
                key={cell.key}
                type="button"
                className={`adm-hm-cell adm-heat-${heatLevel(cell.value, max)}${selected === cell.key ? ' is-selected' : ''}`}
                style={{ gridColumn: weekIndex + 2, gridRow: day + 2 }}
                title={cell.label}
                aria-label={cell.label}
                aria-pressed={selected === cell.key}
                onClick={() => setSelected(selected === cell.key ? null : cell.key)}
              />
            ) : null,
          ),
        )}
      </div>

      <div className="adm-hm-footer">
        <p className="adm-hm-detail" role="status">{detail ?? 'Tap a square to see that day.'}</p>
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
