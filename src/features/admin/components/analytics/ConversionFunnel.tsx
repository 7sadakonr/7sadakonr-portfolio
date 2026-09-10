import type { FunnelData } from '../../hooks/useAnalytics'

interface ConversionFunnelProps {
  data: FunnelData | null
  isLoading: boolean
}

const ConversionFunnel = ({ data, isLoading }: ConversionFunnelProps) => {
  const steps = [
    { label: 'All Sessions', sublabel: 'Visitors arriving at portfolio', count: data?.sessions ?? 0 },
    { label: 'Viewed Projects', sublabel: 'Scrolled down to project section', count: data?.viewed_projects ?? 0 },
    { label: 'Opened Project', sublabel: 'Interacted with specific project cards', count: data?.opened_project ?? 0 },
    { label: 'Clicked Demo / GitHub', sublabel: 'Explored live work or source code', count: data?.clicked_link ?? 0 },
    { label: 'High-Intent Action', sublabel: 'Downloaded Resume or tapped Contact', count: data?.converted ?? 0 },
  ]

  const baseSessions = steps[0]?.count ?? 1

  return (
    <div className="analytics-card-panel">
      <div className="analytics-panel-header">
        <div>
          <h2 className="analytics-section-title">Visitor Journey Funnel</h2>
          <p className="analytics-section-subtitle">
            Progression from landing on the portfolio to taking high-value actions
          </p>
        </div>
      </div>

      <div className="analytics-funnel-pipeline">
        {isLoading && <div className="text-center py-8 text-muted">Calculating conversion funnel…</div>}
        {!isLoading &&
          steps.map((step, index) => {
            const overallPct = baseSessions > 0 ? (step.count / baseSessions) * 100 : 0
            const prevCount = index > 0 ? steps[index - 1]?.count ?? step.count : step.count
            const stepDropoff = prevCount > 0 ? (step.count / prevCount) * 100 : 0

            return (
              <div key={step.label} className="analytics-pipeline-row">
                <div className="analytics-pipeline-meta">
                  <div className="analytics-pipeline-index">{index + 1}</div>
                  <div className="analytics-pipeline-info">
                    <span className="analytics-pipeline-title">{step.label}</span>
                    <small className="analytics-pipeline-sub">{step.sublabel}</small>
                  </div>
                </div>

                <div className="analytics-pipeline-stats">
                  <span className="analytics-pipeline-count">{step.count.toLocaleString()}</span>
                  <div className="analytics-pipeline-badge-group">
                    <span className="analytics-pipeline-badge-overall">{overallPct.toFixed(1)}% total</span>
                    {index > 0 && (
                      <span className="analytics-pipeline-badge-step">
                        {stepDropoff.toFixed(1)}% from prev
                      </span>
                    )}
                  </div>
                </div>

                <div className="analytics-pipeline-track" aria-hidden="true">
                  <div
                    className="analytics-pipeline-fill"
                    style={{
                      width: `${Math.min(100, Math.max(3, overallPct))}%`,
                    }}
                  />
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default ConversionFunnel
