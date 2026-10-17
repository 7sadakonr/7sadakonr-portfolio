import { useMemo, useState } from 'react'
import Panel from '../ui/Panel'
import { buildHeatmap, heatLevel, HEATMAP_METRICS, type HeatmapMetric } from '../../hooks/analyticsActivity'
import type { AnalyticsWindow } from '../../hooks/analyticsTime'
import type { SeriesPoint } from '../../hooks/useAnalytics'

interface ActivityHeatmapProps {
  window: AnalyticsWindow
  timeseries: SeriesPoint[]
  isLoading: boolean
  error?: string | null
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)

const ActivityHeatmap = ({ window, timeseries, isLoading, error }: ActivityHeatmapProps) => {
  const [metric, setMetric] = useState<HeatmapMetric>('page_views')
  const heatmap = useMemo(() => buildHeatmap(window, timeseries, metric), [window, timeseries, metric])

  const tabs = (
    <div className="adm-segmented adm-segmented--small" role="tablist" aria-label="Heatmap metric">
      {HEATMAP_METRICS.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={metric === item.key}
          className={`adm-segmented__option${metric === item.key ? ' is-active' : ''}`}
          onClick={() => setMetric(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )

  return (
    <Panel
      title="Busiest hours, last 7 days"
      description="Darker means more. Each row is a day, each column an hour (Bangkok time)."
      actions={tabs}
      isLoading={isLoading}
      error={error}
      empty={heatmap.max === 0 ? { title: `No ${HEATMAP_METRICS.find((item) => item.key === metric)?.noun} in the last 7 days` } : null}
    >
      <div className="adm-heatmap-scroll">
        <table className="adm-heatmap" aria-label={`${HEATMAP_METRICS.find((item) => item.key === metric)?.label} by day and hour`}>
          <thead>
            <tr>
              <td />
              {HOURS.map((hour) => (
                <th key={hour} scope="col" className="adm-heatmap__hour">{hour % 3 === 0 ? String(hour).padStart(2, '0') : ''}<span className="sr-only">{`${String(hour).padStart(2, '0')}:00`}</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.days.map((day) => (
              <tr key={day.key}>
                <th scope="row" className="adm-heatmap__day">{day.label}</th>
                {day.cells.map((cell) => (
                  <td key={cell.hour} className={`adm-heatmap__cell adm-heat-${heatLevel(cell.value, heatmap.max)}${cell.value === null ? ' is-future' : ''}`} title={cell.label} aria-label={cell.label} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adm-heatmap__legend" aria-hidden="true">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => <span key={level} className={`adm-heatmap__swatch adm-heat-${level}`} />)}
        <span>More</span>
      </div>
    </Panel>
  )
}

export default ActivityHeatmap
