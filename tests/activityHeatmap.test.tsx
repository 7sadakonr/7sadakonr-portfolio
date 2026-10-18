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

  it('draws the last 30 days as plain squares with no numbers, one per day', () => {
    render(<ActivityHeatmap window={getWindow('30d', NOW)} timeseries={[point('2026-10-12', 4)]} isLoading={false} />)

    expect(screen.getByText('Busiest days, last 30 days')).toBeTruthy()
    const cells = cellButtons()
    expect(cells).toHaveLength(30)
    expect(cells.every((cell) => cell.textContent === '')).toBe(true)
  })

  it('places days in week columns and weekday rows like GitHub', () => {
    render(<ActivityHeatmap window={getWindow('30d', NOW)} timeseries={[point('2026-10-12', 4)]} isLoading={false} />)

    // 18 Sep is a Friday in the first week: column 2 (after the label column), row 6 (Mon is row 2).
    const first = screen.getByRole('button', { name: /Fri 18 Sep/ })
    expect(first.style.gridColumn).toContain('2')
    expect(first.style.gridRow).toContain('6')
    expect(screen.getByText('Sep')).toBeTruthy()
    expect(screen.getByText('Oct')).toBeTruthy()
  })

  it('names the busiest day and shows that day when a square is tapped', () => {
    render(<ActivityHeatmap window={getWindow('30d', NOW)} timeseries={[point('2026-10-12', 4), point('2026-10-14', 2)]} isLoading={false} />)

    expect(screen.getByText('Busiest day:').parentElement?.textContent).toContain('Mon 12 Oct — 4 page views')
    const cell = screen.getByRole('button', { name: 'Wed 14 Oct — 2 page views' })
    fireEvent.click(cell)
    expect(cell.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('status').textContent).toBe('Wed 14 Oct — 2 page views')
  })
})
