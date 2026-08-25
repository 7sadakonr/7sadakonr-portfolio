import './ProjectLoadingSkeletons.css'

const ProjectCardSkeleton = () => {
  return (
    <div className="project-card-wrapper" aria-hidden="true">
      <div className="project-card project-card-skeleton">
        <div className="project-preview skeleton-item">
          <div className="project-preview-inner" />
        </div>
        <div className="project-info mobile-only-info">
          <div className="skeleton-desc-line skeleton-item" />
          <div className="skeleton-desc-line short skeleton-item" />
          <div className="skeleton-desc-line shorter skeleton-item" />
          
          <div className="skeleton-tech-badges">
            <div className="skeleton-badge skeleton-item" />
            <div className="skeleton-badge skeleton-item" />
            <div className="skeleton-badge skeleton-item" />
          </div>
          
          <div className="skeleton-actions">
            <div className="skeleton-button skeleton-item" />
            <div className="skeleton-button skeleton-item" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectCardSkeleton
