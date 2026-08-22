import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAdminProject, listAdminProjects, moveAdminProject, removeProjectImage, saveAdminProject } from '../../projects/api/projectRepository'
import type { ProjectRecord } from '../../projects/types'

const AdminProjectsPage = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const load = async () => {
    setIsLoading(true)
    try { setProjects(await listAdminProjects()); setError(null) } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load projects.') } finally { setIsLoading(false) }
  }
  useEffect(() => { void load() }, [])
  const techSuggestions = useMemo(() => [...new Set(projects.flatMap((project) => project.tech))], [projects])
  const updateVisibility = async (project: ProjectRecord) => {
    setBusyId(project.id)
    try {
      await saveAdminProject({
        id: project.id, title: project.title, description: project.description, imageUrl: project.image_url,
        imageStoragePath: project.image_storage_path, liveUrl: project.live_url ?? '', githubUrl: project.github_url ?? '',
        tech: project.tech, isInProgress: project.is_in_progress, isVisible: !project.is_visible,
        sortOrder: project.sort_order, fallbackGradient: project.fallback_gradient,
      })
      await load()
    } catch (updateError) { setError(updateError instanceof Error ? updateError.message : 'Unable to update project.') } finally { setBusyId(null) }
  }
  const deleteProject = async (project: ProjectRecord) => {
    if (!window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return
    setBusyId(project.id)
    try {
      await deleteAdminProject(project.id)
      if (project.image_storage_path) {
        try { await removeProjectImage(project.image_storage_path) } catch { setError('Project deleted, but its image could not be cleaned up.') }
      }
      await load()
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete project.') } finally { setBusyId(null) }
  }
  const move = async (project: ProjectRecord, direction: 'up' | 'down') => {
    setBusyId(project.id)
    try { await moveAdminProject(project.id, direction); await load() } catch (moveError) { setError(moveError instanceof Error ? moveError.message : 'Unable to reorder project.') } finally { setBusyId(null) }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-heading"><div><p className="admin-eyebrow">Projects</p><h1>Manage work</h1></div><button className="admin-button" type="button" onClick={() => navigate('/admin/projects/new', { state: { techSuggestions } })}>New project</button></div>
      {error && <p className="admin-form-error" role="alert">{error}</p>}
      {isLoading ? <p className="admin-empty">Loading projects…</p> : projects.length === 0 ? <p className="admin-empty">No projects yet. Create the first one.</p> : (
        <div className="admin-project-list">
          {projects.map((project, index) => <article className="admin-project-row" key={project.id}>
            {project.image_url ? <img src={project.image_url} alt="" /> : <div className="admin-project-image-fallback" style={{ background: project.fallback_gradient ?? undefined }} />}
            <div className="admin-project-meta"><h2>{project.title}</h2><p>{project.tech.join(' · ') || 'No technologies listed'}</p><div className="admin-statuses">{project.is_visible ? <span>Visible</span> : <span>Hidden</span>}{project.is_in_progress && <span>In progress</span>}</div></div>
            <div className="admin-row-actions">
              <button type="button" disabled={busyId === project.id || index === 0} onClick={() => void move(project, 'up')}>↑</button>
              <button type="button" disabled={busyId === project.id || index === projects.length - 1} onClick={() => void move(project, 'down')}>↓</button>
              <button type="button" disabled={busyId === project.id} onClick={() => navigate(`/admin/projects/${project.id}/edit`, { state: { techSuggestions } })}>Edit</button>
              <button type="button" disabled={busyId === project.id} onClick={() => void updateVisibility(project)}>{project.is_visible ? 'Hide' : 'Show'}</button>
              <button type="button" className="admin-delete" disabled={busyId === project.id} onClick={() => void deleteProject(project)}>Delete</button>
            </div>
          </article>)}
        </div>
      )}
    </section>
  )
}

export default AdminProjectsPage
