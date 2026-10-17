import Panel from '../ui/Panel'
import { ChannelIcon } from './ChannelIcon'
import { getUtmSourceInfo } from './utmHelper'
import type { Traffic, TrafficStatus } from '../../hooks/useAnalytics'

interface ReferrersPanelProps {
  traffic: Traffic | null
  status: TrafficStatus
  isLoading: boolean
}

const ReferrersPanel = ({ traffic, status, isLoading }: ReferrersPanelProps) => {
  const rows = traffic?.topReferrers ?? []
  const max = Math.max(1, ...rows.map((row) => row.count))
  const unavailable = status === 'unconfigured' || status === 'error'

  return (
    <Panel
      title="Referrers"
      description="Where visitors came from. Source: Vercel Web Analytics."
      isLoading={isLoading && status === 'loading'}
      empty={unavailable
        ? { title: status === 'unconfigured' ? 'Vercel Web Analytics is not connected' : 'Referrer data is unavailable' }
        : rows.length === 0 ? { title: 'No referrers yet', description: 'Direct visits and links from other sites will be listed here.' } : null}
    >
      <ul className="ad-rank">
        {rows.map((row) => {
          const info = getUtmSourceInfo(null, null, row.referrer)
          return (
            <li key={row.referrer} className="ad-rank__item">
              <span className="ad-rank__label">
                <ChannelIcon channel={info.theme.key} className="w-4 h-4 shrink-0" />
                <span className="ad-truncate">{row.referrer}</span>
              </span>
              <span className="ad-bar" aria-hidden="true"><span className="ad-bar__fill" style={{ width: `${(row.count / max) * 100}%` }} /></span>
              <span className="ad-num">{row.count.toLocaleString()}</span>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

export default ReferrersPanel
