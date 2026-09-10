import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { TimeSeriesMetric, TimeSeriesPoint } from '../../hooks/useAnalytics'

interface InteractionChartProps {
  data: TimeSeriesPoint[]
  metric: TimeSeriesMetric
  onMetricChange: (metric: TimeSeriesMetric) => void
  isLoading: boolean
  metricTotal?: number
}

const METRIC_CONFIG: Record<TimeSeriesMetric, { label: string; color: string; fillGradient: string }> = {
  visitors: {
    label: 'Unique Visitors',
    color: '#10b981',
    fillGradient: 'colorVisitors',
  },
  interactions: {
    label: 'All Interactions',
    color: '#1b6b50',
    fillGradient: 'colorInteractions',
  },
  project_opens: {
    label: 'Project Opens',
    color: '#8b5cf6',
    fillGradient: 'colorProjects',
  },
  external_clicks: {
    label: 'External Clicks',
    color: '#2563eb',
    fillGradient: 'colorClicks',
  },
  resume_downloads: {
    label: 'Resume Downloads',
    color: '#d97706',
    fillGradient: 'colorResume',
  },
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

const InteractionChart = ({
  data,
  metric,
  onMetricChange,
  isLoading,
  metricTotal,
}: InteractionChartProps) => {
  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    count: typeof d.count === 'number' && !isNaN(d.count) && isFinite(d.count) ? d.count : 0,
    rawDate: d.date,
  }))

  const totalCount = chartData.reduce((sum, pt) => sum + pt.count, 0)
  const displayedTotal = typeof metricTotal === 'number' ? metricTotal : totalCount
  const activeConfig = METRIC_CONFIG[metric]

  return (
    <div className="analytics-chart-panel">
      <div className="analytics-chart-header">
        <div>
          <div className="analytics-chart-title-row">
            <h2 className="analytics-section-title">Activity Timeline</h2>
            {!isLoading && (
              <span className="analytics-chart-total-pill" style={{ borderColor: activeConfig.color, color: activeConfig.color }}>
                {displayedTotal.toLocaleString()} {activeConfig.label}
              </span>
            )}
          </div>
          <p className="analytics-section-subtitle">
            Daily engagement distribution across selected period
          </p>
        </div>

        <div className="analytics-metric-segmented" role="group" aria-label="Chart metric">
          {(Object.keys(METRIC_CONFIG) as TimeSeriesMetric[]).map((key) => {
            const cfg = METRIC_CONFIG[key]
            const isActive = metric === key
            return (
              <button
                key={key}
                type="button"
                className={`analytics-segment-btn ${isActive ? 'active' : ''}`}
                onClick={() => onMetricChange(key)}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="analytics-chart-container">
        {isLoading && (
          <div className="analytics-chart-loading">
            <div className="analytics-spinner" aria-hidden="true" />
            <span>Calculating daily timeline…</span>
          </div>
        )}
        {!isLoading && (
          <ResponsiveContainer width="100%" height={340} minWidth={0}>
            <AreaChart data={chartData} margin={{ top: 18, right: 16, left: -16, bottom: 4 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#e6eae6" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#69746e"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#d9ddd5' }}
                dy={6}
              />
              <YAxis
                stroke="#69746e"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[0, (dataMax: number) => Math.max(5, dataMax)]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#17201d',
                  color: '#ffffff',
                  border: '0',
                  borderRadius: '12px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
                  padding: '10px 14px',
                  fontSize: '13px',
                }}
                itemStyle={{ color: '#ffffff', fontWeight: 700 }}
                labelStyle={{ fontWeight: 600, color: '#a8b9ae', marginBottom: '4px' }}
                formatter={(value) => [
                  `${Number(value ?? 0).toLocaleString()} ${metric === 'visitors' ? 'visitors' : 'events'}`,
                  activeConfig.label,
                ]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={activeConfig.color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#chartGradient)"
                activeDot={{ r: 6, fill: activeConfig.color, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default InteractionChart
