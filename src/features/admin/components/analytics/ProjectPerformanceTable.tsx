import { useState } from 'react'
import type { ProjectPerformanceRow } from '../../hooks/useAnalytics'
import ProjectDrawer from './ProjectDrawer'

interface ProjectPerformanceTableProps {
  data: ProjectPerformanceRow[]
  isLoading: boolean
}

const ProjectPerformanceTable = ({ data, isLoading }: ProjectPerformanceTableProps) => {
  const [selectedProject, setSelectedProject] = useState<ProjectPerformanceRow | null>(null)
  const rows = data.map((row) => {
    const githubClicks = Number.isFinite(row.github_clicks) ? row.github_clicks : 0
    const demoClicks = Number.isFinite(row.demo_clicks) ? row.demo_clicks : 0
    const opens = Number.isFinite(row.opens) ? row.opens : 0
    const rateNumber = opens > 0 ? (githubClicks + demoClicks) / opens * 100 : 0
    const rate = Number.isFinite(rateNumber) ? rateNumber.toFixed(1) : '0.0'
    return { ...row, githubClicks, demoClicks, opens, rate, rateNumber }
  })

  return (
    <div className="analytics-card-panel">
      <div className="analytics-panel-header">
        <div>
          <h2 className="analytics-section-title">Individual Project Engagement</h2>
          <p className="analytics-section-subtitle">
            Opens, unique visitors &amp; external link conversions per project (Click row to view details)
          </p>
        </div>
      </div>

      <div className="analytics-table-responsive analytics-table-desktop">
        <table className="analytics-table analytics-table--interactive">
          <thead>
            <tr>
              <th>Project</th>
              <th className="text-right">Opens</th>
              <th className="text-right">Unique Visitors</th>
              <th className="text-right">GitHub</th>
              <th className="text-right">Demo</th>
              <th className="text-right">Click Rate</th>
              <th className="text-center">Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">
                  Loading project engagement metrics…
                </td>
              </tr>
            )}
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">
                  No project engagement recorded yet.
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((row) => {
                return (
                  <tr
                    key={row.slug}
                    onClick={() => setSelectedProject(row)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedProject(row)
                      }
                    }}
                  >
                    <td>
                      <div className="analytics-project-meta-cell">
                        <span className="analytics-project-name">{row.title || row.slug}</span>
                        <code className="analytics-project-slug">{row.slug}</code>
                      </div>
                    </td>
                    <td className="text-right font-medium">{row.opens.toLocaleString()}</td>
                    <td className="text-right">{row.visitors.toLocaleString()}</td>
                    <td className="text-right">{row.githubClicks.toLocaleString()}</td>
                    <td className="text-right">{row.demoClicks.toLocaleString()}</td>
                    <td className="text-right">
                      <span className={`analytics-ctr-pill ${row.rateNumber >= 15 ? 'high' : row.rateNumber >= 5 ? 'medium' : 'normal'}`}>
                        {row.rate}%
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="analytics-view-action" aria-label="View project details">
                        Inspect →
                      </span>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      <ul className="analytics-mobile-card-list" aria-label="Project engagement cards">
        {isLoading && <li className="analytics-mobile-card-state">Loading project engagement metrics…</li>}
        {!isLoading && rows.length === 0 && <li className="analytics-mobile-card-state">No project engagement recorded yet.</li>}
        {!isLoading && rows.map((row) => (
          <li className="analytics-mobile-data-card analytics-mobile-project-card" key={row.slug}>
            <div className="analytics-project-meta-cell">
              <span className="analytics-project-name">{row.title || row.slug}</span>
              <code className="analytics-project-slug">{row.slug}</code>
            </div>
            <dl className="analytics-mobile-metrics">
              <div><dt>Opens</dt><dd>{row.opens.toLocaleString()}</dd></div>
              <div><dt>Unique Visitors</dt><dd>{row.visitors.toLocaleString()}</dd></div>
              <div><dt>GitHub</dt><dd>{row.githubClicks.toLocaleString()}</dd></div>
              <div><dt>Demo</dt><dd>{row.demoClicks.toLocaleString()}</dd></div>
              <div><dt>Click Rate</dt><dd>{row.rate}%</dd></div>
            </dl>
            <button type="button" className="analytics-mobile-inspect" onClick={() => setSelectedProject(row)} aria-label={`Inspect ${row.title || row.slug}`}>
              Inspect details
            </button>
          </li>
        ))}
      </ul>

      {selectedProject && (
        <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </div>
  )
}

export default ProjectPerformanceTable
