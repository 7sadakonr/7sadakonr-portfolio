import { describe, expect, it } from 'vitest'
import { getNavigationTarget, getRouteForSection } from '../src/features/navigation/navigation.config'

describe('navigation config', () => {
  it('maps every top-level route to its landing target', () => {
    expect(getNavigationTarget('/')).toMatchObject({ targetId: 'home' })
    expect(getNavigationTarget('/about')).toMatchObject({ targetId: 'about' })
    expect(getNavigationTarget('/project')).toMatchObject({ targetId: 'projects' })
    expect(getNavigationTarget('/contact')).toMatchObject({ targetId: 'contact' })
  })

  it('maps observed section ids to routes', () => {
    expect(getRouteForSection('skills')).toBe('/about')
    expect(getRouteForSection('projects')).toBe('/project')
    expect(getRouteForSection('contact')).toBe('/contact')
  })
})
