import Panel from '../ui/Panel'
import DataTable, { type Column } from '../ui/DataTable'
import { ChannelIcon } from './ChannelIcon'
import { getUtmSourceInfo } from './utmHelper'
import type { CampaignRow } from '../../hooks/useAnalytics'

interface CampaignsPanelProps {
  rows: CampaignRow[]
  isLoading: boolean
  error?: string | null
}

const columns: Column<CampaignRow>[] = [
  {
    key: 'source',
    header: 'Source',
    sortValue: (row) => row.source.toLowerCase(),
    render: (row) => {
      const info = getUtmSourceInfo(row.source, row.campaign)
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg ${info.theme.badgeClass}`}>
          <ChannelIcon channel={info.theme.key} className="w-3.5 h-3.5 shrink-0" />
          <span>{row.source}</span>
        </span>
      )
    },
  },
  { key: 'campaign', header: 'Campaign', render: (row) => <code className="analytics-campaign-code">{row.campaign}</code> },
  { key: 'visits', header: 'Visits', align: 'right', sortValue: (row) => row.visits, render: (row) => <span className="adm-num">{row.visits.toLocaleString()}</span> },
  { key: 'actions', header: 'Actions', align: 'right', sortValue: (row) => row.actions, render: (row) => <span className="adm-num">{row.actions.toLocaleString()}</span> },
]

const CampaignsPanel = ({ rows, isLoading, error }: CampaignsPanelProps) => (
  <Panel
    title="Campaigns (UTM)"
    description="Visits from tagged links. Actions are project opens, resume downloads and outbound clicks."
    isLoading={isLoading}
    error={error}
    empty={rows.length === 0 ? {
      title: 'No tagged links yet',
      description: <>Add UTM parameters to a link you share, e.g. <code className="analytics-campaign-code">?utm_source=linkedin&amp;utm_campaign=profile</code></>,
    } : null}
  >
    <DataTable
      caption="UTM campaigns"
      columns={columns}
      rows={rows}
      getRowKey={(row) => `${row.source}|${row.campaign}`}
      defaultSort={{ key: 'visits', direction: 'desc' }}
    />
  </Panel>
)

export default CampaignsPanel
