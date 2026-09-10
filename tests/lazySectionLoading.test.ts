import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

describe('LazySection loading', () => {
  it('supports idle hydration while retaining approach-based loading for direct scroll navigation', async () => {
    const loader = await read('../src/components/LazySection/sectionLoader.ts')
    const source = await read('../src/components/LazySection/LazySection.tsx')

    expect(loader).toContain('scheduleBelowFoldHydration')
    expect(loader).toContain('runWhenIdle')
    expect(loader).toContain('requestSection(sectionId)')
    expect(source).toContain("{ rootMargin: '0px 0px -64px 0px', threshold: 0 }")
    expect(source).toContain("{ rootMargin: '0px 0px -180px 0px', threshold: 0 }")
    expect(source).toContain("{ rootMargin: '150px 0px', threshold: 0 }")
    expect(source).toContain('if (isSectionRequested(id)) setShouldRender(true)')
    expect(source).toContain('prefetchSection(id)')
    expect(source).toContain('ensureTargetReady(id)')
  })
})
