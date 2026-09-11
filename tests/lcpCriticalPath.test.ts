import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

describe('critical loading path', () => {
  it('makes critical readiness independent from the visual preloader lifecycle', async () => {
    const [app, hero, html] = await Promise.all([
      read('../src/App.tsx'),
      read('../src/pages/HeroPage.tsx'),
      read('../index.html'),
    ])
    expect(app).not.toContain('const isInteractive = isCriticalReady && !isPreloaderVisible')
    expect(app).toContain('isPrepared={isCriticalReady}')
    expect(app).toContain('canLoad={isCriticalReady}')
    expect(app).toContain('scheduleAfterPaint(() => setIsNavbarReady(true))')
    expect(hero).toContain('fetchPriority="high"')
    expect(html).toContain('hero-160.avif')
  })
})
