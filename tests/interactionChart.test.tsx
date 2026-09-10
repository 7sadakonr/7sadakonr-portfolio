// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})
