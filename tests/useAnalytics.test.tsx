import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

rpc.mockImplementation((name: string) => {
  if (name === 'analytics_overview') {
    return Promise.resolve({
      data: {
        visitors: 99,
        visitors_prev: 0,
        visitors_today: 99,
        visitors_yesterday: 0,
        active_now: 0,
        interactions: 0,
        interactions_prev: 0,
        interactions_today: 0,
        interactions_yesterday: 0,
        project_opens: 0,
        external_clicks: 0,
        resume_downloads: 0,
        sessions: 99,
        avg_session_events: 0,
      },
      error: null,
    })
  }

  return Promise.resolve({ data: [], error: null })
})

vi.mock('../src/lib/supabase', () => ({
  supabase: { rpc },
}))

import { useAnalytics } from '../src/features/admin/hooks/useAnalytics'

const vercelResponse = (payload: Record<string, unknown>) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(payload) } as Response)

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-11T01:30:00Z'))
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('uses the Vercel hourly visitor series instead of Supabase visitor data', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => vercelResponse({
      configured: true,
      totalVisitors: 12,
      visitorDataAvailable: true,
      visitorDailyDataAvailable: true,
      dailyTimeSeries: [
        { date: '2026-09-10', visitors: 7 },
        { date: '2026-09-11', visitors: 5 },
      ],
      visitorTimeSeries: [
        { date: '2026-09-10T01:00:00.000Z', visitors: 90 },
        { date: '2026-09-10T23:00:00.000Z', visitors: 4 },
        { date: '2026-09-11T01:00:00.000Z', visitors: 2 },
      ],
    }))

    const { result } = renderHook(() => useAnalytics())

    await act(async () => {
      result.current.setDays(1)
    })

    await waitFor(() => {
      expect(result.current.overview?.visitors).toBe(12)
      expect(result.current.timeseries).toHaveLength(24)
    })

    expect(result.current.timeseries[0]?.date).toBe('2026-09-10T02:00:00.000Z')
    expect(result.current.timeseries.at(-1)?.date).toBe('2026-09-11T01:00:00.000Z')
    expect(result.current.timeseries.find((point) => point.date === '2026-09-10T23:00:00.000Z')?.count).toBe(4)
    expect(result.current.timeseries.at(-1)?.count).toBe(2)
    expect(result.current.overview?.visitors_today).toBe(5)
    expect(result.current.overview?.visitors_yesterday).toBe(7)
    expect(result.current.overview?.visitors_prev).toBeNull()
    expect(result.current.trafficInsights.peakTimeLabel).toBe('23:00 - 00:00 UTC')
    const visitorDates = result.current.timeseries.map((point) => point.date)
    act(() => result.current.setMetric('project_opens'))
    expect(result.current.timeseries.map((point) => point.date)).toEqual(visitorDates)
  })

  it('keeps an empty Vercel visitor series empty when Supabase reports visitors', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => vercelResponse({
      configured: true,
      totalVisitors: 3,
      visitorDataAvailable: true,
      visitorTimeSeries: [],
    }))

    const { result } = renderHook(() => useAnalytics())

    await waitFor(() => {
      expect(result.current.overview?.visitors).toBe(3)
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.timeseries).not.toHaveLength(0)
    expect(result.current.timeseries.every((point) => point.count === 0)).toBe(true)
  })

  it('exposes unavailable visitor metrics without replacing engagement data', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => vercelResponse({ configured: false }))
    const { result } = renderHook(() => useAnalytics())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isVisitorDataAvailable).toBe(false)
    expect(result.current.overview?.visitors_today).toBeNull()
    expect(result.current.overview?.visitors_yesterday).toBeNull()
    expect(result.current.overview?.visitors_prev).toBeNull()
    expect(result.current.overview?.sessions).toBe(99)
    expect(result.current.timeseries).toEqual([])
  })

  it('matches timestamped engagement and unambiguous legacy UTC hours on the visitor axis', async () => {
    const originalRpc = rpc.getMockImplementation()!
    rpc.mockImplementation((name: string, params?: { p_metric?: string }) => {
      if (name === 'analytics_timeseries' && params?.p_metric === 'project_opens') {
        return Promise.resolve({ data: [
          { date: '2026-09-10T01:00:00Z', count: 99 },
          { date: '2026-09-11T01:00:00+00:00', count: 2 },
          { date: '23:00', count: 4 },
        ], error: null })
      }
      return originalRpc(name)
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => vercelResponse({ configured: false }))
    const { result } = renderHook(() => useAnalytics())
    await act(async () => { result.current.setDays(1); result.current.setMetric('project_opens') })
    await waitFor(() => expect(result.current.timeseries).toHaveLength(24))
    expect(result.current.timeseries.at(-1)?.count).toBe(2)
    expect(result.current.timeseries.find((point) => point.date === '2026-09-10T23:00:00.000Z')?.count).toBe(4)
    expect(result.current.trafficInsights.peakTimeLabel).toBe('23:00 - 00:00 UTC')
    rpc.mockImplementation(originalRpc)
  })
})
