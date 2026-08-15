import type { ProjectItem } from './projects'

export interface ProjectSidebarItem {
  label: string
  description: string
  tech: string[]
  liveUrl: string
  githubUrl: string
}

export const createProjectSidebarItems = (
  projects: readonly ProjectItem[],
): ProjectSidebarItem[] =>
  projects.map(({ title, description, tech, liveUrl, githubUrl }) => ({
    label: title,
    description,
    tech: [...tech],
    liveUrl,
    githubUrl,
  }))
