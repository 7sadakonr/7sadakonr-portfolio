import type { PublicProjectItem } from '../types'

export interface ProjectSidebarItem {
  label: string
  description: string
  tech: string[]
  liveUrl?: string
  githubUrl?: string
}

export const createProjectSidebarItems = (
  projects: readonly PublicProjectItem[],
): ProjectSidebarItem[] =>
  projects.map(({ title, description, tech, liveUrl, githubUrl }) => ({
    label: title,
    description,
    tech: [...tech],
    liveUrl: liveUrl ?? undefined,
    githubUrl: githubUrl ?? undefined,
  }))
