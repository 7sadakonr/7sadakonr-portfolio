import { useState } from 'react'
import type { ProjectPerformanceRow } from '../../hooks/useAnalytics'
import ProjectDrawer from './ProjectDrawer'

interface ProjectPerformanceTableProps {
  data: ProjectPerformanceRow[]
  isLoading: boolean
}

const ProjectPerformanceTable = ({ data, isLoading }: ProjectPerformanceTableProps) => {
  const [selectedProject, setSelectedProject] = useState<ProjectPerformanceRow | null>(null)

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

      <div className="analytics-table-responsive">
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
              data.map((row) => {
                const totalClicks = row.github_clicks + row.demo_clicks
                const rate = row.opens > 0 ? ((totalClicks / row.opens) * 100).toFixed(1) : '0.0'
                const rateNum = parseFloat(rate)

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
                    <td className="text-right">{row.github_clicks.toLocaleString()}</td>
                    <td className="text-right">{row.demo_clicks.toLocaleString()}</td>
                    <td className="text-right">
                      <span className={`analytics-ctr-pill ${rateNum >= 15 ? 'high' : rateNum >= 5 ? 'medium' : 'normal'}`}>
                        {rate}%
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

      {selectedProject && (
        <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </div>
  )
}

export default ProjectPerformanceTable
