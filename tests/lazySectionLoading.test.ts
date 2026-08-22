import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

describe('LazySection loading thresholds', () => {
  it('waits for an actual approach to a section before prefetching and mounting it', async () => {
    const source = await read('../src/components/LazySection/LazySection.tsx')

    expect(source).toContain("{ rootMargin: '0px 0px -64px 0px', threshold: 0 }")
    expect(source).toContain("{ rootMargin: '0px 0px -180px 0px', threshold: 0 }")
    expect(source).toContain("{ rootMargin: '150px 0px', threshold: 0 }")
    expect(source).toContain('prefetchSection(id)')
    expect(source).toContain('ensureTargetReady(id)')
  })
})
