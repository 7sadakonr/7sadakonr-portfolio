import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

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
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses the Vercel hourly visitor series instead of Supabase visitor data', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => vercelResponse({
      configured: true,
      totalVisitors: 12,
      visitorDataAvailable: true,
      visitorTimeSeries: [
        { date: '06:00', visitors: 4 },
        { date: '09:00', visitors: 2 },
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

    expect(result.current.timeseries.find((point) => point.date === '06:00')?.count).toBe(4)
    expect(result.current.timeseries.find((point) => point.date === '09:00')?.count).toBe(2)
    expect(result.current.timeseries.find((point) => point.date === '07:00')?.count).toBe(0)
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
})
