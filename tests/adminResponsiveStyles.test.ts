import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const getLastMediaBlock = (css: string, query: string) => {
  const marker = `@media (${query})`
  const start = css.lastIndexOf(marker)
  if (start === -1) throw new Error(`Missing media query: ${query}`)

  const blockStart = css.indexOf('{', start)
  let depth = 0
  for (let index = blockStart; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1
    if (css[index] === '}') depth -= 1
    if (depth === 0) return css.slice(blockStart + 1, index)
  }

  throw new Error(`Unclosed media query: ${query}`)
}

describe('admin mobile responsive rules', () => {
  it('stacks management rows before their full-width actions can overflow at tablet width', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/features/admin/admin.css'), 'utf8')
    const tablet = getLastMediaBlock(css, 'max-width: 768px')

    expect(tablet).toMatch(/\.admin-project-row\s*\{[^}]*grid-template-columns:\s*1fr/)
    expect(tablet).toMatch(/\.admin-contact-row, \.admin-resume-row\s*\{[^}]*flex-direction:\s*column/)
    expect(tablet).toMatch(/\.admin-row-actions\s*\{[^}]*width:\s*100%/)
  })

  it('switches between table and cards in CSS at the same 768px breakpoint as the nav menu', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/features/admin/admin-ui.css'), 'utf8')
    const table = readFileSync(resolve(process.cwd(), 'src/features/admin/components/ui/DataTable.tsx'), 'utf8')
    const layout = readFileSync(resolve(process.cwd(), 'src/features/admin/components/AdminLayout.tsx'), 'utf8')
    const small = getLastMediaBlock(css, 'max-width: 767px')

    // Plain CSS, not Tailwind utilities: unlayered component CSS would override a layered `md:hidden`.
    expect(css).toMatch(/\.adm-card-list\s*\{[^}]*display:\s*none/)
    expect(small).toMatch(/\.adm-table-wrap\s*\{[^}]*display:\s*none/)
    expect(small).toMatch(/\.adm-card-list\s*\{[^}]*display:\s*grid/)
    expect(table).not.toMatch(/md:(hidden|block)/)
    expect(layout).toMatch(/admin-menu-toggle md:hidden/)
  })

  it('turns the mobile nav into a scrollable drawer and keeps one scroll container', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/features/admin/admin.css'), 'utf8')
    const ui = readFileSync(resolve(process.cwd(), 'src/features/admin/admin-ui.css'), 'utf8')
    const tablet = getLastMediaBlock(css, 'max-width: 768px')
    const shell = css.match(/\.admin-shell\s*\{[^}]*\}/g)?.join('\n') ?? ''

    expect(tablet).toMatch(/\.admin-nav\s*\{[^}]*position:\s*fixed/)
    expect(tablet).toMatch(/\.admin-nav\s*\{[^}]*overflow-y:\s*auto/)
    expect(tablet).toMatch(/\.admin-nav-backdrop/)
    // The document scrolls; a fixed-height inner scroller left a dead black area below the content.
    expect(shell).not.toMatch(/overflow-y:\s*auto/)
    expect(shell).not.toMatch(/(?<!min-)height:\s*100dvh/)
    // The month heatmap shrinks to the screen instead of scrolling sideways.
    expect(ui).not.toMatch(/min-width:\s*640px/)
    expect(ui).not.toMatch(/adm-gh-heat/)
    expect(ui).toMatch(/\.adm-hm-cell\s*\{[^}]*aspect-ratio:\s*1/)
  })
})
