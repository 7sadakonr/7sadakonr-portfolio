import { useState } from 'react'
import Panel from '../ui/Panel'
import DataTable, { type Column } from '../ui/DataTable'
import ProjectDrawer from './ProjectDrawer'
import type { ProjectRow } from '../../hooks/useAnalytics'

interface ProjectsPanelProps {
  rows: ProjectRow[]
  isLoading: boolean
  error?: string | null
}

export const clickThrough = (row: ProjectRow): number =>
  row.opens > 0 ? Math.round(((row.github_clicks + row.demo_clicks) / row.opens) * 1000) / 10 : 0

const ProjectsPanel = ({ rows, isLoading, error }: ProjectsPanelProps) => {
  const [selected, setSelected] = useState<ProjectRow | null>(null)
  const maxOpens = Math.max(1, ...rows.map((row) => row.opens))

  const columns: Column<ProjectRow>[] = [
    {
      key: 'title',
      header: 'Project',
      sortValue: (row) => (row.title || row.slug).toLowerCase(),
      render: (row) => <span className="adm-cell-strong">{row.title || row.slug}</span>,
    },
    {
      key: 'opens',
      header: 'Opens',
      align: 'right',
      sortValue: (row) => row.opens,
      render: (row) => (
        <span className="adm-bar-cell">
          <span className="adm-bar" aria-hidden="true"><span className="adm-bar__fill" style={{ width: `${(row.opens / maxOpens) * 100}%` }} /></span>
          <span className="adm-num">{row.opens.toLocaleString()}</span>
        </span>
      ),
    },
    { key: 'github', header: 'GitHub clicks', align: 'right', sortValue: (row) => row.github_clicks, render: (row) => <span className="adm-num">{row.github_clicks.toLocaleString()}</span> },
    { key: 'demo', header: 'Demo clicks', align: 'right', sortValue: (row) => row.demo_clicks, render: (row) => <span className="adm-num">{row.demo_clicks.toLocaleString()}</span> },
    { key: 'ctr', header: 'Click-through', align: 'right', sortValue: clickThrough, render: (row) => <span className="adm-num">{clickThrough(row)}%</span> },
  ]

  return (
    <>
      <Panel
        title="Projects"
        description="Which projects get opened, and how often people follow through to GitHub or the live demo."
        isLoading={isLoading}
        error={error}
        empty={rows.length === 0 ? { title: 'No project activity in this period', description: 'Opens and outbound clicks appear here once visitors interact with a project.' } : null}
      >
        <DataTable
          caption="Project performance"
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.slug}
          onRowActivate={setSelected}
          rowActionLabel={(row) => `Open details for ${row.title || row.slug}`}
          defaultSort={{ key: 'opens', direction: 'desc' }}
        />
      </Panel>
      <ProjectDrawer project={selected} onClose={() => setSelected(null)} />
    </>
  )
}

export default ProjectsPanel
