import { useEffect } from 'react'
import type { ProjectPerformanceRow } from '../../hooks/useAnalytics'

interface ProjectDrawerProps {
  project: ProjectPerformanceRow | null
  onClose: () => void
}

const ProjectDrawer = ({ project, onClose }: ProjectDrawerProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!project) return null

  const totalClicks = project.github_clicks + project.demo_clicks
  const conversionRate = project.opens > 0 ? ((totalClicks / project.opens) * 100).toFixed(1) : '0.0'

  return (
    <div className="analytics-drawer-backdrop" onClick={onClose}>
      <aside
        className="analytics-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Project details for ${project.title || project.slug}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="analytics-drawer-header">
          <div>
            <span className="admin-eyebrow">Project Performance</span>
            <h2 className="analytics-drawer-title">{project.title || project.slug}</h2>
            <code className="analytics-slug-badge">{project.slug}</code>
          </div>
          <button type="button" className="analytics-drawer-close" onClick={onClose} aria-label="Close drawer">
            ✕
          </button>
        </div>

        <div className="analytics-drawer-content">
          <div className="analytics-stat-tiles">
            <div className="analytics-tile">
              <span className="analytics-tile-label">Project Opens</span>
              <span className="analytics-tile-value">{project.opens.toLocaleString()}</span>
            </div>
            <div className="analytics-tile">
              <span className="analytics-tile-label">Unique Visitors</span>
              <span className="analytics-tile-value">{project.visitors.toLocaleString()}</span>
            </div>
            <div className="analytics-tile">
              <span className="analytics-tile-label">GitHub Clicks</span>
              <span className="analytics-tile-value">{project.github_clicks.toLocaleString()}</span>
            </div>
            <div className="analytics-tile">
              <span className="analytics-tile-label">Demo Clicks</span>
              <span className="analytics-tile-value">{project.demo_clicks.toLocaleString()}</span>
            </div>
          </div>

          <div className="analytics-drawer-section">
            <h3>Engagement Summary</h3>
            <div className="analytics-breakdown-row">
              <span>Overall CTR (Clicks / Opens)</span>
              <strong>{conversionRate}%</strong>
            </div>
            <div className="analytics-breakdown-row">
              <span>Opens per Unique Visitor</span>
              <strong>{project.visitors > 0 ? (project.opens / project.visitors).toFixed(2) : '1.00'}</strong>
            </div>
            <div className="analytics-breakdown-row">
              <span>External Outbound Clicks</span>
              <strong>{totalClicks.toLocaleString()}</strong>
            </div>
          </div>

          <div className="analytics-drawer-section">
            <h3>Quick Actions</h3>
            <p className="analytics-drawer-hint">
              Compare with Vercel Web Analytics for general pageview and referrer metrics.
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default ProjectDrawer
