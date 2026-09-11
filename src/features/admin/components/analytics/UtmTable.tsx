import type { UtmCampaignRow } from '../../hooks/useAnalytics'
import { getUtmSourceInfo } from './utmHelper'
import { ChannelIcon } from './ChannelIcon'

interface UtmTableProps {
  data: UtmCampaignRow[]
  isLoading: boolean
}

const UtmTable = ({ data, isLoading }: UtmTableProps) => {
  const rows = data.map((row, index) => {
    const sessions = Number.isFinite(row.sessions) ? row.sessions : 0
    const interactions = Number.isFinite(row.interactions) ? row.interactions : 0
    const conversions = Number.isFinite(row.conversions) ? row.conversions : 0
    const convRateNumber = sessions > 0 ? (conversions / sessions) * 100 : 0
    const convRate = Number.isFinite(convRateNumber) ? convRateNumber.toFixed(1) : '0.0'
    const utm = getUtmSourceInfo(row.source, row.campaign)

    return { ...row, index, sessions, interactions, conversions, convRateNumber, convRate, utm }
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
                <td colSpan={6} className="text-center py-8 text-zinc-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-violet-400 rounded-full animate-spin" />
                    <span>Loading UTM attribution data…</span>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center gap-1.5 text-zinc-400">
                    <p className="font-bold text-white m-0">No UTM campaigns detected yet</p>
                    <small className="text-zinc-500">
                      Add parameters to your links: <code className="text-violet-400 bg-zinc-900 px-1.5 py-0.5 rounded">?utm_source=linkedin&amp;utm_campaign=profile</code>
                    </small>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((row) => {
                return (
                  <tr key={`${row.source}-${row.campaign}-${row.index}`} className="hover:bg-zinc-800/40 transition-colors">
                    <td>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg ${row.utm.theme.badgeClass}`}
                      >
                        <ChannelIcon channel={row.utm.theme.key} className="w-3.5 h-3.5 shrink-0" />
                        <span>{row.source}</span>
                      </span>
                    </td>
                    <td>
                      <code className="analytics-campaign-code">{row.campaign}</code>
                    </td>
                    <td className="text-right font-medium text-white">{row.sessions.toLocaleString()}</td>
                    <td className="text-right text-zinc-300">{row.interactions.toLocaleString()}</td>
                    <td className="text-right font-bold text-emerald-400">{row.conversions.toLocaleString()}</td>
                    <td className="text-right">
                      <div className="analytics-rate-cell">
                        <span className="font-bold text-white">{row.convRate}%</span>
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
          <li className={`analytics-mobile-data-card ${row.utm.theme.cardClass}`} key={`${row.source}-${row.campaign}-${row.index}`}>
            <div className="analytics-mobile-card-heading">
              <span
                className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-lg ${row.utm.theme.badgeClass}`}
              >
                <ChannelIcon channel={row.utm.theme.key} className="w-3.5 h-3.5 shrink-0" />
                <span>{row.source}</span>
              </span>
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
