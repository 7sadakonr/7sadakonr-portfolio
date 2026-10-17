import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ProjectForm, { type ProjectFormValues } from '../components/ProjectForm'
import { listAdminProjects, removeProjectImage, saveAdminProject, uploadProjectImage } from '../../projects/api/projectRepository'
import { Button } from '@heroui/react'
import PageHeader from '../components/ui/PageHeader'
import PageLoadState from '../components/ui/PageLoadState'
import EmptyState from '../components/ui/EmptyState'
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

  if (isLoading) return <PageLoadState eyebrow="Projects" title="Project" error={null} />
  if (loadError) return <PageLoadState eyebrow="Projects" title="Project" error={loadError} onRetry={() => window.location.reload()} />

  if (notFound) {
    return (
      <section className="admin-page ad-narrow">
        <div className="ad-panel">
          <EmptyState
            title="Project not found"
            description="It may have been deleted."
            action={<Button size="sm" variant="primary" className="admin-button" onClick={() => navigate('/admin/projects')}>Back to projects</Button>}
          />
        </div>
      </section>
    )
  }

  const sortOrder = isNew ? nextSortOrder : project?.sort_order ?? 0

  return (
    <section className="admin-page ad-narrow">
      <PageHeader
        eyebrow="Projects"
        title={isNew ? 'New project' : 'Edit project'}
        description={isNew ? 'Add a project to your portfolio.' : project?.title}
        actions={<Button size="sm" variant="outline" onClick={() => navigate('/admin/projects')}><span aria-hidden="true">←</span> All projects</Button>}
      />
      <ProjectForm
        initialProject={project}
        sortOrder={sortOrder}
        suggestions={suggestions}
        onSave={handleSave}
        onCancel={() => navigate('/admin/projects')}
      />
    </section>
  )
}

export default AdminProjectFormPage
