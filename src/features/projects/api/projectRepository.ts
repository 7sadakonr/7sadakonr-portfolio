import { supabase } from '../../../lib/supabase'
import { PROJECTS } from '../data/projects'
import { mapLegacyProjects, mapProjectRecord } from '../data/projectMapper'
import { setProjectCatalog } from '../data/projectCatalogStore'
import type { ProjectDraft, ProjectRecord, PublicProjectItem } from '../types'
import { createUuid } from '../../../utils/createUuid'

type ProjectDataMode = 'local' | 'supabase-fallback' | 'supabase'

const isStringOrNull = (value: unknown): value is string | null => typeof value === 'string' || value === null

const isProjectRecord = (value: unknown): value is ProjectRecord => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.id === 'string'
    && typeof record.title === 'string'
    && typeof record.description === 'string'
    && isStringOrNull(record.image_url)
    && isStringOrNull(record.image_storage_path)
    && isStringOrNull(record.live_url)
    && isStringOrNull(record.github_url)
    && Array.isArray(record.tech)
    && record.tech.every((technology) => typeof technology === 'string')
    && typeof record.is_in_progress === 'boolean'
    && typeof record.is_visible === 'boolean'
    && typeof record.sort_order === 'number'
    && isStringOrNull(record.fallback_gradient)
    && (typeof record.legacy_source_id === 'number' || record.legacy_source_id === null)
    && typeof record.created_at === 'string'
    && typeof record.updated_at === 'string'
}

export const normalizeProjectRecords = (records: unknown[]): PublicProjectItem[] => {
  if (!records.every(isProjectRecord)) throw new Error('Invalid project data')

  return records
    .map(mapProjectRecord)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
}

const getDataMode = (): ProjectDataMode => {
  const mode = import.meta.env.VITE_PROJECTS_DATA_MODE
  return mode === 'supabase' || mode === 'supabase-fallback' ? mode : 'local'
}

export const isProjectMigrationFallbackMode = () => getDataMode() === 'supabase-fallback'

const assertAdminWritesEnabled = () => {
  if (isProjectMigrationFallbackMode()) throw new Error('Project editing is disabled while migration fallback is active.')
}

const hasLegacyParity = (projects: PublicProjectItem[]) => {
  const legacyProjects = mapLegacyProjects(PROJECTS)
  return projects.length === legacyProjects.length
    && projects.every((project, index) => {
      const legacy = legacyProjects[index]
      return legacy
        && project.title === legacy.title
        && project.description === legacy.description
        && project.sortOrder === legacy.sortOrder
        && project.liveUrl === legacy.liveUrl
        && project.githubUrl === legacy.githubUrl
        && project.tech.join('\u0000') === legacy.tech.join('\u0000')
        && project.isVisible
        && !project.isInProgress
        && (legacy.image ? Boolean(project.image) : project.gradient === legacy.gradient)
    })
}

let publicProjectsPromise: Promise<PublicProjectItem[]> | null = null

export const invalidatePublicProjects = () => {
  publicProjectsPromise = null
  setProjectCatalog(null)
}

export const loadPublicProjects = () => {
  if (publicProjectsPromise) return publicProjectsPromise

  publicProjectsPromise = (async () => {
    const mode = getDataMode()
    if (mode === 'local') return mapLegacyProjects(PROJECTS)
    if (!supabase) {
      if (mode === 'supabase-fallback') return mapLegacyProjects(PROJECTS)
      throw new Error('Supabase is not configured')
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true })

      if (error) throw error
      const projects = normalizeProjectRecords(data ?? [])
      if (mode === 'supabase-fallback' && !hasLegacyParity(projects)) return mapLegacyProjects(PROJECTS)
      return projects
    } catch (error) {
      if (mode === 'supabase-fallback') return mapLegacyProjects(PROJECTS)
      throw error
    }
  })()

  return publicProjectsPromise.then(
    (projects) => {
      setProjectCatalog(projects)
      return projects
    },
    (error: unknown) => {
      publicProjectsPromise = null
      throw error
    },
  )
}

export const listAdminProjects = async (): Promise<ProjectRecord[]> => {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw error
  if (!(data ?? []).every(isProjectRecord)) throw new Error('Invalid project data')
  return data as ProjectRecord[]
}

export const getAdminProject = async (id: string): Promise<ProjectRecord | null> => {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (data === null) return null
  if (!isProjectRecord(data)) throw new Error('Invalid project data')
  return data
}

export const deleteAdminProject = async (id: string) => {
  if (!supabase) throw new Error('Supabase is not configured')
  assertAdminWritesEnabled()
  const { data, error } = await supabase.from('projects').delete().eq('id', id).select('id')
  if (error) throw error
  if (data.length !== 1) throw new Error('Project was not deleted.')
  invalidatePublicProjects()
}

export const moveAdminProject = async (id: string, direction: 'up' | 'down') => {
  if (!supabase) throw new Error('Supabase is not configured')
  assertAdminWritesEnabled()
  const { error } = await supabase.rpc('move_project', { p_project_id: id, p_direction: direction })
  if (error) throw error
  invalidatePublicProjects()
}

const fileExtensionByMime: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export const validateProjectImage = async (file: File) => {
  if (!(file.type in fileExtensionByMime)) throw new Error('Use a JPG, PNG, or WebP image.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be 5 MB or smaller.')

  const objectUrl = URL.createObjectURL(file)
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Choose a valid image file.'))
      image.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export const uploadProjectImage = async (projectId: string, file: File) => {
  if (!supabase) throw new Error('Supabase is not configured')
  assertAdminWritesEnabled()
  await validateProjectImage(file)
  const extension = fileExtensionByMime[file.type]
  if (!extension) throw new Error('Use a JPG, PNG, or WebP image.')
  const path = `projects/${projectId}/${createUuid()}.${extension}`
  const { error } = await supabase.storage.from('project-images').upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('project-images').getPublicUrl(path)
  return { path, url: data.publicUrl }
}

export const removeProjectImage = async (path: string) => {
  if (!supabase) throw new Error('Supabase is not configured')
  assertAdminWritesEnabled()
  const { error } = await supabase.storage.from('project-images').remove([path])
  if (error) throw error
}

export const saveAdminProject = async (draft: ProjectDraft) => {
  if (!supabase) throw new Error('Supabase is not configured')
  assertAdminWritesEnabled()
  const { data, error } = await supabase.from('projects').upsert({
    id: draft.id,
    title: draft.title.trim(),
    description: draft.description.trim(),
    image_url: draft.imageUrl,
    image_storage_path: draft.imageStoragePath,
    live_url: draft.liveUrl.trim() || null,
    github_url: draft.githubUrl.trim() || null,
    tech: draft.tech,
    is_in_progress: draft.isInProgress,
    is_visible: draft.isVisible,
    sort_order: draft.sortOrder,
    fallback_gradient: draft.fallbackGradient,
  }).select('id')
  if (error) throw error
  if (data.length !== 1) throw new Error('Project was not saved.')
  invalidatePublicProjects()
}
