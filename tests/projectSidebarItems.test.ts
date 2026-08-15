import { describe, expect, it } from 'vitest'
import { PROJECTS } from '../src/features/projects/data/projects'
import { createProjectSidebarItems } from '../src/features/projects/data/projectSidebarItems'

describe('createProjectSidebarItems', () => {
  it('preserves every sidebar field from the project source data', () => {
    expect(createProjectSidebarItems(PROJECTS)).toEqual(
      PROJECTS.map(({ title, description, tech, liveUrl, githubUrl }) => ({
        label: title,
        description,
        tech,
        liveUrl,
        githubUrl,
      })),
    )
  })
})
