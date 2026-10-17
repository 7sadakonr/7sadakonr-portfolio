import { bucketKeys, formatBucketLong, formatBucketTick, type AnalyticsWindow } from './analyticsTime'
import type { SeriesPoint, Traffic } from './useAnalytics'

export type TrendMetric = 'visitors' | 'page_views' | 'engagement'

export interface TrendRow {
  key: string
  tick: string
  long: string
  /** Main line: visitors or page views. */
  value: number
  /** Same bucket in the previous period (by position), for the dashed overlay. */
  previous: number | null
  opens: number
  resumes: number
  outbound: number
}

const byKey = <T extends { key: string }>(rows: T[]) => new Map(rows.map((row) => [row.key, row]))

// Zero-filled rows for every bucket in the window, so the axis never has gaps or 1-2 point charts.
export function buildTrendRows(
  metric: TrendMetric,
  window: AnalyticsWindow,
  timeseries: SeriesPoint[],
  previousTimeseries: SeriesPoint[],
  traffic: Traffic | null,
): TrendRow[] {
  const keys = bucketKeys(window.start, window.end, window.granularity)
  const previousKeys = bucketKeys(window.prevStart, window.prevEnd, window.granularity)
  const current = byKey(timeseries.map((point) => ({ ...point, key: point.date })))
  const previous = byKey(previousTimeseries.map((point) => ({ ...point, key: point.date })))
  const visitors = byKey(traffic?.series ?? [])
  const previousVisitors = byKey(traffic?.previousSeries ?? [])

  const pick = (key: string, source: 'current' | 'previous'): number => {
    if (metric === 'visitors') return (source === 'current' ? visitors : previousVisitors).get(key)?.visitors ?? 0
    return (source === 'current' ? current : previous).get(key)?.page_views ?? 0
  }

  return keys.map((key, index) => {
    const point = current.get(key)
    const previousKey = previousKeys[index]
    return {
      key,
      tick: formatBucketTick(key, window.granularity),
      long: formatBucketLong(key, window.granularity),
      value: pick(key, 'current'),
      previous: previousKey === undefined ? null : pick(previousKey, 'previous'),
      opens: point?.project_opens ?? 0,
      resumes: point?.resume_downloads ?? 0,
      outbound: (point?.github_clicks ?? 0) + (point?.demo_clicks ?? 0),
    }
  })
}
