import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

describe('Hero effect gate', () => {
  it('defers BackgroundBeams until critical Hero readiness and an idle or pointer opportunity', async () => {
    const [app, hero] = await Promise.all([
      read('../src/App.tsx'),
      read('../src/pages/HeroPage.tsx'),
    ])

    expect(app).toContain('effectsEnabled={isCriticalReady}')
    expect(app).toContain('allowIdleEffects={allowIdleBeams}')
    expect(hero).toContain('effectsEnabled?: boolean')
    expect(hero).toContain('effectsEnabled = true')
    expect(hero).toContain('effectsEnabled &&')
    expect(hero).toContain('scheduleIdleWork(enableEffects)')
    expect(hero).toContain('shouldMountEffects &&')
    expect(hero).toContain('{isEffectActive && (')
  })
})
