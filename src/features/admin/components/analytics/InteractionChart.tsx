import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Tabs } from '@heroui/react'
import type { DateRangeDays, TimeSeriesMetric, TimeSeriesPoint, TrafficInsights } from '../../hooks/useAnalytics'
import { formatAnalyticsDate } from '../../hooks/analyticsTime'

interface InteractionChartProps {
  data: TimeSeriesPoint[]
  metric: TimeSeriesMetric
  onMetricChange?: (metric: TimeSeriesMetric) => void
  isLoading: boolean
  isVisitorDataAvailable?: boolean
  metricTotal?: number
  days?: DateRangeDays
  insights?: TrafficInsights
}

const METRIC_CONFIG: Record<TimeSeriesMetric, { label: string; color: string; fillGradient: string }> = {
  visitors: {
    label: 'Unique Visitors',
    color: '#34d399',
    fillGradient: 'colorVisitors',
  },
  interactions: {
    label: 'All Interactions',
    color: '#a78bfa',
    fillGradient: 'colorInteractions',
  },
  project_opens: {
    label: 'Project Opens',
    color: '#c084fc',
    fillGradient: 'colorProjects',
  },
  external_clicks: {
    label: 'External Clicks',
    color: '#f472b6',
    fillGradient: 'colorClicks',
  },
  resume_downloads: {
    label: 'Resume Downloads',
    color: '#fbbf24',
    fillGradient: 'colorResume',
  },
}

const METRIC_KEYS: TimeSeriesMetric[] = [
  'visitors',
  'interactions',
  'project_opens',
  'external_clicks',
  'resume_downloads',
]

const InteractionChart = ({
  data,
  metric,
  onMetricChange = () => {},
  isLoading,
  isVisitorDataAvailable,
  metricTotal,
  days = 1,
  insights,
}: InteractionChartProps) => {
  const chartData = data.map((d) => ({
    date: formatAnalyticsDate(d.date, days === 1),
    count: typeof d.count === 'number' && !isNaN(d.count) && isFinite(d.count) ? d.count : 0,
    rawDate: d.date,
  }))

  const totalCount = chartData.reduce((sum, pt) => sum + pt.count, 0)
  const displayedTotal = typeof metricTotal === 'number' ? metricTotal : totalCount
  const activeConfig = METRIC_CONFIG[metric]
  const isVisitorUnavailable = metric === 'visitors' && isVisitorDataAvailable === false
  const totalLabel = metric === 'visitors' ? 'Vercel Visitors' : activeConfig.label
  const subtitle = metric === 'visitors'
    ? `Vercel visitor data · ${days === 1 ? 'Hourly distribution across the last 24 hours' : `Daily distribution across the last ${days} days`}`
    : days === 1
      ? 'Hourly engagement distribution across the last 24 hours'
      : `Daily engagement distribution across the last ${days} days`

  return (
    <div className="analytics-chart-panel">
      <div className="analytics-chart-header">
        <div>
          <div className="analytics-chart-title-row">
            <h2 className="analytics-section-title">Activity Timeline</h2>
            {!isLoading && !isVisitorUnavailable && (
              <span
                className="analytics-chart-total-pill font-bold"
                style={{ borderColor: activeConfig.color, color: activeConfig.color }}
              >
                {displayedTotal.toLocaleString()} {totalLabel}
              </span>
            )}
          </div>
          <p className="analytics-section-subtitle">
            {subtitle}{days === 1 ? ' · UTC' : ''}
          </p>
        </div>

        {/* Mobile dropdown selector */}
        <div className="analytics-metric-select-container md:hidden w-full">
          <label className="analytics-metric-select-label sr-only" htmlFor="chart-metric-select">
            Chart metric
          </label>
          <select
            id="chart-metric-select"
            aria-label="Chart metric"
            value={metric}
            onChange={(e) => onMetricChange?.(e.target.value as TimeSeriesMetric)}
            className="analytics-metric-select w-full bg-[#1c1c24] border border-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-violet-500"
          >
            {METRIC_KEYS.map((k) => (
              <option key={k} value={k} className="bg-[#16161b] text-white">
                {METRIC_CONFIG[k].label}
              </option>
            ))}
          </select>
        </div>

        {/* HeroUI Tabs for Metric Switcher on desktop/tablet */}
        <div className="analytics-desktop-tabs hidden md:block w-full sm:w-auto overflow-x-auto">
          <Tabs
            selectedKey={metric}
            onSelectionChange={(key) => onMetricChange?.(key as TimeSeriesMetric)}
            aria-label="Activity metrics"
          >
            <Tabs.List className="bg-[#1c1c24] border border-zinc-800 rounded-xl p-1 gap-1 flex items-center flex-nowrap shadow-inner">
              {METRIC_KEYS.map((k) => (
                <Tabs.Tab
                  key={k}
                  id={k}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap text-zinc-400 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white transition-all cursor-pointer"
                >
                  {METRIC_CONFIG[k].label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </div>
      </div>

      {insights && !isLoading && (
        <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-xl bg-[#1c1c24] border border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-semibold uppercase text-[10px]">Peak Activity:</span>
            <span className="text-white font-bold">{insights.peakTimeLabel}</span>
            <span className="text-emerald-400 font-semibold">({insights.peakCount.toLocaleString()} events)</span>
          </div>
          <div className="hidden sm:block text-zinc-700">|</div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-semibold uppercase text-[10px]">Daily Average:</span>
            <span className="text-white font-bold">{insights.average.toLocaleString()} {insights.unitLabel}</span>
          </div>
        </div>
      )}

      <div className="analytics-chart-container">
        {isLoading && (
          <div className="analytics-chart-loading">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-violet-400 rounded-full animate-spin" />
            <span>Loading timeline metrics…</span>
          </div>
        )}

        {!isLoading && isVisitorUnavailable && (
          <div className="analytics-chart-empty">
            <p role="status" className="m-0 text-zinc-400">Vercel visitor data is unavailable</p>
          </div>
        )}

        {!isLoading && !isVisitorUnavailable && totalCount === 0 && (
          <div className="analytics-chart-empty">
            <span>No activity recorded for this metric in the selected period.</span>
          </div>
        )}

        {!isLoading && !isVisitorUnavailable && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -2, bottom: 4 }}
            >
              <defs>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f472b6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorResume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#252530" vertical={false} />

              <XAxis
                dataKey="date"
                stroke="#6b6975"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                minTickGap={16}
                interval="preserveStartEnd"
                dy={4}
              />
              <YAxis
                stroke="#6b6975"
                fontSize={10}
                width={36}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickFormatter={(val: number) =>
                  val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : String(val)
                }
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#16161b',
                  border: '1px solid #2e2e38',
                  borderRadius: '12px',
                  color: '#f5f4f8',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                labelStyle={{ color: '#94929d', marginBottom: '4px' }}
                itemStyle={{ color: activeConfig.color }}
                formatter={(val: unknown) => [Number(val).toLocaleString(), activeConfig.label]}
                cursor={{ stroke: '#3f3f4e', strokeWidth: 1, strokeDasharray: '4 4' }}
              />

              <Area
                type="monotone"
                dataKey="count"
                stroke={activeConfig.color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${activeConfig.fillGradient})`}
                activeDot={{ r: 4.5, fill: activeConfig.color, stroke: '#16161b', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default InteractionChart
