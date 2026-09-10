import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import CountryFlag from '../src/features/admin/components/analytics/CountryFlag'

describe('CountryFlag', () => {
  afterEach(() => {
    cleanup()
  })
  it('renders a crisp flag image for a valid ISO country code', () => {
    render(<CountryFlag code="TH" showCode />)

    const img = screen.getByRole('img', { name: /flag of thailand/i }) as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.src).toContain('flagcdn.com/24x18/th.png')
    expect(img.srcset).toContain('flagcdn.com/48x36/th.png 2x')
    expect(screen.getByText('TH')).toBeTruthy()
  })

  it('normalizes lowercase country codes to uppercase for code display and lowercase for image URL', () => {
    render(<CountryFlag code="us" showCode />)

    const img = screen.getByRole('img', { name: /flag of united states/i }) as HTMLImageElement
    expect(img.src).toContain('flagcdn.com/24x18/us.png')
    expect(screen.getByText('US')).toBeTruthy()
  })

  it('renders a fallback icon when country code is missing or invalid', () => {
    const { rerender } = render(<CountryFlag code={null} showCode />)
    expect(screen.getByText('🌐')).toBeTruthy()
    expect(screen.getByText('Unknown')).toBeTruthy()

    rerender(<CountryFlag code="INVALID" showCode />)
    expect(screen.getByText('🌐')).toBeTruthy()
    expect(screen.getByText('INVALID')).toBeTruthy()
  })

  it('falls back gracefully to globe icon when the flag image encounters a load error', () => {
    render(<CountryFlag code="JP" showCode />)

    const img = screen.getByRole('img', { name: /flag of japan/i })
    expect(img).toBeTruthy()

    fireEvent.error(img)

    expect(screen.getByText('🌐')).toBeTruthy()
    expect(screen.getByText('JP')).toBeTruthy()
  })
})
