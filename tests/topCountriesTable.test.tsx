import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import TopCountriesTable from '../src/features/admin/components/analytics/TopCountriesTable'

describe('TopCountriesTable', () => {
  afterEach(cleanup)

  it('renders aggregate country rows with percentage share and request count', () => {
    const mockData = [
      { country: 'TH', count: 42 },
      { country: 'JP', count: 18 },
      { country: 'US', count: 15 },
    ]

    render(<TopCountriesTable data={mockData} isLoading={false} />)

    expect(screen.getByText('Geographic Distribution')).toBeTruthy()
    expect(screen.getByText('Thailand')).toBeTruthy()
    expect(screen.getByText('(TH)')).toBeTruthy()
    expect(screen.getByText('56.0%')).toBeTruthy() // 42 / 75 = 56.0%
    expect(screen.getByText('42')).toBeTruthy()

    expect(screen.getByText('Japan')).toBeTruthy()
    expect(screen.getByText('(JP)')).toBeTruthy()
    expect(screen.getByText('24.0%')).toBeTruthy() // 18 / 75 = 24.0%

    expect(screen.getByText('United States')).toBeTruthy()
    expect(screen.getByText('(US)')).toBeTruthy()
    expect(screen.getByText('20.0%')).toBeTruthy() // 15 / 75 = 20.0%
  })

  it('renders loading indicator when isLoading is true', () => {
    render(<TopCountriesTable data={[]} isLoading={true} />)
    expect(screen.getByText(/loading geographic data/i)).toBeTruthy()
  })

  it('renders empty message when no data is recorded', () => {
    render(<TopCountriesTable data={[]} isLoading={false} />)
    expect(screen.getByText(/no geographic data recorded yet/i)).toBeTruthy()
  })
})
