import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import ActivityHeatmap from '../src/features/admin/components/activity/ActivityHeatmap'
import { getWindow } from '../src/features/admin/hooks/analyticsTime'
import type { SeriesPoint } from '../src/features/admin/hooks/useAnalytics'

const NOW = Date.parse('2026-10-16T18:30:00Z') // Sat 17 Oct 01:30 in Bangkok
const point = (date: string, page_views: number): SeriesPoint => ({
  date, page_views, project_opens: 0, resume_downloads: 0, github_clicks: 0, demo_clicks: 0,
})
const cellButtons = () => screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-pressed'))

describe('ActivityHeatmap', () => {
  afterEach(cleanup)

  it('shows one square per hour for 24h and names the busiest hour', () => {
    render(<ActivityHeatmap window={getWindow('24h', NOW)} range="24h" timeseries={[point('2026-10-16T21:00', 5)]} isLoading={false} />)

    expect(screen.getByText('Busiest hours, last 24 hours')).toBeTruthy()
    expect(cellButtons()).toHaveLength(24)
    expect(screen.getByText(/Busiest hour:/).parentElement?.textContent).toContain('Fri 16 Oct, 21:00 — 5 page views')
  })

  it('shows one labelled square per day for 7d and the exact figure when tapped', () => {
    render(<ActivityHeatmap window={getWindow('7d', NOW)} range="7d" timeseries={[point('2026-10-15', 5), point('2026-10-14', 2)]} isLoading={false} />)

    expect(cellButtons()).toHaveLength(7)
    const cell = screen.getByRole('button', { name: 'Thu 15 Oct — 5 page views' })
    fireEvent.click(cell)
    expect(cell.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('status').textContent).toBe('Thu 15 Oct — 5 page views')
  })

  it('shows a Monday-first calendar for 30d', () => {
    render(<ActivityHeatmap window={getWindow('30d', NOW)} range="30d" timeseries={[point('2026-10-12', 4)]} isLoading={false} />)

    expect(screen.getByText('Busiest days, last 30 days')).toBeTruthy()
    expect(cellButtons()).toHaveLength(30)
    expect(screen.getByText('Mon')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mon 12 Oct — 4 page views' })).toBeTruthy()
  })
})
