import './ProjectLoadingSkeletons.css'

// Reuses the real card structure and classes so the ghost occupies the same box;
// the mobile info block only shows where the real one does (<= 900px).
const ProjectCardSkeleton = () => {
  return (
    <div className="project-card-wrapper" aria-hidden="true">
      <div className="project-card project-card-skeleton">
        <div className="project-preview">
          <div className="project-preview-inner skeleton-ghost" />
        </div>
        <div className="project-info mobile-only-info">
          <div className="skeleton-info-lines">
            <span className="skeleton-ghost" />
            <span className="skeleton-ghost" />
            <span className="skeleton-ghost" />
          </div>
          <div className="skeleton-info-pills">
            <span className="skeleton-ghost" />
            <span className="skeleton-ghost" />
            <span className="skeleton-ghost" />
          </div>
          <div className="project-actions skeleton-info-actions">
            <span className="skeleton-ghost" />
            <span className="skeleton-ghost" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectCardSkeleton
