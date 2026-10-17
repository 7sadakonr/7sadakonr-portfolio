// All analytics time is Asia/Bangkok (GMT+7, no DST). Buckets are keyed by Bangkok-local strings:
// 'YYYY-MM-DDTHH:00' for hourly series and 'YYYY-MM-DD' for daily ones, matching the SQL RPCs and /api/vercel-traffic.

export type RangeKey = '24h' | '7d' | '30d'
export type Granularity = 'hour' | 'day'

export const RANGE_OPTIONS: ReadonlyArray<{ key: RangeKey; label: string; long: string }> = [
  { key: '24h', label: '24h', long: 'Last 24 hours' },
  { key: '7d', label: '7 days', long: 'Last 7 days' },
  { key: '30d', label: '30 days', long: 'Last 30 days' },
]

export const ANALYTICS_TIME_ZONE_LABEL = 'Bangkok (GMT+7)'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const BANGKOK_OFFSET_MS = 7 * HOUR_MS
const RANGE_DAYS: Record<RangeKey, number> = { '24h': 1, '7d': 7, '30d': 30 }

export interface AnalyticsWindow {
  start: number
  end: number
  prevStart: number
  prevEnd: number
  granularity: Granularity
}

// Current window plus the equally long window immediately before it.
export function getWindow(range: RangeKey, now: number = Date.now()): AnalyticsWindow {
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

export function bucketKeys(start: number, end: number, granularity: Granularity): string[] {
  const step = granularity === 'hour' ? HOUR_MS : DAY_MS
  const keys: string[] = []
  for (let time = start; time <= end; time += step) keys.push(bangkokKey(time, granularity))
  return keys
}

// Bangkok-local key -> a Date whose UTC fields equal the Bangkok wall clock (only for formatting in UTC).
function wallClock(key: string): Date {
  return new Date(key.length > 10 ? `${key}:00Z` : `${key}T00:00:00Z`)
}

export function formatBucketTick(key: string, granularity: Granularity): string {
  const date = wallClock(key)
  if (Number.isNaN(date.getTime())) return key
  return granularity === 'hour'
    ? date.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    : date.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' })
}

export function formatBucketLong(key: string, granularity: Granularity): string {
  const date = wallClock(key)
  if (Number.isNaN(date.getTime())) return key
  const day = date.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })
  return granularity === 'hour' ? `${day}, ${formatBucketTick(key, 'hour')}` : day
}

export interface Delta {
  pct: number | null
  direction: 'up' | 'down' | 'flat' | 'new'
}

// Change vs. the previous period. 'new' = there was nothing to compare against.
export function computeDelta(current: number, previous: number | null | undefined): Delta {
  if (previous === null || previous === undefined) return { pct: null, direction: 'flat' }
  if (previous === 0) return current === 0 ? { pct: 0, direction: 'flat' } : { pct: null, direction: 'new' }
  const pct = Math.round(((current - previous) / previous) * 1000) / 10
  return { pct, direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' }
}

export function formatRelativeTime(from: Date, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - from.getTime()) / 1000))
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  return minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ago`
}

export interface SeriesSummary {
  total: number
  average: number
  peakKey: string | null
  peakValue: number
}

export function summarizeSeries(points: Array<{ key: string; value: number }>): SeriesSummary {
  if (points.length === 0) return { total: 0, average: 0, peakKey: null, peakValue: 0 }
  let peak = points[0]!
  let total = 0
  for (const point of points) {
    total += point.value
    if (point.value > peak.value) peak = point
  }
  return {
    total,
    average: Math.round((total / points.length) * 10) / 10,
    peakKey: peak.value > 0 ? peak.key : null,
    peakValue: peak.value,
  }
}
