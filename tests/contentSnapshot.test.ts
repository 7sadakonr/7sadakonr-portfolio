import { describe, expect, it } from 'vitest'
import { parseSnapshotProjects, parseSnapshotSiteSettings } from '../src/features/content/contentSnapshot'
import snapshot from '../src/features/content/contentSnapshot.json'

describe('content snapshot', () => {
  it('returns null for empty or missing data', () => {
    expect(parseSnapshotProjects({ projects: [] })).toBeNull()
    expect(parseSnapshotProjects({})).toBeNull()
    expect(parseSnapshotSiteSettings({ siteSettings: null })).toBeNull()
  })

  it('returns null instead of throwing for invalid rows', () => {
    expect(parseSnapshotProjects({ projects: [{ id: 1 }] })).toBeNull()
    expect(parseSnapshotSiteSettings({ siteSettings: { id: 2 } })).toBeNull()
  })

  it('maps the committed snapshot into public data', () => {
    const projects = parseSnapshotProjects(snapshot as never)
    expect(projects?.length).toBeGreaterThan(0)
    expect(parseSnapshotSiteSettings(snapshot as never)?.id).toBe(1)
  })
})
