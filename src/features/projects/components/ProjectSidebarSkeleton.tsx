import type { CSSProperties } from 'react'
import type { SkeletonPhase } from '../../../hooks/useDelayedLoading'
import '../../../components/LineSidebar/LineSidebar.css'
import { getProjectCatalog } from '../data/projectCatalogStore'
import './ProjectLoadingSkeletons.css'

interface ProjectSidebarSkeletonProps {
  phase?: SkeletonPhase
}

const FALLBACK_LABELS = ['Todo-List', 'Portfolio Website', 'Zendix File Transfer', 'Nyeta']

// Mirrors ProjectSidebar's LineSidebar markup (marker, index, title, expanded first item)
// so the ghost occupies the same box; text is transparent and painted as a ghost fill.
const ProjectSidebarSkeleton = ({ phase }: ProjectSidebarSkeletonProps) => {
  const labels = getProjectCatalog()?.map((project) => project.title) ?? FALLBACK_LABELS

  return (
    <nav
      className="line-sidebar line-sidebar--align-right line-sidebar--markers project-sidebar-skeleton"
      data-phase={phase}
      aria-hidden="true"
      style={{ '--font-size': '2.2rem', '--item-gap': '20px', '--marker-length': '60px' } as CSSProperties}
    >
      <ul className="line-sidebar__list">
        {labels.map((label, index) => (
          <li key={index} className="line-sidebar__item">
            <span className="line-sidebar__marker" />
            <span className="line-sidebar__label">
              <span className="line-sidebar__index skeleton-sidebar-ghost skeleton-ghost">{String(index + 1).padStart(2, '0')}</span>
              <div className="line-sidebar__content">
                <span className="line-sidebar__text skeleton-sidebar-ghost skeleton-ghost">{label}</span>
                {index === 0 && (
                  <div className="skeleton-sidebar-detail">
                    <div className="skeleton-sidebar-lines">
                      {[0, 1, 2, 3, 4, 5].map((line) => <span key={line} className="skeleton-ghost" />)}
                    </div>
                    <div className="skeleton-sidebar-pills">
                      {[0, 1, 2, 3, 4].map((pill) => <span key={pill} className="skeleton-ghost" />)}
                    </div>
                    <div className="skeleton-sidebar-actions">
                      <span className="skeleton-ghost" />
                      <span className="skeleton-ghost" />
                    </div>
                  </div>
                )}
              </div>
            </span>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default ProjectSidebarSkeleton
