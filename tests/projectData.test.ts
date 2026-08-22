import { describe, expect, it } from 'vitest'
import { mapProjectRecord, mapLegacyProjects } from '../src/features/projects/data/projectMapper'
import { validateProjectUrls } from '../src/features/projects/validation/projectValidation'
import { PROJECTS } from '../src/features/projects/data/projects'

describe('project data mapping', () => {
  it('maps a visible Supabase record into the existing card shape', () => {
    const project = mapProjectRecord({
      id: 'b2501436-d790-4e34-bca0-1e083930a68e',
      title: 'Example',
      description: 'A project from Supabase.',
      image_url: 'https://example.supabase.co/storage/v1/object/public/project-images/projects/example.webp',
      image_storage_path: 'projects/example/example.webp',
      live_url: null,
      github_url: 'https://github.com/example/project',
      tech: ['React', 'TypeScript'],
      is_in_progress: true,
      is_visible: true,
      sort_order: 3,
      fallback_gradient: null,
      legacy_source_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    })

    expect(project).toMatchObject({
      id: 'b2501436-d790-4e34-bca0-1e083930a68e',
      image: 'https://example.supabase.co/storage/v1/object/public/project-images/projects/example.webp',
      liveUrl: null,
      githubUrl: 'https://github.com/example/project',
      isInProgress: true,
      isVisible: true,
      sortOrder: 3,
    })
    expect(project.gradient).toBe('linear-gradient(135deg, #7c3aed 0%, #db2777 100%)')
  })

  it('keeps every legacy project visible, ordered, and not in progress', () => {
    const projects = mapLegacyProjects(PROJECTS)

    expect(projects).toHaveLength(PROJECTS.length)
    expect(projects.map((project) => project.title)).toEqual(PROJECTS.map((project) => project.title))
    expect(projects.map((project) => project.sortOrder)).toEqual(PROJECTS.map((_, index) => index))
    expect(projects.every((project) => project.isVisible && !project.isInProgress)).toBe(true)
    expect(projects.at(-1)?.gradient).toBe('linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)')
  })
})

describe('project URL validation', () => {
  it('accepts empty optional URLs and HTTPS URLs', () => {
    expect(validateProjectUrls('', 'https://github.com/7sadakonr/7sadakonr-portfolio')).toEqual({})
  })

  it('rejects a non-HTTP protocol before it reaches a project link', () => {
    expect(validateProjectUrls('javascript:alert(1)', '')).toEqual({
      liveUrl: 'Use a valid http:// or https:// URL.',
    })
  })
})
