import type { TopInteractionRow } from '../../hooks/useAnalytics'

interface TopInteractionsProps {
  data: TopInteractionRow[]
  isLoading: boolean
}

function getEventBadge(item: TopInteractionRow): { text: string; type: string } {
  if (item.event_name === 'project_github_click') return { text: 'GitHub', type: 'github' }
  if (item.event_name === 'project_demo_click') return { text: 'Live Demo', type: 'demo' }
  if (item.event_name === 'project_open') return { text: 'Project View', type: 'project' }
  if (item.event_name === 'resume_download') return { text: 'Resume', type: 'resume' }
  if (item.event_name === 'linkedin_click') return { text: 'LinkedIn', type: 'social' }
  if (item.event_name === 'github_profile_click') return { text: 'GitHub Profile', type: 'social' }
  if (item.event_name === 'email_click') return { text: 'Email', type: 'contact' }
  if (item.event_name === 'navbar_click') return { text: 'Navigation', type: 'nav' }
  if (item.event_name === 'contact_click') return { text: 'Contact', type: 'contact' }
  return { text: 'Action', type: 'default' }
}

const TopInteractions = ({ data, isLoading }: TopInteractionsProps) => {
  const totalInteractions = data.reduce((acc, curr) => acc + curr.total, 0)

  return (
    <div className="analytics-card-panel">
      <div className="analytics-panel-header">
        <div>
          <h2 className="analytics-section-title">Most Popular Actions</h2>
          <p className="analytics-section-subtitle">
            Ranked user interactions by total occurrence
          </p>
        </div>
      </div>

      <div className="analytics-ranked-list">
        {isLoading && <div className="text-center py-8 text-muted">Calculating top actions…</div>}
        {!isLoading && data.length === 0 && (
          <div className="text-center py-8 text-muted">No interactions recorded.</div>
        )}
        {!isLoading &&
          data.slice(0, 10).map((item, idx) => {
            const itemTotal = typeof item.total === 'number' && !isNaN(item.total) ? item.total : 0
            const pctNum = totalInteractions > 0 ? (itemTotal / totalInteractions) * 100 : 0
            const pct = isNaN(pctNum) || !isFinite(pctNum) ? '0.0' : pctNum.toFixed(1)
            const badge = getEventBadge(item)
            const isTopThree = idx < 3

            return (
              <div key={`${item.event_name}-${item.target_label}-${idx}`} className="analytics-ranked-row">
                <div className="analytics-ranked-left">
                  <span className={`analytics-rank-badge ${isTopThree ? `rank-${idx + 1}` : ''}`}>
                    {idx + 1}
                  </span>
                  <div className="analytics-ranked-title-wrap">
                    <span className="analytics-ranked-label">
                      {item.target_label || item.project_slug || item.event_name}
                    </span>
                    <span className={`analytics-action-pill pill-${badge.type}`}>
                      {badge.text}
                    </span>
                  </div>
                </div>

                <div className="analytics-ranked-right">
                  <strong className="analytics-ranked-count">{item.total.toLocaleString()}</strong>
                  <span className="analytics-ranked-pct">{pct}%</span>
                </div>

                <div className="analytics-ranked-bar-bg" aria-hidden="true">
                  <div
                    className="analytics-ranked-bar-fill"
                    style={{ width: `${Math.min(100, Math.max(3, parseFloat(pct)))}%` }}
                  />
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default TopInteractions
