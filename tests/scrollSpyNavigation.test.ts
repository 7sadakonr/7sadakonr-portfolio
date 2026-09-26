import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

describe('scroll-spy navigation', () => {
  it('does not turn a scroll-spy URL update into a second programmatic scroll', async () => {
    const navbar = await read('../src/components/Navbar/Navbar.tsx')
    expect(navbar).toContain('skipLocationScrollRef.current = path')
    expect(navbar).toContain('navigate(path, { replace: true })')
  })
})
