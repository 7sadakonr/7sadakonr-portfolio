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

export interface HeatCell {
  key: string
  /** Hour 'HH' for hourly cells, short weekday for daily ones. */
  title: string
  /** Day of month. */
  day: number
  value: number
  label: string
  isCurrent: boolean
}

export interface HeatCells {
  cells: HeatCell[]
  max: number
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const nounOf = (metric: HeatmapMetric) => HEATMAP_METRICS.find((item) => item.key === metric)?.noun ?? metric
// Mon-first weekday index (0..6) of a Bangkok-local 'YYYY-MM-DD...' key.
const weekdayIndex = (key: string) => (new Date(`${key.slice(0, 10)}T00:00:00Z`).getUTCDay() + 6) % 7

function buildCells(window: AnalyticsWindow, timeseries: SeriesPoint[], metric: HeatmapMetric, granularity: 'hour' | 'day'): HeatCells {
  const noun = nounOf(metric)
  const values = new Map(timeseries.map((point) => [point.date, point[metric]]))
  const keys = bucketKeys(window.start, window.end, granularity)
  let max = 0
  const cells = keys.map((key, index) => {
    const value = values.get(key) ?? 0
    if (value > max) max = value
    return {
      key,
      title: granularity === 'hour' ? key.slice(11, 13) : WEEKDAYS[weekdayIndex(key)]!,
      day: Number(key.slice(8, 10)),
      value,
      label: `${formatBucketLong(key, granularity)} — ${value} ${noun}`,
      isCurrent: index === keys.length - 1,
    }
  })
  return { cells, max }
}

// One cell per hour of an hourly window (24h), oldest first.
export const buildHourCells = (window: AnalyticsWindow, timeseries: SeriesPoint[], metric: HeatmapMetric): HeatCells =>
  buildCells(window, timeseries, metric, 'hour')

// One cell per day of a daily window (7d / 30d), oldest first.
export const buildDayCells = (window: AnalyticsWindow, timeseries: SeriesPoint[], metric: HeatmapMetric): HeatCells =>
  buildCells(window, timeseries, metric, 'day')

// Day cells laid out as Monday-first calendar weeks, padded with null before the first and after the last day.
export function buildCalendarWeeks(cells: HeatCell[]): Array<Array<HeatCell | null>> {
  if (cells.length === 0) return []
  const padded: Array<HeatCell | null> = [...Array.from({ length: weekdayIndex(cells[0]!.key) }, () => null), ...cells]
  while (padded.length % 7 !== 0) padded.push(null)
  return Array.from({ length: padded.length / 7 }, (_, week) => padded.slice(week * 7, week * 7 + 7))
}

// The busiest cell (earliest wins a tie), or null when nothing happened.
export function peakCell(cells: HeatCell[]): HeatCell | null {
  let peak: HeatCell | null = null
  for (const cell of cells) if (cell.value > 0 && (!peak || cell.value > peak.value)) peak = cell
  return peak
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
