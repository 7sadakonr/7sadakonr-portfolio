import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const { capturedRpcRef } = vi.hoisted(() => ({
  capturedRpcRef: { current: null as { name: string; params: any } | null },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: (name: string, params: any) => {
      capturedRpcRef.current = { name, params }
      return Promise.resolve({ data: null, error: null })
    },
  }),
}))

import {
  trackEvent,
  initAnalytics,
  isAdminOptOut,
  setAdminOptOut,
  _resetAnalyticsForTesting,
} from '../src/lib/analytics/tracker'
import handler from '../api/analytics'

describe('Privacy-First Aggregate Analytics Full Verification', () => {
  beforeEach(() => {
    localStorage.clear()
    _resetAnalyticsForTesting()
    vi.restoreAllMocks()
    capturedRpcRef.current = null
  })

  // 1. No persistent analytics visitor ID is created
  it('1. proves no persistent analytics visitor ID is created', () => {
    initAnalytics()
    expect(localStorage.getItem('portfolio_visitor_id')).toBeNull()
  })

  // 2. No analytics session ID is created
  it('2. proves no analytics session ID is created', () => {
    initAnalytics()
    expect(localStorage.getItem('portfolio_session_meta')).toBeNull()
  })

  // 3. No analytics identifier is stored in localStorage
  it('3. proves no analytics identifier is stored in localStorage', () => {
    initAnalytics()
    trackEvent('page_view', { page: '/' })
    trackEvent('project_open', { project_slug: 'portfolio' })
    trackEvent('resume_download')

    const keys = Object.keys(localStorage)
    expect(keys.includes('portfolio_visitor_id')).toBe(false)
    expect(keys.includes('portfolio_session_meta')).toBe(false)
  })

  // 4. Heartbeat is not sent
  it('4. proves heartbeat is not sent periodically', () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    global.fetch = fetchMock

    initAnalytics()
    fetchMock.mockClear()

    // Advance time by 60 seconds (old heartbeat was every 30s)
    vi.advanceTimersByTime(60000)

    // No heartbeat event must be dispatched
    const calls = fetchMock.mock.calls
    for (const call of calls) {
      const body = JSON.parse(call[1].body as string)
      const eventNames = body.events.map((e: { event_name: string }) => e.event_name)
      expect(eventNames).not.toContain('heartbeat')
    }
    vi.useRealTimers()
  })

  // 5. Scroll tracking is not sent
  it('5. proves scroll tracking is completely removed', () => {
    expect(existsSync(resolve(process.cwd(), 'src/lib/analytics/scroll.ts'))).toBe(false)

    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    global.fetch = fetchMock

    // Attempting to track scroll depth should be ignored
    trackEvent('scroll_depth' as any, { depth: 75 } as any)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // 6. Only allowed aggregate events are accepted
  it('6. proves only allowed aggregate events are accepted', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    global.fetch = fetchMock

    // Prohibited telemetry
    trackEvent('section_view' as any)
    trackEvent('contact_click' as any)
    trackEvent('email_click' as any)
    trackEvent('navbar_click' as any)
    trackEvent('project_demo_click' as any)
    trackEvent('project_github_click' as any)

    expect(fetchMock).not.toHaveBeenCalled()

    // Allowed event
    trackEvent('project_open', { project_slug: 'zendix' })
    expect(fetchMock).toHaveBeenCalled()
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.events[0].event_name).toBe('project_open')
  })

  // 7. Country analytics still works without storing IP
  it('7. proves country analytics works via headers without storing IP in api/analytics.ts', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key')

    const req = {
      method: 'POST',
      headers: {
        'x-vercel-ip-country': 'TH',
        'x-forwarded-for': '203.0.113.195', // IP should never be passed or stored
      },
      body: {
        events: [{ event_name: 'page_view', page: '/' }],
      },
    } as unknown as VercelRequest

    let statusHeader = ''
    const res = {
      setHeader: (name: string, val: string) => {
        if (name === 'X-Analytics-Status') statusHeader = val
      },
      status: () => res,
      end: vi.fn(),
      json: vi.fn(),
    } as unknown as VercelResponse

    await handler(req, res)

    expect(statusHeader).toBe('ok')
    expect(capturedRpcRef.current).not.toBeNull()
    expect(capturedRpcRef.current!.name).toBe('analytics_record_events')
    expect(capturedRpcRef.current!.params.p_country).toBe('TH')
    // Asserts no IP address in params
    expect(JSON.stringify(capturedRpcRef.current!.params)).not.toContain('203.0.113.195')
  })

  // 8. Referrer analytics still works
  it('8. proves referrer host is captured for aggregate reporting', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    global.fetch = fetchMock

    trackEvent('page_view', { page: '/', referrer_host: 'github.com' })

    expect(fetchMock).toHaveBeenCalled()
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.events[0].referrer_host).toBe('github.com')
  })

  // 9. UTM analytics still works
  it('9. proves UTM parameters are captured without persistent browser identity', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    global.fetch = fetchMock

    trackEvent('page_view', {
      page: '/',
      utm_source: 'linkedin',
      utm_medium: 'social',
      utm_campaign: 'promo',
    })

    expect(fetchMock).toHaveBeenCalled()
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.events[0].utm_source).toBe('linkedin')
    expect(body.events[0].utm_medium).toBe('social')
    expect(body.events[0].utm_campaign).toBe('promo')

    // LocalStorage must remain empty of UTM tracking state
    expect(localStorage.getItem('portfolio_session_meta')).toBeNull()
  })

  // 10. Project aggregate analytics still works
  it('10. proves project aggregate interest is recorded with project_slug', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    global.fetch = fetchMock

    trackEvent('project_open', { project_slug: 'slipzen' })

    expect(fetchMock).toHaveBeenCalled()
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.events[0].event_name).toBe('project_open')
    expect(body.events[0].project_slug).toBe('slipzen')
  })

  // 11. Admin dashboard still works without individual visitor journeys
  it('11. proves admin dashboard does not depend on RecentSessions', () => {
    expect(existsSync(resolve(process.cwd(), 'src/features/admin/components/analytics/RecentSessions.tsx'))).toBe(false)
    expect(existsSync(resolve(process.cwd(), 'src/features/admin/components/analytics/SessionDrawer.tsx'))).toBe(false)
  })

  // 12. Supabase RLS still prevents public analytics reads/writes
  it('12. proves Supabase migration defines strict RLS and revokes public access', () => {
    const migrationSql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/20260930000000_privacy_analytics.sql'),
      'utf8'
    )

    expect(migrationSql).toContain('alter table public.analytics_daily enable row level security;')
    expect(migrationSql).toContain('revoke all on public.analytics_daily from public, anon;')
    expect(migrationSql).toContain('grant select on public.analytics_daily to authenticated;')
    expect(migrationSql).toContain('create policy "Admin can read analytics daily"')
    expect(migrationSql).toContain('exists (select 1 from public.portfolio_admins')
    expect(migrationSql).toContain('grant execute on function public.analytics_record_events(jsonb, text) to service_role;')
  })

  // 13. Contact form functionality is unaffected
  it('13. proves contact form is not coupled to analytics visitor IDs', async () => {
    const formCode = readFileSync(
      resolve(process.cwd(), 'src/features/contact/hooks/useContactForm.ts'),
      'utf8'
    )

    expect(formCode).not.toContain('visitor_id')
    expect(formCode).not.toContain('session_id')
    expect(formCode).not.toContain('trackEvent')
  })
})
