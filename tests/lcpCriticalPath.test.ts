import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

describe('critical loading path', () => {
  it('keeps the hero discoverable and the noncritical runtime gated', async () => {
    const [app, hero, html] = await Promise.all([
      read('../src/App.tsx'),
      read('../src/pages/HeroPage.tsx'),
      read('../index.html'),
    ])
    expect(app).toContain('const isInteractive = isCriticalReady && !isPreloaderVisible')
    expect(app).toContain('canLoad={isInteractive}')
    expect(hero).toContain('fetchPriority="high"')
    expect(html).toContain('hero-160.avif')
  })
})
