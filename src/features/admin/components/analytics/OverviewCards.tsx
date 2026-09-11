import { Card } from '@heroui/react'
import type { AnalyticsOverviewData, DateRangeDays, TimeSeriesMetric } from '../../hooks/useAnalytics'

interface OverviewCardsProps {
  data: AnalyticsOverviewData | null
  days: DateRangeDays
  isLoading: boolean
  isVisitorDataAvailable: boolean
  activeMetric?: TimeSeriesMetric
  onSelectMetric?: (metric: TimeSeriesMetric) => void
}

interface GrowthInfo {
  rateText: string
  direction: 'positive' | 'negative' | 'neutral'
  symbol: string
}

function calculateGrowth(current: number, previous: number): GrowthInfo {
  const c = typeof current === 'number' && !isNaN(current) && isFinite(current) ? current : 0
  const p = typeof previous === 'number' && !isNaN(previous) && isFinite(previous) ? previous : 0
  if (p === 0) {
    if (c > 0) return { rateText: '+100%', direction: 'positive', symbol: '↑' }
    return { rateText: '0.0%', direction: 'neutral', symbol: '–' }
  }
  const pct = ((c - p) / p) * 100
  if (isNaN(pct) || !isFinite(pct)) return { rateText: '0.0%', direction: 'neutral', symbol: '–' }
  if (pct > 0) {
    return { rateText: `+${pct.toFixed(1)}%`, direction: 'positive', symbol: '↑' }
  }
  if (pct < 0) {
    return { rateText: `${pct.toFixed(1)}%`, direction: 'negative', symbol: '↓' }
  }
  return { rateText: '0.0%', direction: 'neutral', symbol: '–' }
}

const OverviewCards = ({
  data,
  days,
  isLoading,
  isVisitorDataAvailable,
  activeMetric,
  onSelectMetric,
}: OverviewCardsProps) => {
  const visitorsGrowth = isVisitorDataAvailable && data?.visitors_prev != null
    ? calculateGrowth(data.visitors, data.visitors_prev) : null
  const todayAvailable = isVisitorDataAvailable && data?.visitors_today != null
  // A rolling 24-hour query contains only part of yesterday.
  const todayGrowth = days !== 1 && todayAvailable && data?.visitors_yesterday != null
    ? calculateGrowth(data.visitors_today!, data.visitors_yesterday) : null
  const interactionsGrowth = calculateGrowth(data?.interactions ?? 0, data?.interactions_prev ?? 0)

  const primaryCards: Array<{
    title: string
    value: number | string
    description: string
    badge: React.ReactNode
    growth: GrowthInfo | null
    growthLabel: string | null
    accent: string
    metric?: TimeSeriesMetric
    icon: React.ReactNode
  }> = [
    {
      title: 'Total Visitors',
      value: isVisitorDataAvailable ? data?.visitors ?? 0 : 'Unavailable',
      description: days === 1 ? 'Unique visitors across last 24 hours' : `Unique visitors across last ${days} days`,
      badge: isVisitorDataAvailable ? 'Audience' : 'Unavailable',
      growth: visitorsGrowth,
      growthLabel: visitorsGrowth ? (days === 1 ? 'vs prev 24h' : `vs prev ${days}d`) : null,
      accent: 'emerald',
      metric: 'visitors',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: 'Visitors Today',
      value: todayAvailable ? data!.visitors_today! : 'Unavailable',
      description: todayAvailable && data && data.active_now > 0
        ? `${data.active_now} active online (last 5 min)`
        : 'Visitors since midnight (UTC)',
      badge: todayAvailable ? (
        <span className="analytics-kpi-badge-live-content">
          <span className="analytics-live-pulse-dot" />
          {data && data.active_now > 0 ? `${data.active_now} Online` : 'Live'}
        </span>
      ) : 'Unavailable',
      growth: todayGrowth,
      growthLabel: todayGrowth ? 'vs yesterday' : null,
      accent: 'blue',
      metric: 'visitors',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      title: 'Total Interactions',
      value: data?.interactions ?? 0,
      description: 'Clicks, project views, downloads & links',
      badge: 'Engagement',
      growth: interactionsGrowth,
      growthLabel: days === 1 ? 'vs prev 24h' : `vs prev ${days}d`,
      accent: 'purple',
      metric: 'interactions',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      title: 'Resume Downloads',
      value: data?.resume_downloads ?? 0,
      description: 'PDF downloads (Thai & English versions)',
      badge: 'High Intent',
      growth: null,
      growthLabel: null,
      accent: 'amber',
      metric: 'resume_downloads',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
    },
  ]

  const secondaryCards: Array<{
    title: string
    value: string | number
    description: string
    metric?: TimeSeriesMetric
    icon: React.ReactNode
  }> = [
    {
      title: 'Project Opens',
      value: data?.project_opens ?? 0,
      description: 'Project cards & details viewed',
      metric: 'project_opens',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      title: 'External Outbound Clicks',
      value: data?.external_clicks ?? 0,
      description: 'GitHub, Live Demo & social links clicked',
      metric: 'external_clicks',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      ),
    },
    {
      title: 'Custom Behavioral Sessions',
      value: data?.sessions ? data.sessions.toLocaleString() : '0',
      description: 'Distinct visits (30m inactivity reset)',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      title: 'Avg. Actions / Session',
      value: data ? `${data.avg_session_events} events` : '0 events',
      description: 'Mean engagement depth per visitor session',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m16 12-4-4-4 4" />
          <path d="M12 16V8" />
        </svg>
      ),
    },
  ]

  return (
    <div className="analytics-kpi-container flex flex-col gap-5">
      {/* 4 Primary Cards */}
      <div className="analytics-overview-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map((card) => {
          const isInteractive = Boolean(card.metric && onSelectMetric)
          const isActive = Boolean(card.metric && activeMetric === card.metric)
          return (
            <Card
              key={card.title}
              className={`analytics-kpi-card analytics-kpi-card--${card.accent} ${isInteractive ? 'analytics-kpi-card--interactive' : ''} ${isActive ? 'is-active' : ''} border border-zinc-800 bg-[#16161b] hover:border-zinc-700/80 transition-all rounded-xl p-5 shadow-sm`}
              onClick={isInteractive ? () => onSelectMetric!(card.metric!) : undefined}
              role={isInteractive ? 'button' : undefined}
              tabIndex={isInteractive ? 0 : undefined}
              onKeyDown={
                isInteractive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectMetric!(card.metric!)
                      }
                    }
                  : undefined
              }
              title={isInteractive ? `Click to switch timeline graph to ${card.title}` : undefined}
            >
              <div className="analytics-kpi-top flex items-center justify-between gap-2 mb-3">
                <span className="analytics-kpi-icon w-9 h-9 rounded-lg flex items-center justify-center bg-zinc-800/80 text-zinc-300">
                  {card.icon}
                </span>
                <span className="analytics-kpi-badge text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                  {card.badge}
                </span>
              </div>
              <div className="analytics-kpi-body flex flex-col gap-1">
                <span className="analytics-kpi-title text-xs font-semibold text-zinc-400">{card.title}</span>
                <div className="analytics-kpi-number-row flex items-baseline gap-2.5 flex-wrap">
                  <span className="analytics-kpi-number text-2xl font-bold tracking-tight text-zinc-100">
                    {isLoading ? (
                      <span className="analytics-kpi-skeleton">--</span>
                    ) : typeof card.value === 'number' ? (
                      isNaN(card.value) ? '0' : card.value.toLocaleString()
                    ) : (
                      card.value || '0'
                    )}
                  </span>
                  {!isLoading && card.growth && (
                    <span className={`analytics-growth-badge ${card.growth.direction} text-xs font-bold px-1.5 py-0.5 rounded`}>
                      {card.growth.symbol} {card.growth.rateText}
                    </span>
                  )}
                </div>
                <div className="analytics-kpi-footer-row flex items-center justify-between gap-2 mt-1">
                  <p className="analytics-kpi-desc text-xs text-zinc-500 m-0 leading-relaxed">{card.description}</p>
                  {!isLoading && card.growthLabel && (
                    <small className="analytics-growth-label text-[11px] text-zinc-500 shrink-0">{card.growthLabel}</small>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* 4 Supporting Metric Tiles */}
      <div className="analytics-kpi-secondary-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {secondaryCards.map((sec) => {
          const isInteractive = Boolean(sec.metric && onSelectMetric)
          const isActive = Boolean(sec.metric && activeMetric === sec.metric)
          return (
            <Card
              key={sec.title}
              className={`analytics-subtile ${isInteractive ? 'analytics-subtile--interactive' : ''} ${isActive ? 'is-active' : ''} border border-zinc-800/80 bg-[#16161b]/90 hover:border-zinc-700/80 transition-all rounded-xl p-4 shadow-xs`}
              onClick={isInteractive ? () => onSelectMetric!(sec.metric!) : undefined}
              role={isInteractive ? 'button' : undefined}
              tabIndex={isInteractive ? 0 : undefined}
              onKeyDown={
                isInteractive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectMetric!(sec.metric!)
                      }
                    }
                  : undefined
              }
              title={isInteractive ? `Click to switch timeline graph to ${sec.title}` : undefined}
            >
              <div className="analytics-subtile-head flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="analytics-subtile-icon text-zinc-400">{sec.icon}</span>
                  <span className="analytics-subtile-title text-xs font-semibold text-zinc-300">{sec.title}</span>
                </div>
                {isActive && (
                  <span className="analytics-subtile-active-tag" aria-label="Active metric">
                    Active
                  </span>
                )}
              </div>
              <div className="analytics-subtile-val text-lg font-bold text-zinc-100">
                {isLoading ? (
                  '--'
                ) : typeof sec.value === 'number' ? (
                  isNaN(sec.value) ? '0' : sec.value.toLocaleString()
                ) : (
                  sec.value || '0'
                )}
              </div>
              <small className="analytics-subtile-desc text-[11px] text-zinc-500 block mt-1">{sec.description}</small>
            </Card>
          )
        })}
      </div>
    </div>
  )

}

export default OverviewCards
