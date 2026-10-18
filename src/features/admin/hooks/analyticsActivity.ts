import { bucketKeys, formatBucketLong, formatBucketTick, type AnalyticsWindow } from './analyticsTime'
import { buildTrendRows } from './analyticsSeries'
import type { SeriesPoint, Traffic } from './useAnalytics'

export interface ActivityRow {
  date: string // Bangkok 'YYYY-MM-DDTHH:00'
  metric: 'project_open' | 'resume_download' | 'github_click' | 'demo_click' | string
  project_slug: string
  title: string | null
  count: number
}

export interface HourLogEntry {
  key: string
  long: string
  projectOpens: Array<{ title: string; count: number }>
  resumes: number
  outbound: number
}

// Hours that had activity, newest first, with project opens grouped per project.
export function buildHourLog(rows: ActivityRow[]): HourLogEntry[] {
  const byHour = new Map<string, HourLogEntry>()
  const opensByHour = new Map<string, Map<string, number>>()

  for (const row of rows) {
    let entry = byHour.get(row.date)
    if (!entry) {
      entry = { key: row.date, long: formatBucketLong(row.date, 'hour'), projectOpens: [], resumes: 0, outbound: 0 }
      byHour.set(row.date, entry)
    }
    if (row.metric === 'project_open') {
      const title = row.title || row.project_slug || 'Unknown project'
      const opens = opensByHour.get(row.date) ?? new Map<string, number>()
      opens.set(title, (opens.get(title) ?? 0) + row.count)
      opensByHour.set(row.date, opens)
    } else if (row.metric === 'resume_download') {
      entry.resumes += row.count
    } else if (row.metric === 'github_click' || row.metric === 'demo_click') {
      entry.outbound += row.count
    }
  }

  for (const [key, opens] of opensByHour) {
    byHour.get(key)!.projectOpens = [...opens].map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count)
  }
  return [...byHour.values()].sort((a, b) => b.key.localeCompare(a.key))
}

export type HeatmapMetric = 'page_views' | 'project_opens' | 'resume_downloads'

export const HEATMAP_METRICS: ReadonlyArray<{ key: HeatmapMetric; label: string; noun: string }> = [
  { key: 'page_views', label: 'Page views', noun: 'page views' },
  { key: 'project_opens', label: 'Project opens', noun: 'project opens' },
  { key: 'resume_downloads', label: 'Resume downloads', noun: 'resume downloads' },
]

export interface HeatmapCell {
  hour: number
  /** null for hours that have not happened yet. */
  value: number | null
  label: string
}

export interface HeatmapDay {
  key: string
  label: string
  cells: HeatmapCell[]
}

export interface Heatmap {
  days: HeatmapDay[]
  max: number
}

// Day (rows) x hour (columns) grid over an hourly window, in Bangkok time.
export function buildHeatmap(window: AnalyticsWindow, timeseries: SeriesPoint[], metric: HeatmapMetric): Heatmap {
  const noun = HEATMAP_METRICS.find((item) => item.key === metric)?.noun ?? metric
  const values = new Map(timeseries.map((point) => [point.date, point[metric]]))
  const inWindow = new Set(bucketKeys(window.start, window.end, 'hour'))
  const dayKeys = [...new Set([...inWindow].map((key) => key.slice(0, 10)))]
  let max = 0

  const days = dayKeys.map((dayKey) => {
    const cells: HeatmapCell[] = Array.from({ length: 24 }, (_, hour) => {
      const key = `${dayKey}T${String(hour).padStart(2, '0')}:00`
      const value = inWindow.has(key) ? values.get(key) ?? 0 : null
      if (value !== null && value > max) max = value
      const when = formatBucketLong(key, 'hour')
      return { hour, value, label: value === null ? `${when} — not yet` : `${when} — ${value} ${noun}` }
    })
    return { key: dayKey, label: formatBucketLong(dayKey, 'day'), cells }
  })
  return { days, max }
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

// Weekday (rows, Mon-first) x hour (columns) totals over an hourly series, in Bangkok time.
export function buildWeekdayHeatmap(timeseries: SeriesPoint[], metric: HeatmapMetric): Heatmap {
  const noun = HEATMAP_METRICS.find((item) => item.key === metric)?.noun ?? metric
  const totals = WEEKDAYS.map(() => Array.from({ length: 24 }, () => 0))
  for (const point of timeseries) {
    const date = new Date(`${point.date}:00Z`)
    if (Number.isNaN(date.getTime())) continue
    const weekday = (date.getUTCDay() + 6) % 7
    totals[weekday]![date.getUTCHours()]! += point[metric]
  }
  let max = 0
  const days = WEEKDAYS.map((name, weekday) => ({
    key: name,
    label: name,
    cells: totals[weekday]!.map((value, hour) => {
      if (value > max) max = value
      return { hour, value, label: `${name} ${String(hour).padStart(2, '0')}:00 — ${value} ${noun}` }
    }),
  }))
  return { days, max }
}

export interface BusiestHour {
  hour: number
  value: number
}

// Hours of the day ranked by total across all rows of a heatmap (zero-activity hours are dropped).
export function busiestHours(heatmap: Heatmap, count = 3): BusiestHour[] {
  const totals = Array.from({ length: 24 }, () => 0)
  for (const day of heatmap.days) {
    for (const cell of day.cells) totals[cell.hour]! += cell.value ?? 0
  }
  return totals
    .map((value, hour) => ({ hour, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || a.hour - b.hour)
    .slice(0, count)
}

// 0 (empty) .. 4 (busiest) bucket for the colour scale.
export function heatLevel(value: number | null, max: number): 0 | 1 | 2 | 3 | 4 {
  if (!value || max <= 0) return 0
  return Math.min(4, Math.max(1, Math.ceil((value / max) * 4))) as 1 | 2 | 3 | 4
}

export interface HourStat {
  value: number
  previous: number | null
}

export interface CurrentHourStats {
  label: string
  visitors: HourStat | null
  pageViews: HourStat
  projectOpens: HourStat
  resumeDownloads: HourStat
}

// The latest bucket of a 24h window versus the same hour yesterday (previous series, aligned by position).
export function currentHourStats(
  window: AnalyticsWindow,
  timeseries: SeriesPoint[],
  previousTimeseries: SeriesPoint[],
  traffic: Traffic | null,
): CurrentHourStats {
  const keys = bucketKeys(window.start, window.end, 'hour')
  const key = keys[keys.length - 1] ?? ''
  const previousKeys = bucketKeys(window.prevStart, window.prevEnd, 'hour')
  const previousKey = previousKeys[previousKeys.length - 1] ?? ''
  const now = timeseries.find((point) => point.date === key)
  const before = previousTimeseries.find((point) => point.date === previousKey)
  const pick = (metric: HeatmapMetric): HourStat => ({ value: now?.[metric] ?? 0, previous: before?.[metric] ?? 0 })

  const trendRows = traffic?.seriesAvailable ? buildTrendRows('visitors', window, timeseries, previousTimeseries, traffic) : []
  const visitorRow = trendRows[trendRows.length - 1]

  return {
    label: formatBucketTick(key, 'hour'),
    visitors: visitorRow ? { value: visitorRow.value, previous: visitorRow.previous } : null,
    pageViews: pick('page_views'),
    projectOpens: pick('project_opens'),
    resumeDownloads: pick('resume_downloads'),
  }
}
