import type { ProjectItem as LegacyProjectItem } from './projects'
import {
  DEFAULT_PROJECT_GRADIENT,
  type ProjectRecord,
  type PublicProjectItem,
} from '../types'

export const mapProjectRecord = (record: ProjectRecord): PublicProjectItem => ({
  id: record.id,
  title: record.title,
  description: record.description,
  tech: record.tech,
  image: record.image_url,
  liveUrl: record.live_url,
  githubUrl: record.github_url,
  gradient: record.fallback_gradient ?? DEFAULT_PROJECT_GRADIENT,
  isInProgress: record.is_in_progress,
  isVisible: record.is_visible,
  sortOrder: record.sort_order,
})

export const mapLegacyProjects = (projects: readonly LegacyProjectItem[]): PublicProjectItem[] =>
  projects.map((project, sortOrder) => ({
    id: `legacy-${project.id}`,
    title: project.title,
    description: project.description,
    tech: project.tech,
    image: project.image,
    liveUrl: project.liveUrl || null,
    githubUrl: project.githubUrl || null,
    gradient: project.gradient ?? DEFAULT_PROJECT_GRADIENT,
    isInProgress: false,
    isVisible: true,
    sortOrder,
  }))
