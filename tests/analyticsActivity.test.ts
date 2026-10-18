import { describe, expect, it } from 'vitest'
import { buildCalendarWeeks, buildDayCells, buildHourCells, buildHourLog, currentHourStats, heatLevel, peakCell, type ActivityRow } from '../src/features/admin/hooks/analyticsActivity'
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

describe('heat cells', () => {
  it('builds 24 hourly cells, oldest first, marking the current hour and the max', () => {
    const window = getWindow('24h', NOW) // 02:00 Bangkok on 16 Oct .. 01:00 on 17 Oct
    const { cells, max } = buildHourCells(window, [point('2026-10-16T21:00', { page_views: 5 }), point('2026-10-17T01:00', { page_views: 2 })], 'page_views')

    expect(cells).toHaveLength(24)
    expect(cells[0]!.key).toBe('2026-10-16T02:00')
    expect(cells[0]!.title).toBe('02')
    expect(cells[19]!.value).toBe(5)
    expect(cells[23]!.isCurrent).toBe(true)
    expect(cells.filter((cell) => cell.isCurrent)).toHaveLength(1)
    expect(max).toBe(5)
  })

  it('builds one cell per day with weekday titles and zero-filled gaps', () => {
    const { cells, max } = buildDayCells(getWindow('7d', NOW), [point('2026-10-15', { page_views: 4 })], 'page_views')

    expect(cells.map((cell) => cell.key)).toEqual(['2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17'])
    expect(cells.map((cell) => cell.title)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
    expect(cells[4]!.value).toBe(4)
    expect(cells[0]!.value).toBe(0)
    expect(max).toBe(4)
  })

  it('lays 30 days out as Monday-first weeks padded with nulls', () => {
    const { cells } = buildDayCells(getWindow('30d', NOW), [], 'page_views') // 18 Sep (Fri) .. 17 Oct (Sat)
    const weeks = buildCalendarWeeks(cells)

    expect(weeks.every((week) => week.length === 7)).toBe(true)
    expect(weeks[0]!.slice(0, 4)).toEqual([null, null, null, null]) // Mon..Thu empty before Fri 18 Sep
    expect(weeks[0]![4]!.key).toBe('2026-09-18')
    expect(weeks[weeks.length - 1]![5]!.key).toBe('2026-10-17') // Saturday is column 5; Sunday is padding
    expect(weeks[weeks.length - 1]![6]).toBeNull()
    expect(weeks.flat().filter(Boolean)).toHaveLength(30)
    expect(buildCalendarWeeks([])).toEqual([])
  })

  it('finds the busiest cell, earliest on a tie, and none when empty', () => {
    const { cells } = buildDayCells(getWindow('7d', NOW), [point('2026-10-13', { page_views: 3 }), point('2026-10-15', { page_views: 3 })], 'page_views')

    expect(peakCell(cells)?.key).toBe('2026-10-13')
    expect(peakCell(buildDayCells(getWindow('7d', NOW), [], 'page_views').cells)).toBeNull()
  })
})
