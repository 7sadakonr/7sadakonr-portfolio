import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChannelIcon } from '../src/features/admin/components/analytics/ChannelIcon'

describe('ChannelIcon', () => {
  const brands = [
    'github',
    'instagram',
    'linkedin',
    'twitter',
    'facebook',
    'youtube',
    'tiktok',
    'google',
    'referrer',
    'direct',
    'custom',
  ]

  it.each(brands)('renders a crisp vector SVG logo for %s without emojis', (brand) => {
    const { container } = render(<ChannelIcon channel={brand} className="w-4 h-4 test-icon" />)
    const svg = container.querySelector('svg')

    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg?.classList.contains('test-icon')).toBe(true)
    expect(container.textContent).toBe('')
  })
})
