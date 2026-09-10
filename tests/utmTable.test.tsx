import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import UtmTable from '../src/features/admin/components/analytics/UtmTable'

describe('UtmTable', () => {
  it('renders every attribution value in a mobile-friendly card list', () => {
    render(
      <UtmTable
        isLoading={false}
        data={[{ source: 'linkedin', campaign: 'profile', sessions: 12, interactions: 8, conversions: 2 }]}
      />,
    )

    const cards = screen.getByRole('list', { name: /utm campaign cards/i })
    const content = cards.textContent ?? ''
    expect(content).toContain('linkedin')
    expect(content).toContain('profile')
    expect(content).toContain('Sessions')
    expect(content).toContain('12')
    expect(content).toContain('Conversions')
    expect(content).toContain('16.7%')
  })
})
