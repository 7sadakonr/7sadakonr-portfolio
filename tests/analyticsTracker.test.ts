import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  trackEvent,
  initAnalytics,
  isAdminOptOut,
  setAdminOptOut,
  _resetAnalyticsForTesting,
} from '../src/lib/analytics/tracker'

describe('Privacy-First Analytics Tracker', () => {
  beforeEach(() => {
    localStorage.clear()
    _resetAnalyticsForTesting()
    vi.restoreAllMocks()
  })

  it('proves no persistent visitor_id is created in localStorage on init', () => {
    initAnalytics()
    expect(localStorage.getItem('portfolio_visitor_id')).toBeNull()
  })

  it('proves no session metadata or session_id is created in localStorage on init', () => {
    initAnalytics()
    expect(localStorage.getItem('portfolio_session_meta')).toBeNull()
  })

  it('purges legacy visitor_id and session_meta from localStorage if present', () => {
    localStorage.setItem('portfolio_visitor_id', 'old-visitor-uuid')
    localStorage.setItem('portfolio_session_meta', JSON.stringify({ sessionId: 'old-session' }))

    initAnalytics()

    expect(localStorage.getItem('portfolio_visitor_id')).toBeNull()
    expect(localStorage.getItem('portfolio_session_meta')).toBeNull()
  })

  it('proves no analytics identifier is stored in localStorage after tracking events', () => {
    initAnalytics()
    trackEvent('page_view', { page: '/' })
    trackEvent('project_open', { project_slug: 'test-project' })
    trackEvent('resume_download')

    // localStorage must not contain any analytics identifiers
    const allKeys = Object.keys(localStorage)
    expect(allKeys.filter((k) => k !== 'portfolio_admin_opt_out')).toHaveLength(0)
  })

  it('accepts only allowed aggregate events and rejects removed event types', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    global.fetch = fetchMock

    // Disallowed tracking events must be ignored
    trackEvent('section_view', { section: 'hero' })
    trackEvent('scroll_depth', { depth: 50 } as any)
    trackEvent('heartbeat')
    trackEvent('contact_click', { target_label: 'Contact' } as any)
    trackEvent('email_click', { target_label: 'Email' } as any)
    trackEvent('navbar_click', { target_label: 'Nav' } as any)
    trackEvent('project_demo_click', { project_slug: 'demo' } as any)
    trackEvent('project_github_click', { project_slug: 'gh' } as any)

    // Allowed event
    trackEvent('project_open', { project_slug: 'my-project' })

    expect(fetchMock).toHaveBeenCalled()
    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(callBody.events).toHaveLength(1)
    expect(callBody.events[0].event_name).toBe('project_open')
    expect(callBody.events[0].project_slug).toBe('my-project')
    expect(callBody.events[0].visitor_id).toBeUndefined()
    expect(callBody.events[0].session_id).toBeUndefined()
    expect(callBody.visitor_id).toBeUndefined()
    expect(callBody.session_id).toBeUndefined()
  })

  it('sends privacy-safe payload for resume downloads without identifiers', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    global.fetch = fetchMock

    trackEvent('resume_download')

    expect(fetchMock).toHaveBeenCalled()
    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(callBody.events[0].event_name).toBe('resume_download')
    expect(callBody.events[0].visitor_id).toBeUndefined()
    expect(callBody.events[0].session_id).toBeUndefined()
  })

  it('tracks events safely without throwing errors even if fetch fails', () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network offline'))
    global.fetch = fetchMock

    expect(() => {
      trackEvent('project_open', {
        project_slug: 'nyeta',
      })
    }).not.toThrow()
  })

  it('opts out admin when setAdminOptOut(true) is called without using visitor identifiers', () => {
    initAnalytics()
    setAdminOptOut(true)
    expect(isAdminOptOut()).toBe(true)
    expect(localStorage.getItem('portfolio_admin_opt_out')).toBe('true')
    expect(localStorage.getItem('portfolio_visitor_id')).toBeNull()

    const fetchMock = vi.fn()
    global.fetch = fetchMock

    trackEvent('page_view', { page: '/' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('opts out automatically when visiting /admin routes', () => {
    window.history.pushState({}, '', '/admin/analytics')

    expect(isAdminOptOut()).toBe(true)

    const fetchMock = vi.fn()
    global.fetch = fetchMock
    trackEvent('project_open', { project_slug: 'test' })
    expect(fetchMock).not.toHaveBeenCalled()

    window.history.pushState({}, '', '/')
  })
})
