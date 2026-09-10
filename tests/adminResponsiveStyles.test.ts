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

  it('uses mobile data cards instead of a horizontally scrollable analytics table', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/features/admin/admin.css'), 'utf8')
    const tablet = getLastMediaBlock(css, 'max-width: 768px')

    expect(tablet).toMatch(/\.analytics-table-desktop\s*\{[^}]*display:\s*none/)
    expect(tablet).toMatch(/\.analytics-mobile-card-list\s*\{[^}]*display:\s*grid/)
    expect(tablet).toMatch(/\.analytics-table-responsive\s*\{[^}]*overflow:\s*visible/)
  })
})
