import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ProjectForm, { type ProjectFormValues } from '../components/ProjectForm'
import { listAdminProjects, removeProjectImage, saveAdminProject, uploadProjectImage } from '../../projects/api/projectRepository'
import { Alert, Button, Skeleton } from '@heroui/react'
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

  if (isLoading) {
    return (
      <section className="admin-page max-w-3xl">
        <div className="admin-page-heading mb-6">
          <span className="admin-eyebrow">Projects</span>
          <h1 className="text-2xl font-bold text-white">Loading project…</h1>
        </div>
        <div className="border border-zinc-800 bg-[#16161b] p-8 rounded-2xl flex flex-col gap-4">
          <Skeleton className="h-6 w-48 rounded-lg bg-zinc-800" />
          <Skeleton className="h-32 w-full rounded-lg bg-zinc-800/60" />
          <Skeleton className="h-10 w-full rounded-lg bg-zinc-800/40" />
        </div>
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="admin-page max-w-3xl">
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content className="flex-1 flex items-center justify-between gap-3">
            <div>
              <Alert.Title className="text-xs font-bold">Failed to load project</Alert.Title>
              <Alert.Description className="text-xs">{loadError}</Alert.Description>
            </div>
            <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </Alert.Content>
        </Alert>
      </section>
    )
  }

  if (notFound) {
    return (
      <section className="admin-page max-w-3xl">
        <div className="admin-empty border border-dashed border-zinc-800 bg-zinc-900/30 p-10 rounded-2xl flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-zinc-400 m-0">Project not found or may have been deleted.</p>
          <Button size="sm" variant="primary" className="admin-button text-xs font-bold" onClick={() => navigate('/admin/projects')}>
            Back to projects
          </Button>
        </div>
      </section>
    )
  }

  const sortOrder = isNew ? nextSortOrder : project?.sort_order ?? 0

  return (
    <section className="admin-page max-w-3xl">
      <div className="admin-page-heading flex items-center justify-between gap-4 mb-6">
        <div>
          <span className="admin-eyebrow mb-1">Projects</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">
            {isNew ? 'New Project' : 'Edit Project'}
          </h1>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="text-xs font-semibold px-3.5 border-zinc-700 hover:bg-zinc-800 hover:text-white"
          onClick={() => navigate('/admin/projects')}
        >
          ← Back to projects
        </Button>
      </div>
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
