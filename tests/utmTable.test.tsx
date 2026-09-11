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

  it('correctly maps GitHub referrers and short source codes to github theme', async () => {
    const { getUtmSourceInfo } = await import('../src/features/admin/components/analytics/utmHelper')
    
    // Referrer host from GitHub without utm_source
    const refResult = getUtmSourceInfo(null, null, 'github.com')
    expect(refResult.theme.key).toBe('github')
    expect(refResult.theme.label).toBe('GitHub')
    expect(refResult.theme.cardClass).toBe('utm-card--github')
    expect(refResult.originHeading).toBe('From GitHub')

    // Short source code 'gh'
    const ghResult = getUtmSourceInfo('gh', 'portfolio_readme', null)
    expect(ghResult.theme.key).toBe('github')
    expect(ghResult.theme.cardClass).toBe('utm-card--github')
    expect(ghResult.originLabel).toBe('GitHub (portfolio_readme)')
  })

  it('ensures UTM cards have clean border stroke and no glow box-shadow', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const css = readFileSync(resolve(process.cwd(), 'src/features/admin/admin.css'), 'utf8')

    // GitHub card must have clean border and no glow
    expect(css).toMatch(/\.utm-card--github\s*\{[^}]*border:\s*1\.5px solid #2ea043 !important;[^}]*box-shadow:\s*none !important;/)
    // Instagram card must have no glow
    expect(css).toMatch(/\.utm-card--instagram\s*\{[^}]*box-shadow:\s*none !important;/)
    // LinkedIn card must have no glow
    expect(css).toMatch(/\.utm-card--linkedin\s*\{[^}]*box-shadow:\s*none !important;/)
  })
})
