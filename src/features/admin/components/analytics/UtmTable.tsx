import type { UtmCampaignRow } from '../../hooks/useAnalytics'

interface UtmTableProps {
  data: UtmCampaignRow[]
  isLoading: boolean
}

function getSourceBadgeClass(source: string): string {
  const s = source.toLowerCase()
  if (s.includes('instagram')) return 'utm-badge--instagram'
  if (s.includes('linkedin')) return 'utm-badge--linkedin'
  if (s.includes('github')) return 'utm-badge--github'
  if (s.includes('twitter') || s.includes('x.com')) return 'utm-badge--x'
  return 'utm-badge--default'
}

const UtmTable = ({ data, isLoading }: UtmTableProps) => {
  return (
    <div className="analytics-card-panel">
      <div className="analytics-panel-header">
        <div>
          <h2 className="analytics-section-title">Inbound Campaign Channels (UTM)</h2>
          <p className="analytics-section-subtitle">
            Attribution from social media profiles, stories &amp; external links
          </p>
        </div>
      </div>

      <div className="analytics-table-responsive">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Channel Source</th>
              <th>Campaign Name</th>
              <th className="text-right">Sessions</th>
              <th className="text-right">Interactions</th>
              <th className="text-right">Conversions</th>
              <th className="text-right">Conv. Rate</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted">
                  Loading UTM attribution data…
                </td>
              </tr>
            )}
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="analytics-empty-state">
                    <p className="font-semibold text-main">No UTM campaigns detected yet</p>
                    <small className="text-muted">
                      Add parameters to your links: <code>?utm_source=linkedin&amp;utm_campaign=profile</code>
                    </small>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading &&
              data.map((row, index) => {
                const convRateNum = row.sessions > 0 ? (row.conversions / row.sessions) * 100 : 0
                const convRate = convRateNum.toFixed(1)
                return (
                  <tr key={`${row.source}-${row.campaign}-${index}`}>
                    <td>
                      <span className={`utm-source-badge ${getSourceBadgeClass(row.source)}`}>
                        {row.source}
                      </span>
                    </td>
                    <td>
                      <code className="analytics-campaign-code">{row.campaign}</code>
                    </td>
                    <td className="text-right font-medium">{row.sessions.toLocaleString()}</td>
                    <td className="text-right">{row.interactions.toLocaleString()}</td>
                    <td className="text-right font-semibold text-accent">{row.conversions.toLocaleString()}</td>
                    <td className="text-right">
                      <div className="analytics-rate-cell">
                        <span>{convRate}%</span>
                        <div className="analytics-mini-bar" aria-hidden="true">
                          <div
                            className="analytics-mini-fill"
                            style={{ width: `${Math.min(100, convRateNum)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UtmTable
