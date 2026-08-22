import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

describe('initial runtime scheduling', () => {
  it('does not warm below-the-fold pages or project assets after the Hero becomes interactive', async () => {
    const [app, runtimeWarmup] = await Promise.all([
      read('../src/App.tsx'),
      read('../src/utils/runtimeWarmup.ts'),
    ])

    expect(app).not.toContain('warmBackgroundRuntime')
    expect(runtimeWarmup).not.toContain('preloadImage')
    expect(runtimeWarmup).not.toContain('todo_list_real.webp')
    expect(runtimeWarmup).not.toContain('portfolio_real_new.webp')
    expect(runtimeWarmup).not.toContain('zendix_real.webp')
    expect(runtimeWarmup).not.toContain('aceternity-world.svg')
  })

  it('retains on-demand loaders used by navigation and visible features', async () => {
    const runtimeWarmup = await read('../src/utils/runtimeWarmup.ts')

    expect(runtimeWarmup).toContain('export const loadAboutPage')
    expect(runtimeWarmup).toContain('export const loadProjectPage')
    expect(runtimeWarmup).toContain('export const loadContactPage')
    expect(runtimeWarmup).toContain('export const loadCommandMenu')
    expect(runtimeWarmup).toContain('export const loadLenis')
    expect(runtimeWarmup).toContain('export const loadFireflies')
  })
})
