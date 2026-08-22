import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const indexHtmlPath = resolve(process.cwd(), 'index.html')

describe('initial document preloads', () => {
  it('declares the viewport before the responsive hero preload', async () => {
    const html = await readFile(indexHtmlPath, 'utf8')
    const viewportIndex = html.indexOf('<meta name="viewport"')
    const heroPreloadIndex = html.indexOf('rel="preload" as="image"')

    expect(viewportIndex).toBeGreaterThanOrEqual(0)
    expect(heroPreloadIndex).toBeGreaterThan(viewportIndex)
  })

  it('preloads only the fonts required for initial hero rendering', async () => {
    const html = await readFile(indexHtmlPath, 'utf8')

    expect(html).toContain('href="/fonts/outfit-latin.woff2"')
    expect(html).toContain('href="/fonts/playwrite-latin.woff2"')
    expect(html).not.toContain('href="/fonts/outfit-latin-ext.woff2"')
  })
})
