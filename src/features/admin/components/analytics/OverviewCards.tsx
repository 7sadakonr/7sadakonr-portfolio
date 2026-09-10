import type { AnalyticsOverviewData, DateRangeDays, TimeSeriesMetric } from '../../hooks/useAnalytics'

interface OverviewCardsProps {
  data: AnalyticsOverviewData | null
  days: DateRangeDays
  isLoading: boolean
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
  activeMetric,
  onSelectMetric,
}: OverviewCardsProps) => {
  const visitorsGrowth = calculateGrowth(data?.visitors ?? 0, data?.visitors_prev ?? 0)
  const todayGrowth = calculateGrowth(data?.visitors_today ?? 0, data?.visitors_yesterday ?? 0)
  const interactionsGrowth = calculateGrowth(data?.interactions ?? 0, data?.interactions_prev ?? 0)

  const primaryCards: Array<{
    title: string
    value: number
    description: string
    badge: string
    growth: GrowthInfo | null
    growthLabel: string | null
    accent: string
    metric?: TimeSeriesMetric
    icon: React.ReactNode
  }> = [
    {
      title: 'Total Visitors',
      value: data?.visitors ?? 0,
      description: days === 1 ? 'Unique visitors across last 24 hours' : `Unique visitors across last ${days} days`,
      badge: 'Audience',
      growth: visitorsGrowth,
      growthLabel: days === 1 ? 'vs prev 24h' : `vs prev ${days}d`,
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
      value: data?.visitors_today ?? 0,
      description: 'Active visitors since midnight (today)',
      badge: 'Live',
      growth: todayGrowth,
      growthLabel: 'vs yesterday',
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
    <div className="analytics-kpi-container">
      {/* 4 Primary Cards */}
      <div className="analytics-overview-grid">
        {primaryCards.map((card) => {
          const isInteractive = Boolean(card.metric && onSelectMetric)
          const isActive = Boolean(card.metric && activeMetric === card.metric)
          return (
            <div
              key={card.title}
              className={`analytics-kpi-card analytics-kpi-card--${card.accent} ${isInteractive ? 'analytics-kpi-card--interactive' : ''} ${isActive ? 'is-active' : ''}`}
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
              <div className="analytics-kpi-top">
                <span className="analytics-kpi-icon">{card.icon}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isActive && <span className="analytics-kpi-active-tag">Active</span>}
                  <span className="analytics-kpi-badge">{card.badge}</span>
                </div>
              </div>
              <div className="analytics-kpi-body">
                <span className="analytics-kpi-title">{card.title}</span>
                <div className="analytics-kpi-number-row">
                  <span className="analytics-kpi-number">
                    {isLoading ? (
                      <span className="analytics-kpi-skeleton">--</span>
                    ) : typeof card.value === 'number' ? (
                      isNaN(card.value) ? '0' : card.value.toLocaleString()
                    ) : (
                      card.value || '0'
                    )}
                  </span>
                  {!isLoading && card.growth && (
                    <span className={`analytics-growth-badge ${card.growth.direction}`}>
                      {card.growth.symbol} {card.growth.rateText}
                    </span>
                  )}
                </div>
                <div className="analytics-kpi-footer-row">
                  <p className="analytics-kpi-desc">{card.description}</p>
                  {!isLoading && card.growthLabel && (
                    <small className="analytics-growth-label">{card.growthLabel}</small>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 4 Supporting Metric Tiles */}
      <div className="analytics-kpi-secondary-grid">
        {secondaryCards.map((sec) => {
          const isInteractive = Boolean(sec.metric && onSelectMetric)
          const isActive = Boolean(sec.metric && activeMetric === sec.metric)
          return (
            <div
              key={sec.title}
              className={`analytics-subtile ${isInteractive ? 'analytics-subtile--interactive' : ''} ${isActive ? 'is-active' : ''}`}
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
            <div className="analytics-subtile-head">
              <span className="analytics-subtile-icon">{sec.icon}</span>
              <span className="analytics-subtile-title">{sec.title}</span>
              {isActive && <span className="analytics-subtile-active-tag">Active</span>}
            </div>
            <div className="analytics-subtile-val">
              {isLoading ? (
                '--'
              ) : typeof sec.value === 'number' ? (
                isNaN(sec.value) ? '0' : sec.value.toLocaleString()
              ) : (
                sec.value || '0'
              )}
            </div>
            <small className="analytics-subtile-desc">{sec.description}</small>
          </div>
        )
      })}
      </div>
    </div>
  )
}

export default OverviewCards
