import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc, getSession } = vi.hoisted(() => ({ rpc: vi.fn(), getSession: vi.fn() }))

vi.mock('../src/lib/supabase', () => ({
  supabase: { rpc, auth: { getSession } },
}))

import { useAnalytics } from '../src/features/admin/hooks/useAnalytics'

const totals = (n: number) => ({ page_views: n, project_opens: n, resume_downloads: n, github_clicks: n, demo_clicks: n })

const respond = (overrides: Record<string, unknown> = {}) =>
  rpc.mockImplementation((name: string) => {
    if (name in overrides) return Promise.resolve(overrides[name])
    if (name === 'analytics_overview') return Promise.resolve({ data: { current: totals(4), previous: totals(2) }, error: null })
    return Promise.resolve({ data: [], error: null })
  })

const vercel = (body: Record<string, unknown>, ok = true) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body } as Response)

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-16T18:30:00Z')) // 01:30 on 17 Oct in Bangkok
    getSession.mockResolvedValue({ data: { session: { access_token: 'jwt' } } })
    respond()
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
    rpc.mockReset()
  })

  it('asks every RPC for the same Bangkok-aligned window, plus the previous period for totals', async () => {
    vercel({ configured: false })
    const { result } = renderHook(() => useAnalytics('7d'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const overviewArgs = rpc.mock.calls.find(([name]) => name === 'analytics_overview')![1]
    expect(overviewArgs.p_from).toBe('2026-10-10T17:00:00.000Z') // 11 Oct 00:00 Bangkok
    expect(overviewArgs.p_prev_to).toBe('2026-10-10T16:59:59.999Z')
    const series = rpc.mock.calls.filter(([name]) => name === 'analytics_timeseries')
    expect(series.map(([, args]) => args.p_granularity)).toEqual(['day', 'day'])
    expect(result.current.overview.current.page_views).toBe(4)
    expect(result.current.overview.previous.page_views).toBe(2)
  })

  it('uses hourly granularity for the 24h range', async () => {
    vercel({ configured: false })
    const { result } = renderHook(() => useAnalytics('24h'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(rpc.mock.calls.find(([name]) => name === 'analytics_timeseries')![1].p_granularity).toBe('hour')
  })

  it('sends the admin access token to the Vercel traffic endpoint and exposes the visitors', async () => {
    const fetchSpy = vercel({
      configured: true, visitors: { current: 12, previous: 6 }, seriesAvailable: true,
      series: [{ key: '2026-10-17', visitors: 12 }], previousSeries: [], topReferrers: [{ referrer: 'github.com', count: 3 }], topCountries: [],
    })
    const { result } = renderHook(() => useAnalytics('7d'))
    await waitFor(() => expect(result.current.trafficStatus).toBe('ok'))

    expect(fetchSpy).toHaveBeenCalledWith('/api/vercel-traffic?range=7d', { headers: { Authorization: 'Bearer jwt' } })
    expect(result.current.traffic?.visitors).toEqual({ current: 12, previous: 6 })
    expect(result.current.traffic?.topReferrers).toEqual([{ referrer: 'github.com', count: 3 }])
  })

  it('keeps other sections working when one source fails', async () => {
    respond({ analytics_project_performance: { data: null, error: { message: 'boom' } } })
    vercel({}, false)
    const { result } = renderHook(() => useAnalytics('7d'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.errors.projects).toBe('boom')
    expect(result.current.errors.traffic).toBeTruthy()
    expect(result.current.trafficStatus).toBe('error')
    expect(result.current.errors.overview).toBeUndefined()
    expect(result.current.overview.current.page_views).toBe(4)
  })

  it('marks Vercel as not connected instead of failing the page', async () => {
    vercel({ configured: false, message: 'missing env' })
    const { result } = renderHook(() => useAnalytics('7d'))
    await waitFor(() => expect(result.current.trafficStatus).toBe('unconfigured'))
    expect(result.current.errors.traffic).toBeUndefined()
  })
})
