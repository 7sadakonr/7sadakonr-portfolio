import Panel from '../ui/Panel'
import DataTable, { type Column } from '../ui/DataTable'
import type { HourLogEntry } from '../../hooks/analyticsActivity'

interface HourLogProps {
  entries: HourLogEntry[]
  isLoading: boolean
  error?: string | null
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

const columns: Column<HourLogEntry>[] = [
  { key: 'time', header: 'Hour', render: (entry) => <span className="adm-cell-strong">{entry.long}</span> },
  {
    key: 'projects',
    header: 'Projects opened',
    render: (entry) =>
      entry.projectOpens.length === 0 ? (
        <span className="adm-muted">—</span>
      ) : (
        <ul className="adm-chip-list">
          {entry.projectOpens.map((project) => (
            <li key={project.title} className="adm-badge">{project.title} ×{project.count}</li>
          ))}
        </ul>
      ),
  },
  { key: 'resumes', header: 'Resume', align: 'right', render: (entry) => (entry.resumes > 0 ? <span className="adm-num">{plural(entry.resumes, 'download', 'downloads')}</span> : <span className="adm-muted">—</span>) },
  { key: 'outbound', header: 'GitHub / Demo', align: 'right', render: (entry) => (entry.outbound > 0 ? <span className="adm-num">{plural(entry.outbound, 'click', 'clicks')}</span> : <span className="adm-muted">—</span>) },
]

const HourLog = ({ entries, isLoading, error }: HourLogProps) => (
  <Panel
    title="When people acted"
    description="Hours in the last 24 that had a project opened, a resume downloaded or a link clicked. Newest first."
    isLoading={isLoading}
    error={error}
    empty={entries.length === 0 ? { title: 'No project or resume activity in the last 24 hours', description: 'Each project open and resume download shows up here under the hour it happened.' } : null}
  >
    <DataTable caption="Activity by hour" columns={columns} rows={entries} getRowKey={(entry) => entry.key} />
  </Panel>
)

export default HourLog
