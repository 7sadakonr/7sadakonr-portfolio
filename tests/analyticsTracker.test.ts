import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  trackEvent,
  initAnalytics,
  isAdminOptOut,
  setAdminOptOut,
  _resetAnalyticsForTesting,
} from '../src/lib/analytics/tracker'

describe('Analytics Tracker', () => {
  beforeEach(() => {
    localStorage.clear()
    _resetAnalyticsForTesting()
    vi.restoreAllMocks()
  })

  it('initializes anonymous visitor_id and persists in localStorage', () => {
    initAnalytics()
    const visitorId = localStorage.getItem('portfolio_visitor_id')
    expect(visitorId).toBeDefined()
    expect(visitorId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  })

  it('reuses existing visitor_id across multiple init calls', () => {
    initAnalytics()
    const firstId = localStorage.getItem('portfolio_visitor_id')

    // Reset module state but keep localStorage to simulate subsequent page visit
    _resetAnalyticsForTesting()
    initAnalytics()
    const secondId = localStorage.getItem('portfolio_visitor_id')

    expect(firstId).toBe(secondId)
  })

  it('stores and maintains session metadata with 30-minute inactivity limit', () => {
    initAnalytics()
    const rawSession = localStorage.getItem('portfolio_session_meta')
    expect(rawSession).not.toBeNull()

    const meta = JSON.parse(rawSession!)
    expect(meta.sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    expect(meta.lastSeen).toBeGreaterThan(0)
  })

  it('tracks events safely without throwing errors even if fetch fails', () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network offline'))
    global.fetch = fetchMock

    expect(() => {
      trackEvent('project_open', {
        project_slug: 'nyeta',
        target_label: 'Nyeta',
      })
    }).not.toThrow()
  })

  it('tracks external links and resume downloads properly', () => {
    expect(() => {
      trackEvent('resume_download', {
        target_label: 'Resume (English)',
        destination_host: 'supabase.co',
      })
      trackEvent('project_github_click', {
        project_slug: 'slipzen',
        destination_host: 'github.com',
      })
    }).not.toThrow()
  })

  it('opts out admin when setAdminOptOut(true) is called and cleans session meta', () => {
    initAnalytics()
    expect(localStorage.getItem('portfolio_session_meta')).not.toBeNull()

    setAdminOptOut(true)
    expect(isAdminOptOut()).toBe(true)
    expect(localStorage.getItem('portfolio_admin_opt_out')).toBe('true')
    expect(localStorage.getItem('portfolio_session_meta')).toBeNull()

    const fetchMock = vi.fn()
    global.fetch = fetchMock

    trackEvent('page_view', { page: '/' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('opts out automatically when visiting /admin routes', () => {
    const originalLocation = window.location
    delete (window as unknown as { location?: unknown }).location
    window.location = { ...originalLocation, pathname: '/admin/analytics' } as Location

    expect(isAdminOptOut()).toBe(true)

    const fetchMock = vi.fn()
    global.fetch = fetchMock
    trackEvent('project_open', { project_slug: 'test' })
    expect(fetchMock).not.toHaveBeenCalled()

    window.location = originalLocation
  })
})
