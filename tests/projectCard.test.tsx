import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProjectCard from '../src/features/projects/components/ProjectCard'

describe('ProjectCard', () => {
  it('shows an image mockup for projects without an uploaded image', () => {
    render(
      <ProjectCard
        project={{
          id: 'project-no-image', title: 'Nyeta', description: 'Gradient fallback', tech: [], image: null,
          liveUrl: null, githubUrl: null, isInProgress: false, isVisible: true, sortOrder: 0,
        }}
        index={0}
        projectRef={() => undefined}
        onMouseProjectEnter={() => undefined}
      />,
    )

    expect(screen.getByLabelText('Nyeta project preview')).toBeTruthy()
  })

  it('shows the in-progress badge only for projects currently in development', () => {
    const { rerender } = render(
      <ProjectCard
        project={{
          id: 'project-1', title: 'Build', description: 'In development', tech: [], image: null,
          liveUrl: null, githubUrl: null, isInProgress: true, isVisible: true, sortOrder: 0,
        }}
        index={0}
        projectRef={() => undefined}
        onMouseProjectEnter={() => undefined}
      />,
    )

    expect(screen.getByText('In Progress')).toBeTruthy()

    rerender(
      <ProjectCard
        project={{
          id: 'project-1', title: 'Build', description: 'Complete', tech: [], image: null,
          liveUrl: null, githubUrl: null, isInProgress: false, isVisible: true, sortOrder: 0,
        }}
        index={0}
        projectRef={() => undefined}
        onMouseProjectEnter={() => undefined}
      />,
    )

    expect(screen.queryByText('In Progress')).toBeNull()
  })
})
