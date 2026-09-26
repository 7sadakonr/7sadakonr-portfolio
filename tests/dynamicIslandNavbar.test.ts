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
    expect(navbar).toContain('lazy(loadCommandMenu)')
    expect(navbar).not.toContain('GlassSurface')
    expect(commandCss).toContain('background: transparent')
    expect(commandCss).not.toContain('backdrop-filter')
  })

  it('shares the graphite material, balanced navigation geometry, and compositor progress fill', async () => {
    const [navbarCss, commandCss] = await Promise.all([
      read('../src/components/Navbar/Navbar.css'),
      read('../src/components/CommandMenu/CommandMenu.css'),
    ])

    expect(navbarCss).toContain('--island-bg: rgba(26, 26, 26, .78)')
    expect(navbarCss).toContain('--island-blur: 16px')
    expect(navbarCss).toContain('--island-edge-top: rgba(255, 255, 255, .12)')
    expect(navbarCss).toContain('--island-edge-bottom: rgba(255, 255, 255, .12)')
    expect(navbarCss).toContain('.island-material')
    expect(navbarCss).toContain('box-shadow: inset 0 1px 0 var(--island-edge-top), inset 0 -1px 0 var(--island-edge-bottom)')
    expect(navbarCss).toContain('border: 0')
    expect(navbarCss).toContain('backdrop-filter: blur(var(--island-blur)) saturate(1.15)')
    expect(navbarCss).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))')
    expect(navbarCss).toContain('height: 40px')
    expect(navbarCss).toContain('padding: 5px')
    expect(navbarCss).toContain('background: rgba(255, 255, 255, .12)')
    expect(navbarCss).toContain('background: rgba(255, 255, 255, .88)')
    expect(navbarCss).toContain('.island-progress-label')
    expect(navbarCss).toContain('.island-progress-percentage')
    expect(navbarCss).toContain('.island-progress-track')
    expect(navbarCss).toContain('grid-template-columns: minmax(0, 1fr) auto')
    expect(commandCss).toContain('scrollbar-width: thin')
    expect(commandCss).toContain('::-webkit-scrollbar-thumb')
    expect(commandCss).toContain('.command-search-row:focus-within')
    expect(navbarCss).not.toContain('border: 1px solid transparent')
    expect(commandCss).not.toContain('border: 1px solid transparent')
  })

  it('latches progress after meaningful scrolling and only preserves the search close stage on mobile', async () => {
    const navbar = await read('../src/components/Navbar/Navbar.tsx')

    expect(navbar).toContain('const SCROLL_TOP_THRESHOLD = 96')
    expect(navbar).toContain('const SCROLL_DIRECTION_THRESHOLD = 8')
    expect(navbar).toContain('const atBottom = maxScroll > SCROLL_TOP_THRESHOLD && y >= maxScroll - 1')
    expect(navbar).toContain('if (y <= SCROLL_TOP_THRESHOLD || atBottom)')
    expect(navbar).toContain("setView(previous => previous === 'navigation' ? 'compact' : previous)")
    expect(navbar).toContain("previous === 'compact' ? 'navigation' : previous")
    expect(navbar).toContain("if (isMobile || isCommandMenuOpen) return")
    expect(navbar).toContain("query.matches) setView(previous => previous === 'compact' ? 'navigation' : previous)")
    expect(navbar).toContain('island-search-preview-input')
    expect(navbar).toContain('onFocus={openCommandMenu}')
    expect(navbar).toContain('window.setTimeout(closeSearchPreview')
    expect(navbar).toContain("if (isMobile) setView('search')")
    expect(navbar).toContain("if (!isMobile) {\n      setView('navigation')")
    expect(navbar).toContain('aria-label={`Scroll progress — ${currentLabel}`}')
    expect(navbar).toContain('island-progress-label t-text-swap')
    expect(navbar).toContain('island-progress-percentage')
    expect(navbar).toContain('island-progress-track')
    expect(navbar).toContain('progressPercentageRef.current.textContent')
    expect(navbar).toContain('scrollProgressRef.current = scrollProgress')
    expect(navbar).toContain('onPointerEnter={revealNavigation}')
    expect(navbar).toContain('const progressRevealRef = useRef(false)')
    expect(navbar).toContain('if (progressRevealRef.current)')
    expect(navbar).toContain('onPointerMove={revealNavigation}')
    expect(navbar).toContain('onPointerLeave={releaseNavigationReveal}')
  })
})
