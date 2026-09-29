import { describe, expect, it } from 'vitest'
import { getNavigationTarget, getRouteForSection } from '../src/features/navigation/navigation.config'
import type { LandingPath } from '../src/features/navigation/navigation.types'

describe('Privacy Policy Navigation', () => {
  it('maps /privacy correctly in navigation configuration', () => {
    const target = getNavigationTarget('/privacy')
    expect(target).toEqual({ path: '/privacy', targetId: 'privacy' })
  })

  it('resolves route for privacy section ID', () => {
    expect(getRouteForSection('privacy')).toBe('/privacy')
  })

  it('accepts /privacy as a valid LandingPath', () => {
    const path: LandingPath = '/privacy'
    expect(path).toBe('/privacy')
  })
})
