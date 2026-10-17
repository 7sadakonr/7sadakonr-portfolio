import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, InputGroup, Switch } from '@heroui/react'
import { deleteAdminProject, listAdminProjects, moveAdminProject, removeProjectImage, saveAdminProject } from '../../projects/api/projectRepository'
import type { ProjectRecord } from '../../projects/types'
import AdminProjectRowSkeleton from '../components/AdminProjectRowSkeleton'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/toastContext'

const AdminProjectsPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const load = async (isBackground = false) => {
    if (!isBackground) setIsInitialLoading(true)
    try {
      setProjects(await listAdminProjects())
      setLoadError(null)
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'Unable to load projects.')
    } finally {
      if (!isBackground) setIsInitialLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const techSuggestions = useMemo(() => [...new Set(projects.flatMap((project) => project.tech))], [projects])

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.tech.some((t) => t.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
    )
  }, [projects, searchQuery])

  const fail = (title: string, reason: unknown, fallback: string) =>
    toast.error(title, reason instanceof Error ? reason.message : fallback)

  const updateVisibility = async (project: ProjectRecord) => {
    setBusyId(project.id)
    try {
      await saveAdminProject({
        id: project.id,
        title: project.title,
        description: project.description,
        imageUrl: project.image_url,
        imageStoragePath: project.image_storage_path,
        liveUrl: project.live_url ?? '',
        githubUrl: project.github_url ?? '',
        tech: project.tech,
        isInProgress: project.is_in_progress,
        isVisible: !project.is_visible,
        sortOrder: project.sort_order,
        fallbackGradient: project.fallback_gradient,
      })
      await load(true)
      toast.success(project.is_visible ? `"${project.title}" hidden` : `"${project.title}" is now visible`, 'Publish to update the live site.')
    } catch (reason) {
      fail("Couldn't update visibility", reason, 'Unable to update project.')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!projectToDelete) return
    setIsDeleting(true)
    setBusyId(projectToDelete.id)
    try {
      await deleteAdminProject(projectToDelete.id)
      if (projectToDelete.image_storage_path) {
        try {
          await removeProjectImage(projectToDelete.image_storage_path)
        } catch {
          toast.info('Project deleted', 'Its cover image could not be removed from storage.')
        }
      }
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id))
      toast.success(`"${projectToDelete.title}" deleted`)
      setProjectToDelete(null)
      await load(true)
    } catch (reason) {
      fail("Couldn't delete project", reason, 'Unable to delete project.')
    } finally {
      setIsDeleting(false)
      setBusyId(null)
    }
  }

  const move = async (project: ProjectRecord, direction: 'up' | 'down') => {
    setBusyId(project.id)
    try {
      await moveAdminProject(project.id, direction)
      await load(true)
    } catch (reason) {
      fail("Couldn't reorder projects", reason, 'Unable to reorder project.')
    } finally {
      setBusyId(null)
    }
  }

  const openNew = () => navigate('/admin/projects/new', { state: { techSuggestions } })
  const isFiltering = searchQuery.trim() !== ''

  return (
    <section className="admin-page">
      <PageHeader
        eyebrow="Projects"
        title="Portfolio projects"
        description={isInitialLoading ? undefined : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}. Order here is the order on the site.`}
        actions={<Button type="button" variant="primary" className="admin-button" onClick={openNew}>New project</Button>}
      />

      {projects.length > 0 && (
        <div className="mb-6 max-w-md">
          <InputGroup className="w-full">
            <InputGroup.Prefix className="pl-3.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </InputGroup.Prefix>
            <InputGroup.Input
              id="admin-projects-search"
              type="search"
              aria-label="Search projects"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by title, tech or description"
            />
            {isFiltering && (
              <InputGroup.Suffix className="pr-2.5 flex items-center gap-2">
                <span className="ad-muted text-xs" role="status">{filteredProjects.length} found</span>
                <button type="button" onClick={() => setSearchQuery('')} className="ad-icon-button" aria-label="Clear project search">
                  <span aria-hidden="true">✕</span>
                </button>
              </InputGroup.Suffix>
            )}
          </InputGroup>
        </div>
      )}

      {isInitialLoading ? (
        <div className="admin-project-list flex flex-col gap-3">
          <AdminProjectRowSkeleton />
          <AdminProjectRowSkeleton />
          <AdminProjectRowSkeleton />
        </div>
      ) : loadError ? (
        <div className="ad-panel">
          <EmptyState title="Couldn't load projects" description={loadError} action={<Button size="sm" variant="outline" onClick={() => void load()}>Try again</Button>} />
        </div>
      ) : projects.length === 0 ? (
        <div className="ad-panel">
          <EmptyState
            title="No projects yet"
            description="Add your first project to show your work, tech stack and live demos."
            action={<Button type="button" variant="primary" className="admin-button" onClick={openNew}>Create first project</Button>}
          />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="ad-panel">
          <EmptyState title={`No projects match "${searchQuery}"`} action={<Button size="sm" variant="outline" onClick={() => setSearchQuery('')}>Clear search</Button>} />
        </div>
      ) : (
        <div className="admin-project-list flex flex-col gap-3" aria-busy={busyId !== null}>
          {filteredProjects.map((project, index) => (
            <article className="admin-project-row" key={project.id}>
              {project.image_url ? (
                <img src={project.image_url} alt="" />
              ) : (
                <div className="admin-project-image-fallback ad-cover-fallback" style={{ background: project.fallback_gradient ?? undefined }}>No cover</div>
              )}

              <div className="admin-project-meta min-w-0">
                <h2 className="ad-row__title" style={{ marginBottom: 4 }}>
                  <span className="ad-truncate">{project.title}</span>
                  {project.is_in_progress && <span className="ad-badge ad-badge--warning">In progress</span>}
                  <span className={`ad-badge${project.is_visible ? ' ad-badge--success' : ''}`}>{project.is_visible ? 'Visible' : 'Hidden'}</span>
                </h2>
                <p className="ad-truncate" title={project.tech.join(', ')}>{project.tech.join(' · ') || 'No technologies listed'}</p>
                <Switch
                  isSelected={project.is_visible}
                  onChange={() => void updateVisibility(project)}
                  isDisabled={busyId === project.id}
                  size="sm"
                  aria-label={`Show ${project.title} on the site`}
                >
                  <Switch.Content className="flex items-center gap-2 cursor-pointer">
                    <Switch.Control><Switch.Thumb /></Switch.Control>
                    <span className="text-xs font-semibold">Show on site</span>
                  </Switch.Content>
                </Switch>
              </div>

              <div className="admin-row-actions justify-end">
                <Button type="button" size="sm" isIconOnly variant="outline" isDisabled={busyId === project.id || isFiltering || index === 0} onClick={() => void move(project, 'up')} aria-label={`Move ${project.title} up`}>
                  <span aria-hidden="true">↑</span>
                </Button>
                <Button type="button" size="sm" isIconOnly variant="outline" isDisabled={busyId === project.id || isFiltering || index === filteredProjects.length - 1} onClick={() => void move(project, 'down')} aria-label={`Move ${project.title} down`}>
                  <span aria-hidden="true">↓</span>
                </Button>
                <Button type="button" size="sm" variant="outline" isDisabled={busyId === project.id} onClick={() => navigate(`/admin/projects/${project.id}/edit`, { state: { techSuggestions } })}>Edit</Button>
                <Button type="button" size="sm" variant="danger-soft" isDisabled={busyId === project.id} onClick={() => setProjectToDelete(project)}>Delete</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={projectToDelete !== null}
        title="Delete this project?"
        description={<>This permanently deletes <strong>“{projectToDelete?.title}”</strong>. This action cannot be undone.{projectToDelete?.image_storage_path && ' Its cover image will also be removed from storage.'}</>}
        confirmLabel="Delete project"
        isBusy={isDeleting}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  )
}

export default AdminProjectsPage
