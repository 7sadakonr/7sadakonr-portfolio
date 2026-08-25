import '../../projects/components/ProjectLoadingSkeletons.css'

const AdminProjectRowSkeleton = () => {
  return (
    <div className="admin-project-row-skeleton" aria-hidden="true">
      <div className="skeleton-thumbnail skeleton-item" />
      <div className="skeleton-content">
        <div className="skeleton-title skeleton-item" />
        <div className="skeleton-tech skeleton-item" />
      </div>
      <div className="skeleton-actions">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton-btn skeleton-item" />
        ))}
      </div>
    </div>
  )
}

export default AdminProjectRowSkeleton
