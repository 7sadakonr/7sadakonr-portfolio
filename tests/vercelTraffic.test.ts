import { afterEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler, { normalizeVisitorSeries } from '../api/vercel-traffic'

describe('normalizeVisitorSeries', () => {
  it('normalizes hourly visitor rows and returns no entries for an empty daily series', () => {
    expect(normalizeVisitorSeries([{ key: '2026-09-11T06:00:00.000Z', visitors: 2 }], 'hour')).toEqual([
      { date: '2026-09-11T06:00:00.000Z', visitors: 2 },
    ])
    expect(normalizeVisitorSeries([], 'day')).toEqual([])
  })

  it('keeps the same hour on distinct dates separate and orders cross-midnight buckets', () => {
    expect(normalizeVisitorSeries([
      { timestamp: '2026-09-11T00:30:00Z', visitors: 3 },
      { timestamp: '2026-09-10T23:00:00Z', visitors: 2 },
      { timestamp: '2026-09-10T00:00:00Z', visitors: 8 },
    ], 'hour')).toEqual([
      { date: '2026-09-10T00:00:00.000Z', visitors: 8 },
      { date: '2026-09-10T23:00:00.000Z', visitors: 2 },
      { date: '2026-09-11T00:00:00.000Z', visitors: 3 },
    ])
  })
})

describe('Vercel visitor availability', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

  it.each([
    [{ unexpected: 'schema' }, false],
    [{ data: [{ unexpected: 'row' }] }, false],
    [[], true],
    [{ data: [] }, true],
  ])('validates the successful series payload %j', async (series, available) => {
    vi.stubEnv('VERCEL_TOKEN', 'test-token')
    vi.stubEnv('VERCEL_PROJECT_ID', 'test-project')
    vi.stubEnv('VERCEL_TEAM_ID', 'team_test')
    const requests: URL[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input))
      requests.push(url)
      const payload = url.searchParams.get('by') === 'hour' ? series
        : url.pathname.endsWith('/count') ? { visitors: 9, pageViews: 12 }
          : url.searchParams.get('by') === 'day'
            ? { data: [{ date: '2026-09-11', visitors: 5, pageViews: 8 }] } : []
      return { ok: true, json: async () => payload } as Response
    })
    let body: Record<string, unknown> = {}
    const response = {
      setHeader: () => {},
      status: () => response,
      json: (value: Record<string, unknown>) => { body = value },
    }
    await handler({ method: 'GET', query: { days: '1' } } as unknown as VercelRequest, response as unknown as VercelResponse)
    expect(body.visitorDataAvailable).toBe(available)
    expect(body.visitorTimeSeries).toEqual([])
    expect(body.visitorDailyDataAvailable).toBe(true)
    expect(body.dailyTimeSeries).toEqual([{ date: '2026-09-11', visitors: 5, pageviews: 8 }])
    expect(requests.some((url) => url.searchParams.get('by') === 'hour')).toBe(true)
    expect(requests.some((url) => url.searchParams.get('by') === 'day')).toBe(true)
  })
})
