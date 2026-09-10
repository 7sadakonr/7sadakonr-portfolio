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
  const rows = data.map((row, index) => {
    const sessions = Number.isFinite(row.sessions) ? row.sessions : 0
    const interactions = Number.isFinite(row.interactions) ? row.interactions : 0
    const conversions = Number.isFinite(row.conversions) ? row.conversions : 0
    const convRateNumber = sessions > 0 ? (conversions / sessions) * 100 : 0
    const convRate = Number.isFinite(convRateNumber) ? convRateNumber.toFixed(1) : '0.0'

    return { ...row, index, sessions, interactions, conversions, convRateNumber, convRate }
  })

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

      <div className="analytics-table-responsive analytics-table-desktop">
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
              rows.map((row) => {
                return (
                  <tr key={`${row.source}-${row.campaign}-${row.index}`}>
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
                        <span>{row.convRate}%</span>
                        <div className="analytics-mini-bar" aria-hidden="true">
                          <div
                            className="analytics-mini-fill"
                            style={{ width: `${Math.min(100, row.convRateNumber)}%` }}
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

      <ul className="analytics-mobile-card-list" aria-label="UTM campaign cards">
        {isLoading && <li className="analytics-mobile-card-state">Loading UTM attribution data…</li>}
        {!isLoading && rows.length === 0 && <li className="analytics-mobile-card-state">No UTM campaigns detected yet.</li>}
        {!isLoading && rows.map((row) => (
          <li className="analytics-mobile-data-card" key={`${row.source}-${row.campaign}-${row.index}`}>
            <div className="analytics-mobile-card-heading">
              <span className={`utm-source-badge ${getSourceBadgeClass(row.source)}`}>{row.source}</span>
              <code className="analytics-campaign-code">{row.campaign}</code>
            </div>
            <dl className="analytics-mobile-metrics">
              <div><dt>Sessions</dt><dd>{row.sessions.toLocaleString()}</dd></div>
              <div><dt>Interactions</dt><dd>{row.interactions.toLocaleString()}</dd></div>
              <div><dt>Conversions</dt><dd>{row.conversions.toLocaleString()}</dd></div>
              <div><dt>Conversion rate</dt><dd>{row.convRate}%</dd></div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default UtmTable
