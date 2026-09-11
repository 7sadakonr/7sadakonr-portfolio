// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import InteractionChart from '../src/features/admin/components/analytics/InteractionChart'

expect.extend({
  toBeInTheDocument(received: unknown) {
    const pass = received instanceof HTMLElement && document.body.contains(received)
    return {
      pass,
      message: () => 'expected the element to be in the document',
    }
  },
})

describe('InteractionChart', () => {
  it('shows an unavailable notice instead of visitor chart data when Vercel is unavailable', () => {
    render(<InteractionChart metric="visitors" data={[]} isLoading={false} isVisitorDataAvailable={false} />)

    expect(screen.getByText(/Vercel visitor data is unavailable/i)).toBeInTheDocument()
    expect(screen.queryByText('0 Vercel Visitors')).toBeNull()
  })

  it('offers a compact metric selector for mobile layouts', () => {
    const onMetricChange = vi.fn()
    const { container } = render(<InteractionChart metric="visitors" data={[]} isLoading={false} onMetricChange={onMetricChange} />)

    fireEvent.change(within(container).getByRole('combobox', { name: /chart metric/i }), { target: { value: 'external_clicks' } })
    expect(onMetricChange).toHaveBeenCalledWith('external_clicks')
  })

  it('renders timeline total pill with formatted count when data is provided', () => {
    const mockData = [
      { date: '2026-09-01T00:00:00.000Z', count: 12 },
      { date: '2026-09-02T00:00:00.000Z', count: 34 },
    ]
    render(
      <InteractionChart
        metric="interactions"
        data={mockData}
        isLoading={false}
        days={30}
      />
    )

    expect(screen.getByText(/46 All Interactions/i)).toBeInTheDocument()
  })
})
