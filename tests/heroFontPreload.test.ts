import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('hero font preload', () => {
  it('preloads the Playwrite font used by the LCP text', async () => {
    const html = await readFile(resolve(process.cwd(), 'index.html'), 'utf8')

    expect(html).toContain('href="/fonts/playwrite-latin.woff2"')
    expect(html).toContain('as="font"')
    expect(html).toContain('type="font/woff2"')
    expect(html).toContain('crossorigin')
  })
})
