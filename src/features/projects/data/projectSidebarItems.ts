import type { PublicProjectItem } from '../types'

export interface ProjectSidebarItem {
  id: string
  label: string
  description: string
  tech: string[]
  liveUrl?: string
  githubUrl?: string
}

export const createProjectSidebarItems = (
  projects: readonly PublicProjectItem[],
): ProjectSidebarItem[] =>
  projects.map(({ id, title, description, tech, liveUrl, githubUrl }) => ({
    id,
    label: title,
    description,
    tech: [...tech],
    liveUrl: liveUrl ?? undefined,
    githubUrl: githubUrl ?? undefined,
  }))
