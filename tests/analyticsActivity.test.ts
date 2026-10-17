import { describe, expect, it } from 'vitest'
import { buildHeatmap, buildHourLog, currentHourStats, heatLevel, type ActivityRow } from '../src/features/admin/hooks/analyticsActivity'
import { getWindow } from '../src/features/admin/hooks/analyticsTime'
import type { SeriesPoint } from '../src/features/admin/hooks/useAnalytics'

const NOW = Date.parse('2026-10-16T18:30:00Z') // Sat 17 Oct 01:30 in Bangkok
const point = (date: string, extra: Partial<SeriesPoint> = {}): SeriesPoint => ({
  date, page_views: 0, project_opens: 0, resume_downloads: 0, github_clicks: 0, demo_clicks: 0, ...extra,
})

describe('buildHourLog', () => {
  const rows: ActivityRow[] = [
    { date: '2026-10-17T00:00', metric: 'project_open', project_slug: 'a', title: 'Alpha', count: 2 },
    { date: '2026-10-17T00:00', metric: 'project_open', project_slug: 'b', title: null, count: 1 },
    { date: '2026-10-17T00:00', metric: 'resume_download', project_slug: '', title: null, count: 1 },
    { date: '2026-10-16T22:00', metric: 'github_click', project_slug: 'a', title: 'Alpha', count: 3 },
    { date: '2026-10-16T22:00', metric: 'demo_click', project_slug: 'a', title: 'Alpha', count: 1 },
  ]

  it('groups by hour, newest first, with the biggest project first and slug as a title fallback', () => {
    const log = buildHourLog(rows)
    expect(log.map((entry) => entry.key)).toEqual(['2026-10-17T00:00', '2026-10-16T22:00'])
    expect(log[0]).toMatchObject({ long: 'Sat 17 Oct, 00:00', resumes: 1, outbound: 0 })
    expect(log[0]?.projectOpens).toEqual([{ title: 'Alpha', count: 2 }, { title: 'b', count: 1 }])
    expect(log[1]).toMatchObject({ outbound: 4, resumes: 0, projectOpens: [] })
  })

  it('is empty when there is no activity', () => {
    expect(buildHourLog([])).toEqual([])
  })
})

describe('buildHeatmap', () => {
  const week = getWindow('7d', NOW)

  it('builds one row of 24 cells per Bangkok day and marks future hours', () => {
    const map = buildHeatmap(week, [point('2026-10-17T00:00', { page_views: 5 })], 'page_views')
    expect(map.days).toHaveLength(7)
    expect(map.days.every((day) => day.cells.length === 24)).toBe(true)
    const today = map.days[6]!
    expect(today.key).toBe('2026-10-17')
    expect(today.cells[0]).toMatchObject({ value: 5, label: 'Sat 17 Oct, 00:00 — 5 page views' })
    expect(today.cells[1]?.value).toBe(0)
    expect(today.cells[2]?.value).toBeNull() // 02:00 has not happened yet at 01:30
    expect(map.max).toBe(5)
  })

  it('puts an event from 17:30 UTC into the next Bangkok day', () => {
    const map = buildHeatmap(week, [point('2026-10-17T00:00', { project_opens: 1 })], 'project_opens')
    expect(map.days[5]?.cells.every((cell) => cell.value === 0)).toBe(true)
    expect(map.days[6]?.cells[0]?.value).toBe(1)
  })
})

describe('heatLevel', () => {
  it('scales 0..4 against the maximum', () => {
    expect(heatLevel(0, 10)).toBe(0)
    expect(heatLevel(null, 10)).toBe(0)
    expect(heatLevel(1, 10)).toBe(1)
    expect(heatLevel(5, 10)).toBe(2)
    expect(heatLevel(10, 10)).toBe(4)
  })
})

describe('currentHourStats', () => {
  it('compares the latest hour with the same hour yesterday', () => {
    const day = getWindow('24h', NOW)
    const stats = currentHourStats(
      day,
      [point('2026-10-17T01:00', { page_views: 8, project_opens: 2 })],
      [point('2026-10-16T01:00', { page_views: 4, project_opens: 2 })],
      {
        visitors: { current: 9, previous: 5 }, seriesAvailable: true, topReferrers: [], topCountries: [],
        series: [{ key: '2026-10-17T01:00', visitors: 6 }], previousSeries: [{ key: '2026-10-16T01:00', visitors: 3 }],
      },
    )
    expect(stats.label).toBe('01:00')
    expect(stats.pageViews).toEqual({ value: 8, previous: 4 })
    expect(stats.projectOpens).toEqual({ value: 2, previous: 2 })
    expect(stats.visitors).toEqual({ value: 6, previous: 3 })
  })

  it('has no visitors figure when Vercel data is unavailable', () => {
    expect(currentHourStats(getWindow('24h', NOW), [], [], null).visitors).toBeNull()
  })
})
