import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Visitor traffic from Vercel Web Analytics, for the admin dashboard only.
// All windows and buckets are Asia/Bangkok (GMT+7, no DST). Responds with zero-filled
// series keyed 'YYYY-MM-DDTHH:00' (24h view) or 'YYYY-MM-DD' (7d / 30d views), both Bangkok local.

type Range = '24h' | '7d' | '30d'
export type Granularity = 'hour' | 'day'

interface VercelRow {
  key?: string
  date?: string
  day?: string
  timestamp?: string | number
  time?: string | number
  referrer?: string
  country?: string
  pageViews?: number
  visitors?: number
  count?: number
  total?: number
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const BANGKOK_OFFSET_MS = 7 * HOUR_MS
const RANGE_DAYS: Record<Range, number> = { '24h': 1, '7d': 7, '30d': 30 }

export interface TimeWindow {
  start: number
  end: number
  prevStart: number
  prevEnd: number
  granularity: Granularity
}

// Bangkok-aligned current window and the equally long window right before it.
export function getWindow(range: Range, now: number): TimeWindow {
  if (range === '24h') {
    const start = Math.floor(now / HOUR_MS) * HOUR_MS - 23 * HOUR_MS
    return { start, end: now, prevStart: start - 24 * HOUR_MS, prevEnd: start - 1, granularity: 'hour' }
  }
  const days = RANGE_DAYS[range]
  const startOfToday = Math.floor((now + BANGKOK_OFFSET_MS) / DAY_MS) * DAY_MS - BANGKOK_OFFSET_MS
  const start = startOfToday - (days - 1) * DAY_MS
  return { start, end: now, prevStart: start - days * DAY_MS, prevEnd: start - 1, granularity: 'day' }
}

export function bangkokKey(ms: number, granularity: Granularity): string {
  const iso = new Date(ms + BANGKOK_OFFSET_MS).toISOString()
  return granularity === 'hour' ? `${iso.slice(0, 13)}:00` : iso.slice(0, 10)
}

// Every bucket key in [start, end], oldest first.
export function bucketKeys(start: number, end: number, granularity: Granularity): string[] {
  const step = granularity === 'hour' ? HOUR_MS : DAY_MS
  const keys: string[] = []
  for (let t = start; t <= end; t += step) keys.push(bangkokKey(t, granularity))
  return keys
}

function rowsOf(raw: unknown): VercelRow[] | null {
  if (Array.isArray(raw)) return raw as VercelRow[]
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: VercelRow[] }).data
  }
  return null
}

// Re-bins Vercel hourly rows into Bangkok buckets; null when the payload has an unknown shape.
export function bucketVisitors(
  raw: unknown,
  start: number,
  end: number,
  granularity: Granularity,
): Array<{ key: string; visitors: number }> | null {
  const rows = rowsOf(raw)
  if (!rows) return null
  const totals = new Map(bucketKeys(start, end, granularity).map((key) => [key, 0]))
  for (const row of rows) {
    const value = row?.key ?? row?.date ?? row?.day ?? row?.timestamp ?? row?.time
    const visitors = row?.visitors
    const time = value === undefined || value === null ? NaN : new Date(value).getTime()
    if (!Number.isFinite(time) || typeof visitors !== 'number' || !Number.isFinite(visitors) || visitors < 0) return null
    const key = bangkokKey(time, granularity)
    if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + visitors)
  }
  return Array.from(totals, ([key, visitors]) => ({ key, visitors }))
}

const num = (value: unknown): number => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0
}

function totalVisitors(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const inner = record.data && typeof record.data === 'object' && !Array.isArray(record.data)
    ? (record.data as Record<string, unknown>) : record
  const visitors = num(inner.visitors ?? inner.uniqueVisitors ?? inner.unique_visitors)
  return visitors > 0 ? visitors : num(inner.pageviews ?? inner.pageViews ?? inner.total ?? inner.count ?? inner.value)
}

type AdminCheck = 'ok' | 'unconfigured' | 'unauthorized' | 'forbidden'

async function verifyAdmin(token: string): Promise<AdminCheck> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabaseKey) return 'unconfigured'

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) return 'unauthorized'
  const { data: membership, error: membershipError } = await client
    .from('portfolio_admins').select('user_id').eq('user_id', data.user.id).maybeSingle()
  return membershipError || !membership ? 'forbidden' : 'ok'
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const authorization = req.headers?.authorization ?? ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const admin = await verifyAdmin(token)
  if (admin === 'unconfigured') {
    res.status(503).json({ error: 'Admin verification is not configured' })
    return
  }
  if (admin !== 'ok') {
    res.status(admin === 'forbidden' ? 403 : 401).json({ error: admin === 'forbidden' ? 'Forbidden' : 'Unauthorized' })
    return
  }

  const vercelToken = (process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN || '').trim()
  const projectId = (process.env.VERCEL_PROJECT_ID || process.env.PROJECT_ID || '').trim()
  let teamId = (process.env.VERCEL_TEAM_ID || '').trim()

  if (!vercelToken || !projectId) {
    res.status(200).json({
      configured: false,
      message: 'Vercel API Token or Project ID is not yet configured in environment variables.',
    })
    return
  }

  const requested = String(req.query?.range ?? '7d')
  const range: Range = requested === '24h' || requested === '30d' ? requested : '7d'
  const window = getWindow(range, Date.now())
  const headers = { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' }

  // Auto-detect teamId if the project is owned by a team and it was not set explicitly.
  if (!teamId) {
    try {
      const projRes = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}`, { headers })
      if (projRes.ok) {
        const project = (await projRes.json()) as { accountId?: string }
        if (project?.accountId?.startsWith('team_')) teamId = project.accountId
      }
    } catch {
      // Continue without an auto-detected team.
    }
  }

  const query = (from: number, to: number, extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({ projectId, since: String(from), until: String(to), ...extra })
    if (teamId) params.set('teamId', teamId)
    return `https://api.vercel.com/v1/query/web-analytics/visits/${extra.by || extra.limit ? 'aggregate' : 'count'}?${params.toString()}`
  }
  const getJson = async (url: string): Promise<unknown> => {
    const response = await fetch(url, { headers }).catch(() => null)
    return response?.ok ? response.json().catch(() => null) : null
  }

  try {
    const [countNow, countPrev, hourlyNow, hourlyPrev, referrers, countries] = await Promise.all([
      getJson(query(window.start, window.end)),
      getJson(query(window.prevStart, window.prevEnd)),
      getJson(query(window.start, window.end, { by: 'hour' })),
      getJson(query(window.prevStart, window.prevEnd, { by: 'hour' })),
      getJson(query(window.start, window.end, { by: 'referrer', limit: '8' })),
      getJson(query(window.start, window.end, { by: 'country', limit: '10' })),
    ])

    if (countNow === null && hourlyNow === null) {
      res.status(200).json({
        configured: false,
        message: 'Vercel Web Analytics did not respond. Check VERCEL_TOKEN and VERCEL_PROJECT_ID.',
      })
      return
    }

    const series = bucketVisitors(hourlyNow, window.start, window.end, window.granularity)
    const previousSeries = bucketVisitors(hourlyPrev, window.prevStart, window.prevEnd, window.granularity)
    const sumOf = (points: Array<{ visitors: number }> | null) =>
      points ? points.reduce((sum, point) => sum + point.visitors, 0) : null

    // Unique visitors cannot be summed from buckets; prefer the dedicated count, fall back to the bucket sum.
    const current = totalVisitors(countNow) ?? sumOf(series)
    const previous = totalVisitors(countPrev) ?? sumOf(previousSeries)

    const named = (raw: unknown, field: 'referrer' | 'country', fallback: string) =>
      (rowsOf(raw) ?? [])
        .filter((row): row is VercelRow => Boolean(row))
        .map((row) => ({
          [field]: row[field] || row.key || fallback,
          count: num(row.visitors ?? row.count ?? row.total ?? row.pageViews),
        }))

    res.status(200).json({
      configured: true,
      range,
      granularity: window.granularity,
      visitors: { current, previous },
      series: series ?? [],
      previousSeries: previousSeries ?? [],
      seriesAvailable: series !== null,
      topReferrers: named(referrers, 'referrer', '(Direct / None)'),
      topCountries: named(countries, 'country', 'Unknown'),
    })
  } catch (err) {
    console.error('[Vercel Traffic API] Failed querying Vercel Web Analytics:', err)
    res.status(500).json({ configured: true, error: 'Failed to communicate with Vercel Web Analytics API' })
  }
}
