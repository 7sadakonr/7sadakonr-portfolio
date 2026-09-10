import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('admin responsive styles', () => {
  it('provides the shared tablet and phone layout foundation', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/features/admin/admin.css'), 'utf8')

    expect(css).toContain('@media (max-width: 768px)')
    expect(css).toContain('@media (max-width: 430px)')
    expect(css).toContain('.admin-page { width: min(100% - 24px, 1120px)')
    expect(css).toContain('min-height: 44px')
  })

  it('keeps analytics data panels usable on phone-width screens', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/features/admin/admin.css'), 'utf8')

    expect(css).toMatch(/@media \(max-width: 580px\)\s*\{[\s\S]*?\.analytics-metric-segmented\s*\{[^}]*overflow-x:\s*auto/)
    expect(css).toMatch(/\.analytics-metric-segmented\s*\{[^}]*flex-wrap:\s*nowrap/)
    expect(css).toMatch(/\.analytics-segment-btn\s*\{[^}]*flex:\s*0 0 auto/)
    expect(css).toMatch(/\.analytics-chart-container\s*\{[^}]*height:\s*260px[^}]*min-height:\s*260px/)
    expect(css).toMatch(/\.analytics-header-controls\s*\{[^}]*flex-direction:\s*column[^}]*align-items:\s*stretch/)
    expect(css).toMatch(/\.analytics-drawer(?:--wide)?\s*\{[^}]*width:\s*100vw/)
    expect(css).toMatch(/\.analytics-table-responsive\s*\{[^}]*max-width:\s*100%[^}]*overflow-x:\s*auto/)
  })
})
