import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { createConnectMenuItems } from '../src/components/CommandMenu/CommandMenu'
import type { ContactLink } from '../src/features/siteSettings/types'

describe('Command Menu Connect entries', () => {
  it('uses visible backend links in their configured order', () => {
    const links: ContactLink[] = [
      { id: 'email', type: 'email', label: 'Email', value: 'hello@example.com', url: 'mailto:hello@example.com', isVisible: true },
      { id: 'github', type: 'github', label: 'GitHub', value: 'portfolio', url: 'https://github.com/portfolio', isVisible: false },
      { id: 'linkedin', type: 'linkedin', label: 'LinkedIn', value: 'portfolio', url: 'https://www.linkedin.com/in/portfolio', isVisible: true },
    ]

    expect(createConnectMenuItems(links).map((item) => [item.id, item.label, item.category])).toEqual([
      ['connect-email', 'hello@example.com', 'Connect'],
      ['connect-linkedin', 'LinkedIn', 'Connect'],
    ])
  })

  it('keeps Projects separate from Pages and preserves two mobile columns', async () => {
    const [menu, css] = await Promise.all([
      readFile(new URL('../src/components/CommandMenu/CommandMenu.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/components/CommandMenu/CommandMenu.css', import.meta.url), 'utf8'),
    ])

    expect(menu).toContain("item.category !== 'Projects'")
    expect(menu).toContain('const projectItems =')
    expect(menu).toContain('command-list--projects')
    expect(css).toContain('.command-list--pages, .command-list--projects')
    expect(css).toContain('.command-list--connect { grid-template-columns: repeat(2, minmax(0, 1fr)); }')
  })
})
