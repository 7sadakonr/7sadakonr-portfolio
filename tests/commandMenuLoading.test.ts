import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

describe('command menu loading', () => {
  it('keeps the menu out of the initial Navbar import graph and warms it after interaction', async () => {
    const [navbar, warmup] = await Promise.all([
      read('../src/components/Navbar/Navbar.tsx'),
      read('../src/utils/runtimeWarmup.ts'),
    ])

    expect(navbar).toContain("lazy(loadCommandMenu)")
    expect(navbar).toContain('shouldMountCommandMenu')
    expect(navbar).not.toContain("import CommandMenu, { type CommandMenuItem }")
    expect(warmup).toContain("loadCommandMenu")
  })
})
