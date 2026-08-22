import { describe, expect, it } from 'vitest'
import { normalizeProjectRecords } from '../src/features/projects/api/projectRepository'

describe('normalizeProjectRecords', () => {
  it('sorts records by sort order and rejects malformed database rows', () => {
    const projects = normalizeProjectRecords([
      {
        id: '2', title: 'Second', description: 'Second project', image_url: null, image_storage_path: null,
        live_url: null, github_url: null, tech: [], is_in_progress: false, is_visible: true,
        sort_order: 2, fallback_gradient: null, legacy_source_id: null,
        created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: '1', title: 'First', description: 'First project', image_url: null, image_storage_path: null,
        live_url: null, github_url: null, tech: [], is_in_progress: false, is_visible: true,
        sort_order: 1, fallback_gradient: null, legacy_source_id: null,
        created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
      },
    ])

    expect(projects.map((project) => project.title)).toEqual(['First', 'Second'])
    expect(() => normalizeProjectRecords([{ id: 'broken' }])).toThrow('Invalid project data')
  })
})
