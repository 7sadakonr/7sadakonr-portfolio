import { describe, expect, it } from 'vitest'
import { buildTrendRows } from '../src/features/admin/hooks/analyticsSeries'
import { getWindow } from '../src/features/admin/hooks/analyticsTime'
import type { SeriesPoint, Traffic } from '../src/features/admin/hooks/useAnalytics'

const NOW = Date.parse('2026-10-16T18:30:00Z') // 17 Oct 01:30 Bangkok
const point = (date: string, extra: Partial<SeriesPoint> = {}): SeriesPoint => ({
  date, page_views: 0, project_opens: 0, resume_downloads: 0, github_clicks: 0, demo_clicks: 0, ...extra,
})

describe('buildTrendRows', () => {
  const win = getWindow('7d', NOW)

  it('zero-fills every bucket so short ranges never produce a 1-2 point chart', () => {
    const rows = buildTrendRows('page_views', win, [point('2026-10-17', { page_views: 4 })], [], null)
    expect(rows).toHaveLength(7)
    expect(rows.at(-1)?.value).toBe(4)
    expect(rows.slice(0, -1).every((row) => row.value === 0)).toBe(true)
  })

  it('aligns the previous period by position for the dashed overlay', () => {
    const rows = buildTrendRows('page_views', win, [], [point('2026-10-04', { page_views: 9 })], null)
    expect(rows[0]?.previous).toBe(9) // 4 Oct is the first day of the previous 7-day window
    expect(rows[1]?.previous).toBe(0)
  })

  it('reads visitors from the Vercel series and combines outbound clicks for engagement', () => {
    const traffic = {
      visitors: { current: 5, previous: 2 }, series: [{ key: '2026-10-16', visitors: 5 }], previousSeries: [],
      seriesAvailable: true, topReferrers: [], topCountries: [],
    } satisfies Traffic
    const rows = buildTrendRows('visitors', win, [point('2026-10-16', { github_clicks: 2, demo_clicks: 3, project_opens: 1 })], [], traffic)
    const day = rows.find((row) => row.key === '2026-10-16')
    expect(day).toMatchObject({ value: 5, outbound: 5, opens: 1, long: 'Fri 16 Oct' })
  })
})
