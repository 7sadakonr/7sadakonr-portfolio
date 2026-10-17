import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const getUser = vi.fn()
const maybeSingle = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}))

import handler, { bangkokKey, bucketKeys, bucketVisitors, getWindow } from '../api/vercel-traffic'

const run = async (request: Partial<VercelRequest>) => {
  const result = { status: 0, body: undefined as Record<string, unknown> | undefined }
  const response = {
    setHeader: vi.fn(),
    status(code: number) { result.status = code; return this },
    json(body: Record<string, unknown>) { result.body = body; return this },
  } as unknown as VercelResponse
  await handler({ method: 'GET', headers: { authorization: 'Bearer t' }, query: {}, ...request } as VercelRequest, response)
  return result
}

describe('Bangkok windows', () => {
  it('keys hours and days in GMT+7', () => {
    const utc = Date.parse('2026-10-16T18:30:00Z') // 01:30 on the 17th in Bangkok
    expect(bangkokKey(utc, 'hour')).toBe('2026-10-17T01:00')
    expect(bangkokKey(utc, 'day')).toBe('2026-10-17')
  })

  it('24h window covers 24 hourly buckets ending in the current hour', () => {
    const now = Date.parse('2026-10-16T18:30:00Z')
    const window = getWindow('24h', now)
    const keys = bucketKeys(window.start, window.end, window.granularity)
    expect(keys).toHaveLength(24)
    expect(keys.at(-1)).toBe('2026-10-17T01:00')
    expect(keys[0]).toBe('2026-10-16T02:00')
    expect(window.prevEnd).toBe(window.start - 1)
  })

  it('7d window starts at Bangkok midnight, including today', () => {
    const now = Date.parse('2026-10-16T18:30:00Z')
    const window = getWindow('7d', now)
    const keys = bucketKeys(window.start, window.end, window.granularity)
    expect(keys).toHaveLength(7)
    expect(keys[0]).toBe('2026-10-11')
    expect(keys.at(-1)).toBe('2026-10-17')
    expect(window.prevStart).toBe(window.start - 7 * 24 * 3600 * 1000)
  })
})

describe('bucketVisitors', () => {
  const start = Date.parse('2026-10-15T17:00:00Z') // 2026-10-16 00:00 Bangkok
  const end = Date.parse('2026-10-17T02:00:00Z')

  it('re-bins UTC hourly rows into Bangkok days, so 17:00Z lands on the next local day', () => {
    const rows = [
      { timestamp: '2026-10-15T20:00:00Z', visitors: 2 }, // 16th 03:00 BKK
      { timestamp: '2026-10-16T16:00:00Z', visitors: 3 }, // 16th 23:00 BKK
      { timestamp: '2026-10-16T17:00:00Z', visitors: 4 }, // 17th 00:00 BKK
    ]
    expect(bucketVisitors(rows, start, end, 'day')).toEqual([
      { key: '2026-10-16', visitors: 5 },
      { key: '2026-10-17', visitors: 4 },
    ])
  })

  it('returns zero-filled buckets for an empty payload and null for an unknown schema', () => {
    expect(bucketVisitors({ data: [] }, start, end, 'day')?.every((p) => p.visitors === 0)).toBe(true)
    expect(bucketVisitors({ unexpected: 'schema' }, start, end, 'day')).toBeNull()
    expect(bucketVisitors({ data: [{ unexpected: 'row' }] }, start, end, 'day')).toBeNull()
  })
})

describe('GET /api/vercel-traffic', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'publishable')
    vi.stubEnv('VERCEL_TOKEN', 'vt')
    vi.stubEnv('VERCEL_PROJECT_ID', 'proj')
    vi.stubEnv('VERCEL_TEAM_ID', 'team_x')
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    maybeSingle.mockResolvedValue({ data: { user_id: 'u1' }, error: null })
  })
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks() })

  it('requires an admin and never calls Vercel otherwise', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect((await run({ headers: {} })).status).toBe(401)
    getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('bad') })
    expect((await run({})).status).toBe(401)
    maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    expect((await run({})).status).toBe(403)
    expect((await run({ method: 'POST' })).status).toBe(405)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns totals, previous-period totals and a zero-filled series', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string) => {
      const url = new URL(String(input))
      const by = url.searchParams.get('by')
      const payload = by === 'hour' ? { data: [] }
        : by === 'referrerHostname' ? { data: [{ referrerHostname: 'google.com', visitors: 3 }, { referrerHostname: '', visitors: 7 }] }
          : by ? { data: [{ country: 'TH', visitors: 4 }] }
          : { visitors: Number(url.searchParams.get('since')) < Date.now() - 8 * 24 * 3600 * 1000 ? 5 : 9 }
      return { ok: true, json: async () => payload } as Response
    }))
    const { status, body } = await run({ query: { range: '7d' } })
    expect(status).toBe(200)
    expect(body).toMatchObject({ configured: true, range: '7d', granularity: 'day', seriesAvailable: true })
    expect(body?.visitors).toEqual({ current: 9, previous: 5 })
    expect(body?.series).toHaveLength(7)
    expect(body?.topReferrers).toEqual([{ referrer: 'google.com', count: 3 }, { referrer: '(Direct / none)', count: 7 }])
    expect(body?.topCountries).toEqual([{ country: 'TH', count: 4 }])
  })
})
