import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

describe('dynamic island navbar architecture', () => {
  it('uses a persistent motion shell, natural-size measurement, and a lazy command island', async () => {
    const [navbar, navbarCss, commandCss] = await Promise.all([
      read('../src/components/Navbar/Navbar.tsx'),
      read('../src/components/Navbar/Navbar.css'),
      read('../src/components/CommandMenu/CommandMenu.css'),
    ])

    expect(navbar).toContain("AnimatePresence mode=\"popLayout\"")
    expect(navbar).toContain('ResizeObserver')
    expect(navbar).toContain('animate={measuredSize}')
    expect(navbar).toContain('lazy(loadCommandMenu)')
    expect(navbar).toContain('desktop-command-btn')
    expect(navbar).toContain("'compact'")
    expect(navbarCss).toContain('scaleX(var(--navbar-scroll-progress, 0))')
    expect(navbarCss).toContain('env(safe-area-inset-top, 0px)')
    expect(navbarCss).not.toContain('backdrop-filter')
    expect(commandCss).not.toContain('backdrop-filter')
  })
})
