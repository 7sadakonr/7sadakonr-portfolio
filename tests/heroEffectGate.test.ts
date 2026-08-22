import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

describe('Hero effect gate', () => {
  it('waits for the preloader to finish before mounting BackgroundBeams and shimmer', async () => {
    const [app, hero] = await Promise.all([
      read('../src/App.tsx'),
      read('../src/pages/HeroPage.tsx'),
    ])

    expect(app).toContain('<HeroPage effectsEnabled={isInteractive}')
    expect(hero).toContain('effectsEnabled?: boolean')
    expect(hero).toContain('effectsEnabled = true')
    expect(hero).toContain('effectsEnabled &&')
    expect(hero).toContain('{isEffectActive && (')
  })
})
