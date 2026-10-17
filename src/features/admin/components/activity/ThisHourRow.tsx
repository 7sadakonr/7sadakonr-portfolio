import StatCard from '../ui/StatCard'
import { computeDelta } from '../../hooks/analyticsTime'
import type { CurrentHourStats, HourStat } from '../../hooks/analyticsActivity'
import type { TrafficStatus } from '../../hooks/analyticsFetch'

interface ThisHourRowProps {
  stats: CurrentHourStats
  trafficStatus: TrafficStatus
  isLoading: boolean
  failed: boolean
}

const COMPARISON = 'vs same hour yesterday'

const ThisHourRow = ({ stats, trafficStatus, isLoading, failed }: ThisHourRowProps) => {
  const card = (label: string, hint: string, stat: HourStat | null, unavailableText = 'Unavailable') => (
    <StatCard
      label={label}
      value={failed && label !== 'Visitors' ? null : stat?.value ?? null}
      delta={stat ? computeDelta(stat.value, stat.previous) : undefined}
      comparison={COMPARISON}
      hint={hint}
      unavailableText={unavailableText}
      isLoading={isLoading}
    />
  )

  return (
    <section aria-label={`This hour, ${stats.label}`}>
      <h2 className="adm-section-title">This hour <span className="adm-muted">from {stats.label}</span></h2>
      <div className="adm-kpi-grid">
        {card('Visitors', 'Unique people so far this hour. Source: Vercel Web Analytics.', stats.visitors, trafficStatus === 'unconfigured' ? 'Not connected' : 'Unavailable')}
        {card('Page views', 'Pages loaded so far this hour.', stats.pageViews)}
        {card('Project opens', 'Projects opened so far this hour.', stats.projectOpens)}
        {card('Resume downloads', 'Resume PDFs downloaded so far this hour.', stats.resumeDownloads)}
      </div>
    </section>
  )
}

export default ThisHourRow
