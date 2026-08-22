import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ProjectForm, { type ProjectFormValues } from '../components/ProjectForm'
import { listAdminProjects, removeProjectImage, saveAdminProject, uploadProjectImage } from '../../projects/api/projectRepository'
import type { ProjectRecord } from '../../projects/types'

const AdminProjectFormPage = () => {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const location = useLocation()
  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>((location.state as { techSuggestions?: string[] } | null)?.techSuggestions ?? [])
  const [nextSortOrder, setNextSortOrder] = useState(0)
  const [isLoading, setIsLoading] = useState(!isNew)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const all = await listAdminProjects()
        setSuggestions([...new Set(all.flatMap((item) => item.tech))])
        setNextSortOrder(all.reduce((maximum, item) => Math.max(maximum, item.sort_order), -1) + 1)
        if (id) {
          const existing = all.find((item) => item.id === id) ?? null
          setProject(existing)
          setNotFound(existing === null)
        }
      } catch (error) {
        setProject(null)
        setNotFound(false)
        setLoadError(error instanceof Error ? error.message : 'Unable to load project.')
      } finally { setIsLoading(false) }
    }
    void load()
  }, [id])

  const handleSave = async (values: ProjectFormValues) => {
    const oldPath = project?.image_storage_path ?? null
    let uploadedPath: string | null = null
    let imageUrl = values.removeCurrentImage ? null : values.imageUrl
    let imageStoragePath = values.removeCurrentImage ? null : values.imageStoragePath
    try {
      if (values.newImage) {
        const uploaded = await uploadProjectImage(values.id, values.newImage)
        uploadedPath = uploaded.path
        imageUrl = uploaded.url
        imageStoragePath = uploaded.path
      }
      await saveAdminProject({ ...values, imageUrl, imageStoragePath })
    } catch (error) {
      if (uploadedPath) { try { await removeProjectImage(uploadedPath) } catch { /* retained for later cleanup */ } }
      throw error
    }
    if (oldPath && oldPath !== imageStoragePath) {
      try { await removeProjectImage(oldPath) } catch { /* project is saved; orphan cleanup can be retried */ }
    }
    navigate('/admin/projects', { replace: true })
  }

  if (isLoading) return <section className="admin-page"><p className="admin-empty">Loading project…</p></section>
  if (loadError) return <section className="admin-page"><p className="admin-form-error" role="alert">{loadError}</p><button className="admin-button" type="button" onClick={() => window.location.reload()}>Try again</button></section>
  if (notFound) return <section className="admin-page"><p className="admin-empty">Project not found.</p><button className="admin-button" type="button" onClick={() => navigate('/admin/projects')}>Back to projects</button></section>
  const sortOrder = isNew ? nextSortOrder : project?.sort_order ?? 0
  return <section className="admin-page"><div className="admin-page-heading"><div><p className="admin-eyebrow">Projects</p><h1>{isNew ? 'New project' : 'Edit project'}</h1></div></div><ProjectForm initialProject={project} sortOrder={sortOrder} suggestions={suggestions} onSave={handleSave} onCancel={() => navigate('/admin/projects')} /></section>
}

export default AdminProjectFormPage
