import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDialog, Button, Chip, InputGroup, Switch } from '@heroui/react'
import { deleteAdminProject, listAdminProjects, moveAdminProject, removeProjectImage, saveAdminProject } from '../../projects/api/projectRepository'
import type { ProjectRecord } from '../../projects/types'
import AdminProjectRowSkeleton from '../components/AdminProjectRowSkeleton'

const AdminProjectsPage = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const load = async (isBackground = false) => {
    if (!isBackground) setIsInitialLoading(true)
    try {
      setProjects(await listAdminProjects())
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load projects.')
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
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update project.')
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
          setError('Project deleted, but its image could not be cleaned up.')
        }
      }
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id))
      setProjectToDelete(null)
      await load(true)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete project.')
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
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : 'Unable to reorder project.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-heading flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="admin-eyebrow">Projects Management</span>
            {!isInitialLoading && (
              <Chip size="sm" variant="soft" color="default" className="text-[11px] font-semibold text-zinc-400">
                {projects.length} Total
              </Chip>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">Portfolio Projects</h1>
        </div>

        <Button
          type="button"
          variant="primary"
          className="admin-button font-bold text-xs cursor-pointer px-4 shadow-md"
          onClick={() => navigate('/admin/projects/new', { state: { techSuggestions } })}
        >
          <span className="mr-1 text-sm leading-none">+</span> New Project
        </Button>
      </div>

      {projects.length > 0 && (
        <div className="mb-6 max-w-md">
          <InputGroup className="w-full border border-zinc-700/80 bg-[#181820] focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/25 rounded-xl transition-all shadow-sm">
            <InputGroup.Prefix className="text-zinc-400 pl-3.5">
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
              placeholder="Search projects, tech, or tags…"
              className="text-xs bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
            />
            {searchQuery && (
              <InputGroup.Suffix className="pr-2.5 flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  {filteredProjects.length} found
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-all cursor-pointer focus:outline-none"
                  aria-label="Clear project search"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </InputGroup.Suffix>
            )}
          </InputGroup>
        </div>
      )}

      {error && (
        <div className="mb-6">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content className="flex-1 flex items-center justify-between gap-3">
              <div>
                <Alert.Title className="text-xs font-bold">Error</Alert.Title>
                <Alert.Description className="text-xs">{error}</Alert.Description>
              </div>
              <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={() => void load()}>
                Retry
              </Button>
            </Alert.Content>
          </Alert>
        </div>
      )}

      {isInitialLoading ? (
        <div className="admin-project-list flex flex-col gap-3">
          <AdminProjectRowSkeleton />
          <AdminProjectRowSkeleton />
          <AdminProjectRowSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <div className="admin-empty border border-dashed border-zinc-800 bg-zinc-900/40 p-12 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-white m-0">No projects yet</h3>
          <p className="text-xs text-zinc-400 m-0 max-w-sm">Create your first portfolio project to showcase your work, technology stack, and live demos.</p>
          <Button
            type="button"
            variant="primary"
            className="admin-button text-xs font-bold cursor-pointer mt-2"
            onClick={() => navigate('/admin/projects/new', { state: { techSuggestions } })}
          >
            Create first project
          </Button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="admin-empty border border-dashed border-zinc-800 bg-zinc-900/30 p-10 rounded-2xl text-center text-zinc-400 text-sm">
          No projects match “{searchQuery}”.
        </div>
      ) : (
        <div className="admin-project-list flex flex-col gap-3" aria-busy={busyId !== null}>
          {filteredProjects.map((project, index) => (
            <article
              className="admin-project-row border border-zinc-800 bg-[#16161b] hover:border-zinc-700/80 transition-all rounded-xl p-4 grid items-center gap-4"
              key={project.id}
            >
              {project.image_url ? (
                <img
                  src={project.image_url}
                  alt=""
                  className="w-full sm:w-36 aspect-video rounded-lg object-cover bg-zinc-800 shrink-0"
                />
              ) : (
                <div
                  className="admin-project-image-fallback w-full sm:w-36 aspect-video rounded-lg shrink-0 flex items-center justify-center text-zinc-500 text-xs font-mono"
                  style={{ background: project.fallback_gradient ?? undefined }}
                >
                  No cover
                </div>
              )}

              <div className="admin-project-meta flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-bold text-white m-0 truncate">{project.title}</h2>
                  {project.is_in_progress && (
                    <Chip size="sm" variant="soft" color="warning" className="text-[10px] font-semibold">
                      In progress
                    </Chip>
                  )}
                </div>
                <p className="text-xs text-zinc-400 m-0 mb-3 truncate">
                  {project.tech.join(' · ') || 'No technologies listed'}
                </p>

                {/* HeroUI Switch for instant Live/Hidden visibility toggle */}
                <div className="flex items-center gap-2">
                  <Switch
                    isSelected={project.is_visible}
                    onChange={() => void updateVisibility(project)}
                    isDisabled={busyId === project.id}
                    size="sm"
                    aria-label={`Toggle visibility for ${project.title}`}
                  >
                    <Switch.Content className="flex items-center gap-2 cursor-pointer">
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <span className={`text-xs font-semibold ${project.is_visible ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {project.is_visible ? 'Live on Site' : 'Hidden from Site'}
                      </span>
                    </Switch.Content>
                  </Switch>
                </div>
              </div>

              <div className="admin-row-actions flex flex-wrap items-center gap-1.5 justify-end">
                {/* Reordering Controls */}
                <Button
                  type="button"
                  size="sm"
                  isIconOnly
                  variant="outline"
                  className="w-8 h-8 text-xs cursor-pointer border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 hover:text-white text-zinc-300 rounded-lg transition-all"
                  isDisabled={busyId === project.id || index === 0}
                  onClick={() => void move(project, 'up')}
                  aria-label="Move project up"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  size="sm"
                  isIconOnly
                  variant="outline"
                  className="w-8 h-8 text-xs cursor-pointer border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 hover:text-white text-zinc-300 rounded-lg transition-all"
                  isDisabled={busyId === project.id || index === filteredProjects.length - 1}
                  onClick={() => void move(project, 'down')}
                  aria-label="Move project down"
                >
                  ↓
                </Button>

                {/* Edit Action */}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs font-semibold cursor-pointer px-3.5 border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 hover:text-white text-zinc-200 rounded-lg transition-all"
                  isDisabled={busyId === project.id}
                  onClick={() => navigate(`/admin/projects/${project.id}/edit`, { state: { techSuggestions } })}
                >
                  Edit
                </Button>

                {/* Delete Action with HeroUI AlertDialog trigger */}
                <Button
                  type="button"
                  size="sm"
                  variant="danger-soft"
                  className="text-xs font-semibold cursor-pointer px-3.5 border border-rose-900/60 bg-rose-950/30 text-rose-400 hover:bg-rose-900/50 hover:text-rose-200 hover:border-rose-600 rounded-lg transition-all"
                  isDisabled={busyId === project.id}
                  onClick={() => setProjectToDelete(project)}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* HeroUI AlertDialog for Destructive Delete Confirmation */}
      {projectToDelete && (
        <AlertDialog.Root isOpen={projectToDelete !== null} onOpenChange={(open) => !open && setProjectToDelete(null)}>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4" />
          <AlertDialog.Container className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <AlertDialog.Dialog className="border border-zinc-800 bg-[#16161c] rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
              <AlertDialog.Header className="flex items-center gap-3">
                <AlertDialog.Icon status="danger" className="w-10 h-10 rounded-full bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0" />
                <div>
                  <AlertDialog.Heading className="text-base font-bold text-white m-0">Delete Project</AlertDialog.Heading>
                  <p className="text-xs text-zinc-400 m-0">This action cannot be undone.</p>
                </div>
              </AlertDialog.Header>

              <AlertDialog.Body className="text-sm text-zinc-300 leading-relaxed m-0">
                Are you sure you want to permanently delete <strong className="text-white font-semibold">“{projectToDelete.title}”</strong>?
                {projectToDelete.image_storage_path && ' Its cover image will also be removed from storage.'}
              </AlertDialog.Body>

              <AlertDialog.Footer className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs cursor-pointer px-4 border-zinc-700"
                  isDisabled={isDeleting}
                  onClick={() => setProjectToDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  className="text-xs font-semibold cursor-pointer px-4"
                  isDisabled={isDeleting}
                  onClick={() => void confirmDelete()}
                >
                  {isDeleting ? 'Deleting…' : 'Yes, delete project'}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Root>
      )}
    </section>
  )
}

export default AdminProjectsPage
