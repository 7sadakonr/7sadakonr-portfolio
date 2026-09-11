import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const getDarkTheme = () => {
  const css = readFileSync(resolve(process.cwd(), 'src/features/admin/admin.css'), 'utf8')
  return css.slice(css.lastIndexOf('/* Quiet dark dashboard palette'))
}

describe('dark admin dashboard styling', () => {
  it('keeps nested analytics frames on the dark surface', () => {
    const css = getDarkTheme()

    expect(css).toMatch(/\.analytics-insights-bar\s*\{[^}]*background:\s*var\(--admin-surface-muted\)/)
    expect(css).toMatch(/\.analytics-insight-pill\s*\{[^}]*background:\s*var\(--admin-surface\)/)
    expect(css).toMatch(/\.analytics-chart-total-pill,\s*\.analytics-kpi-badge,[\s\S]*?\{[^}]*background:\s*#292932/)
  })

  it('keeps each KPI category identifiable before it is selected', () => {
    const css = getDarkTheme()

    expect(css).toMatch(/\.analytics-kpi-card--emerald \.analytics-kpi-icon\s*\{[^}]*color:\s*#ff9c9c/)
    expect(css).toMatch(/\.analytics-kpi-card--purple \.analytics-kpi-icon\s*\{[^}]*color:\s*#c797ff/)
    expect(css).toMatch(/\.analytics-kpi-card--blue \.analytics-kpi-icon\s*\{[^}]*color:\s*#f3a0dc/)
    expect(css).toMatch(/\.analytics-kpi-card--amber \.analytics-kpi-icon\s*\{[^}]*color:\s*#ffc58a/)
    expect(css).toMatch(/\.analytics-kpi-card--emerald\s*\{[^}]*border-left-color:\s*#ff9c9c/)
    expect(css).toMatch(/\.analytics-kpi-card--purple\s*\{[^}]*border-left-color:\s*#c797ff/)
    expect(css).toMatch(/\.analytics-kpi-card--blue\s*\{[^}]*border-left-color:\s*#f3a0dc/)
    expect(css).toMatch(/\.analytics-kpi-card--amber\s*\{[^}]*border-left-color:\s*#ffc58a/)
  })

  it('uses a single-width frame when a KPI card is active', () => {
    const css = getDarkTheme()

    expect(css).toMatch(/\.analytics-kpi-card--interactive\.is-active\s*\{[^}]*border-left-width:\s*1px/)
    expect(css).toMatch(/\.analytics-kpi-card--interactive\.is-active\.analytics-kpi-card--emerald\s*\{[^}]*box-shadow:\s*none/)
  })
})
