import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import ActivityHeatmap from '../src/features/admin/components/activity/ActivityHeatmap'
import { getWindow } from '../src/features/admin/hooks/analyticsTime'
import type { SeriesPoint } from '../src/features/admin/hooks/useAnalytics'

const NOW = Date.parse('2026-10-16T18:30:00Z')
const point = (date: string, page_views: number): SeriesPoint => ({
  date, page_views, project_opens: 0, resume_downloads: 0, github_clicks: 0, demo_clicks: 0,
})

describe('ActivityHeatmap', () => {
  afterEach(cleanup)

  it('names the busiest hour and shows the exact hour when a square is tapped', () => {
    render(<ActivityHeatmap window={getWindow('7d', NOW)} range="7d" timeseries={[point('2026-10-15T21:00', 5), point('2026-10-14T09:00', 2)]} isLoading={false} />)

    expect(screen.getByText(/Busiest hour: 21:00–22:00/)).toBeTruthy()
    const cell = screen.getByRole('button', { name: /Thu 15 Oct, 21:00 — 5 page views/ })
    fireEvent.click(cell)
    expect(cell.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('status').textContent).toContain('Thu 15 Oct, 21:00 — 5 page views')
  })

  it('sums by weekday for the 30 day range', () => {
    render(<ActivityHeatmap window={getWindow('30d', NOW)} range="30d" timeseries={[point('2026-10-05T21:00', 3), point('2026-10-12T21:00', 4)]} isLoading={false} />)

    expect(screen.getByText('Busiest hours, last 30 days')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mon 21:00 — 7 page views' })).toBeTruthy()
  })
})
