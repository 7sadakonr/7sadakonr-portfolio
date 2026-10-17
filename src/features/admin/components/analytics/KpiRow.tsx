import StatCard from '../ui/StatCard'
import { computeDelta, type RangeKey } from '../../hooks/analyticsTime'
import type { Overview, SeriesPoint, Traffic, TrafficStatus } from '../../hooks/useAnalytics'

interface KpiRowProps {
  range: RangeKey
  overview: Overview
  timeseries: SeriesPoint[]
  traffic: Traffic | null
  trafficStatus: TrafficStatus
  isLoading: boolean
  overviewFailed: boolean
}

const COMPARISON: Record<RangeKey, string> = {
  '24h': 'vs previous 24 hours',
  '7d': 'vs previous 7 days',
  '30d': 'vs previous 30 days',
}

const KpiRow = ({ range, overview, timeseries, traffic, trafficStatus, isLoading, overviewFailed }: KpiRowProps) => {
  const comparison = COMPARISON[range]
  const { current, previous } = overview
  const db = (value: number) => (overviewFailed ? null : value)
  const visitorsUnavailable = trafficStatus === 'unconfigured'
    ? 'Not connected'
    : trafficStatus === 'error' ? 'Unavailable' : 'Unavailable'

  return (
    <div className="ad-kpi-grid">
      <StatCard
        label="Visitors"
        value={trafficStatus === 'ok' ? traffic?.visitors.current ?? null : null}
        delta={traffic ? computeDelta(traffic.visitors.current ?? 0, traffic.visitors.previous) : undefined}
        comparison={comparison}
        hint="Unique people who visited the site. Source: Vercel Web Analytics."
        sparkline={traffic?.seriesAvailable ? traffic.series.map((point) => point.visitors) : undefined}
        unavailableText={visitorsUnavailable}
        isLoading={isLoading && trafficStatus === 'loading'}
      />
      <StatCard
        label="Page views"
        value={db(current.page_views)}
        delta={computeDelta(current.page_views, previous.page_views)}
        comparison={comparison}
        hint="Pages loaded, including repeat visits. Source: first-party events."
        sparkline={timeseries.map((point) => point.page_views)}
        unavailableText="Unavailable"
        isLoading={isLoading}
      />
      <StatCard
        label="Project opens"
        value={db(current.project_opens)}
        delta={computeDelta(current.project_opens, previous.project_opens)}
        comparison={comparison}
        hint="Times someone opened a project card or picked one in the sidebar."
        sparkline={timeseries.map((point) => point.project_opens)}
        unavailableText="Unavailable"
        isLoading={isLoading}
      />
      <StatCard
        label="Resume downloads"
        value={db(current.resume_downloads)}
        delta={computeDelta(current.resume_downloads, previous.resume_downloads)}
        comparison={comparison}
        hint="Resume PDFs downloaded (English or Thai)."
        sparkline={timeseries.map((point) => point.resume_downloads)}
        unavailableText="Unavailable"
        isLoading={isLoading}
      />
    </div>
  )
}

export default KpiRow
