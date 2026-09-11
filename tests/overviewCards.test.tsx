import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import OverviewCards from '../src/features/admin/components/analytics/OverviewCards'
import type { AnalyticsOverviewData } from '../src/features/admin/hooks/useAnalytics'

const overview: AnalyticsOverviewData = {
  visitors: 12, visitors_prev: null, visitors_today: 5, visitors_yesterday: 10,
  active_now: 0, interactions: 20, interactions_prev: 10, interactions_today: 4,
  interactions_yesterday: 2, project_opens: 8, external_clicks: 5,
  resume_downloads: 7, sessions: 12, avg_session_events: 2,
}
const card = (title: string) => screen.getByText(title).closest('.analytics-kpi-card')!

describe('OverviewCards visitor availability', () => {
  afterEach(cleanup)

  it('renders unavailable visitor values and removes their comparisons and live badges', () => {
    render(<OverviewCards data={overview} days={1} isLoading={false} isVisitorDataAvailable={false} />)
    for (const title of ['Total Visitors', 'Visitors Today']) {
      expect(card(title).querySelector('.analytics-kpi-number')?.textContent).toBe('Unavailable')
      expect(card(title).querySelector('.analytics-growth-badge')).toBeNull()
      expect(card(title).querySelector('.analytics-growth-label')).toBeNull()
      expect(card(title).querySelector('.analytics-kpi-badge')?.textContent).toBe('Unavailable')
    }
    expect(card('Total Interactions').querySelector('.analytics-kpi-number')?.textContent).toBe('20')
    expect(card('Total Interactions').querySelector('.analytics-growth-badge')?.textContent).toContain('+100.0%')
    expect(card('Resume Downloads').querySelector('.analytics-kpi-number')?.textContent).toBe('7')
  })

  it('suppresses unknown total visitor growth while keeping measured daily and engagement comparisons', () => {
    render(<OverviewCards data={overview} days={7} isLoading={false} isVisitorDataAvailable />)
    expect(card('Total Visitors').querySelector('.analytics-kpi-number')?.textContent).toBe('12')
    expect(card('Total Visitors').querySelector('.analytics-growth-badge')).toBeNull()
    expect(card('Total Visitors').querySelector('.analytics-growth-label')).toBeNull()
    expect(card('Visitors Today').querySelector('.analytics-growth-badge')?.textContent).toContain('-50.0%')
    expect(card('Total Interactions').querySelector('.analytics-growth-badge')?.textContent).toContain('+100.0%')
  })

  it('does not compare today with a partial yesterday from a rolling one-day query', () => {
    render(<OverviewCards data={overview} days={1} isLoading={false} isVisitorDataAvailable />)
    expect(card('Visitors Today').querySelector('.analytics-kpi-number')?.textContent).toBe('5')
    expect(card('Visitors Today').querySelector('.analytics-growth-badge')).toBeNull()
    expect(card('Visitors Today').querySelector('.analytics-growth-label')).toBeNull()
  })

  it('only marks the total visitor card active for the visitor timeline', () => {
    render(<OverviewCards data={overview} days={7} isLoading={false} isVisitorDataAvailable activeMetric="visitors" onSelectMetric={() => undefined} />)

    expect(card('Total Visitors').classList.contains('is-active')).toBe(true)
    expect(card('Visitors Today').classList.contains('analytics-kpi-card--interactive')).toBe(false)
    expect(card('Visitors Today').classList.contains('is-active')).toBe(false)
  })
})
