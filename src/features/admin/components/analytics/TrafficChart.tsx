import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Panel from '../ui/Panel'
import { buildTrendRows, type TrendMetric } from '../../hooks/analyticsSeries'
import { summarizeSeries, formatBucketLong, type AnalyticsWindow } from '../../hooks/analyticsTime'
import type { SeriesPoint, Traffic, TrafficStatus } from '../../hooks/useAnalytics'

interface TrafficChartProps {
  window: AnalyticsWindow
  timeseries: SeriesPoint[]
  previousTimeseries: SeriesPoint[]
  traffic: Traffic | null
  trafficStatus: TrafficStatus
  isLoading: boolean
  error?: string | null
  title?: string
  /** Draws a "Now" marker on the latest bucket (use with hourly windows). */
  markCurrent?: boolean
}

const TABS: ReadonlyArray<{ key: TrendMetric; label: string }> = [
  { key: 'visitors', label: 'Visitors' },
  { key: 'page_views', label: 'Page views' },
  { key: 'engagement', label: 'Engagement' },
]

const COLORS = { primary: '#a78bfa', secondary: '#2dd4bf', tertiary: '#fbbf24', previous: '#6b6975', grid: '#252530', axis: '#8b8997' }

const formatTick = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : String(value))

const TrafficChart = ({ window, timeseries, previousTimeseries, traffic, trafficStatus, isLoading, error, title = 'Traffic over time', markCurrent = false }: TrafficChartProps) => {
  const [metric, setMetric] = useState<TrendMetric>('visitors')
  const rows = useMemo(
    () => buildTrendRows(metric, window, timeseries, previousTimeseries, traffic),
    [metric, window, timeseries, previousTimeseries, traffic],
  )
  const unit = window.granularity === 'hour' ? 'hour' : 'day'
  const label = metric === 'visitors' ? 'Visitors' : 'Page views'

  const summary = useMemo(() => {
    const points = rows.map((row) => ({
      key: row.key,
      value: metric === 'engagement' ? row.opens + row.resumes + row.outbound : row.value,
    }))
    return summarizeSeries(points)
  }, [rows, metric])

  const visitorsUnavailable = metric === 'visitors' && (trafficStatus !== 'ok' || !traffic?.seriesAvailable)
  const isEmpty = !visitorsUnavailable && summary.total === 0

  const summaryText = summary.peakKey
    ? `Peak ${formatBucketLong(summary.peakKey, window.granularity)} · ${summary.peakValue.toLocaleString()} · Avg ${summary.average.toLocaleString()} per ${unit} · Total ${summary.total.toLocaleString()}`
    : null

  const tabs = (
    <div className="adm-segmented adm-segmented--small" role="tablist" aria-label="Chart metric">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={metric === tab.key}
          className={`adm-segmented__option${metric === tab.key ? ' is-active' : ''}`}
          onClick={() => setMetric(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )

  let body
  if (visitorsUnavailable) {
    body = {
      title: trafficStatus === 'unconfigured' ? 'Vercel Web Analytics is not connected' : 'Visitor data is unavailable',
      description: trafficStatus === 'unconfigured'
        ? 'Set VERCEL_TOKEN and VERCEL_PROJECT_ID to see unique visitors. The other tabs still work.'
        : 'Vercel did not return visitor data. Try refreshing, or switch to Page views.',
    }
  } else if (isEmpty) {
    body = { title: 'No activity in this period', description: 'Events show up here as soon as people visit the site.' }
  }

  const nowTick = markCurrent ? rows[rows.length - 1]?.tick : undefined
  const nowMarker = nowTick ? <ReferenceLine x={nowTick} stroke="#8b8997" strokeDasharray="3 3" label={{ value: 'Now', fill: '#8b8997', fontSize: 11, position: 'insideTopRight' }} /> : null

  const tooltipStyle = {
    backgroundColor: '#16161b', border: '1px solid #2e2e38', borderRadius: 10, color: '#f5f4f8', fontSize: 12,
  }

  return (
    <Panel
      title={title}
      description={summaryText ?? `Per ${unit}, Bangkok time (GMT+7)`}
      actions={tabs}
      isLoading={isLoading}
      error={error}
      empty={body ?? null}
      bodyClassName="adm-chart"
    >
      <div className="adm-chart__canvas" role="img" aria-label={`${metric === 'engagement' ? 'Engagement' : label} per ${unit}. ${summaryText ?? ''}`}>
        <ResponsiveContainer width="100%" height="100%">
          {metric === 'engagement' ? (
            <BarChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="tick" stroke={COLORS.axis} fontSize={11} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis stroke={COLORS.axis} fontSize={11} width={40} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatTick} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(_, payload) => payload?.[0]?.payload?.long ?? ''} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              {nowMarker}
              <Bar dataKey="opens" name="Project opens" stackId="a" fill={COLORS.primary} />
              <Bar dataKey="resumes" name="Resume downloads" stackId="a" fill={COLORS.secondary} />
              <Bar dataKey="outbound" name="GitHub / Demo clicks" stackId="a" fill={COLORS.tertiary} radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="adTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="tick" stroke={COLORS.axis} fontSize={11} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis stroke={COLORS.axis} fontSize={11} width={40} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatTick} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(_, payload) => payload?.[0]?.payload?.long ?? ''} cursor={{ stroke: '#3f3f4e', strokeDasharray: '4 4' }} />
              <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
              {nowMarker}
              <Line type="monotone" dataKey="previous" name="Previous period" stroke={COLORS.previous} strokeDasharray="5 4" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="value" name={label} stroke={COLORS.primary} strokeWidth={2.25} fill="url(#adTrendFill)" activeDot={{ r: 4 }} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

export default TrafficChart
