import './ProjectLoadingSkeletons.css'

const ProjectSidebarSkeleton = () => {
  return (
    <div className="project-sidebar-skeleton" aria-hidden="true">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton-sidebar-item">
          <div className="skeleton-sidebar-text skeleton-item" />
          <div className="skeleton-sidebar-marker skeleton-item" />
        </div>
      ))}
    </div>
  )
}

export default ProjectSidebarSkeleton
