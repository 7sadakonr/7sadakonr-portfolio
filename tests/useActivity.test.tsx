import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc, getSession } = vi.hoisted(() => ({ rpc: vi.fn(), getSession: vi.fn() }))

vi.mock('../src/lib/supabase', () => ({ supabase: { rpc, auth: { getSession } } }))

import { useActivity } from '../src/features/admin/hooks/useActivity'

const respond = (overrides: Record<string, unknown> = {}) =>
  rpc.mockImplementation((name: string) =>
    Promise.resolve(name in overrides ? overrides[name] : { data: [], error: null }))

describe('useActivity', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-16T18:30:00Z'))
    getSession.mockResolvedValue({ data: { session: { access_token: 'jwt' } } })
    respond()
  })
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); rpc.mockReset() })

  it('asks for hourly series for 24h, the 24h before, and 7 days, plus the activity feed', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ configured: false }) } as Response)
    const { result } = renderHook(() => useActivity())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const series = rpc.mock.calls.filter(([name]) => name === 'analytics_timeseries').map(([, args]) => args)
    expect(series).toHaveLength(3)
    expect(series.every((args) => args.p_granularity === 'hour')).toBe(true)
    expect(series[0].p_from).toBe('2026-10-15T19:00:00.000Z') // 24 hourly buckets: 02:00 Bangkok yesterday .. 01:00 today
    expect(series[2].p_from).toBe('2026-10-10T17:00:00.000Z') // 11 Oct 00:00 Bangkok
    expect(rpc.mock.calls.some(([name]) => name === 'analytics_activity_hourly')).toBe(true)
    expect(fetchSpy).toHaveBeenCalledWith('/api/vercel-traffic?range=24h', { headers: { Authorization: 'Bearer jwt' } })
    expect(result.current.trafficStatus).toBe('unconfigured')
  })

  it('maps the activity feed and survives a failing section', async () => {
    respond({
      analytics_activity_hourly: { data: [{ date: '2026-10-17T00:00', metric: 'project_open', project_slug: 'a', title: 'Alpha', count: 2 }], error: null },
      analytics_timeseries: { data: null, error: { message: 'boom' } },
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response)
    const { result } = renderHook(() => useActivity())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.activity).toEqual([{ date: '2026-10-17T00:00', metric: 'project_open', project_slug: 'a', title: 'Alpha', count: 2 }])
    expect(result.current.errors.timeseries).toBe('boom')
    expect(result.current.errors.heatmap).toBe('boom')
    expect(result.current.trafficStatus).toBe('error')
  })
})
