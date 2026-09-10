import type { AnalyticsOverviewData } from '../../hooks/useAnalytics'

interface OverviewCardsProps {
  data: AnalyticsOverviewData | null
  isLoading: boolean
}

const OverviewCards = ({ data, isLoading }: OverviewCardsProps) => {
  const primaryCards = [
    {
      title: 'Total Interactions',
      value: data?.interactions ?? 0,
      description: 'Clicks, scrolls, project views & downloads',
      badge: 'All Activity',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      accent: 'emerald',
    },
    {
      title: 'Project Opens',
      value: data?.project_opens ?? 0,
      description: 'Portfolio project cards explored',
      badge: 'Portfolio',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
      accent: 'purple',
    },
    {
      title: 'External Clicks',
      value: data?.external_clicks ?? 0,
      description: 'GitHub, Live Demo, LinkedIn & social links',
      badge: 'Outbound',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      ),
      accent: 'blue',
    },
    {
      title: 'Resume Downloads',
      value: data?.resume_downloads ?? 0,
      description: 'PDF downloads (Thai & English versions)',
      badge: 'High Intent',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      accent: 'amber',
    },
  ]

  const secondaryStats = [
    {
      label: 'Custom Behavioral Sessions',
      value: data?.sessions ? data.sessions.toLocaleString() : '0',
      hint: '30-minute inactivity window (excludes bots)',
    },
    {
      label: 'Avg. Actions Per Session',
      value: data ? `${data.avg_session_events} events` : '0 events',
      hint: 'Engagement depth per active visit',
    },
  ]

  return (
    <div className="analytics-kpi-container">
      <div className="analytics-overview-grid">
        {primaryCards.map((card) => (
          <div key={card.title} className={`analytics-kpi-card analytics-kpi-card--${card.accent}`}>
            <div className="analytics-kpi-top">
              <span className="analytics-kpi-icon">{card.icon}</span>
              <span className="analytics-kpi-badge">{card.badge}</span>
            </div>
            <div className="analytics-kpi-body">
              <span className="analytics-kpi-title">{card.title}</span>
              <div className="analytics-kpi-number">
                {isLoading ? <span className="analytics-kpi-skeleton">--</span> : card.value.toLocaleString()}
              </div>
              <p className="analytics-kpi-desc">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="analytics-kpi-subbar">
        {secondaryStats.map((item) => (
          <div key={item.label} className="analytics-substat-item">
            <span className="analytics-substat-label">{item.label}</span>
            <div className="analytics-substat-row">
              <strong className="analytics-substat-value">
                {isLoading ? '--' : item.value}
              </strong>
              <span className="analytics-substat-hint">{item.hint}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OverviewCards
