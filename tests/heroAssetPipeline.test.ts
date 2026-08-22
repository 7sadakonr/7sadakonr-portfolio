import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

const getHeroAssetNames = (source: string) => [
  ...new Set(
    [...source.matchAll(/\/((?:hero-\d+\.(?:avif|webp)))/g)].map((match) => match[1]),
  ),
].filter((name): name is string => Boolean(name))

describe('hero asset pipeline', () => {
  it('generates the 120px responsive variants', async () => {
    const script = await read('../scripts/convert-webp.js')

    expect(script).toContain('const heroWidths = [120, 160, 240, 320, 480]')
    await expect(access(resolve(process.cwd(), 'public', 'hero-120.avif'))).resolves.toBeUndefined()
    await expect(access(resolve(process.cwd(), 'public', 'hero-120.webp'))).resolves.toBeUndefined()
  })

  it('keeps every declared hero candidate available to the browser', async () => {
    const [hero, html] = await Promise.all([
      read('../src/pages/HeroPage.tsx'),
      read('../index.html'),
    ])
    const assetNames = getHeroAssetNames(`${hero}\n${html}`)

    expect(assetNames).toHaveLength(10)
    expect(hero).toContain('fetchPriority="high"')
    expect(hero).toContain('loading="eager"')
    expect(hero).toContain('width="519"')
    expect(hero).toContain('height="403"')
    await Promise.all(assetNames.map((name) => access(resolve(process.cwd(), 'public', name))))
  })
})
