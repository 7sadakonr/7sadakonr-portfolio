import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProjectPerformanceTable from '../src/features/admin/components/analytics/ProjectPerformanceTable'

describe('ProjectPerformanceTable', () => {
  it('keeps project metrics and its inspect action in the mobile card list', () => {
    render(
      <ProjectPerformanceTable
        isLoading={false}
        data={[{
          slug: 'portfolio',
          title: 'Portfolio',
          opens: 20,
          visitors: 12,
          github_clicks: 4,
          demo_clicks: 2,
        }]}
      />,
    )

    const cards = screen.getByRole('list', { name: /project engagement cards/i })
    const content = cards.textContent ?? ''
    expect(content).toContain('Portfolio')
    expect(content).toContain('Unique Visitors')
    expect(content).toContain('12')
    fireEvent.click(screen.getByRole('button', { name: /inspect portfolio/i }))
    expect(screen.getByRole('dialog')).not.toBeNull()
  })
})
