import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

describe('preloader exit', () => {
  it('keeps the curtain mounted until its longest exit transition has finished', async () => {
    const preloader = await read('../src/components/Preloader/Preloader.tsx')

    expect(preloader).toContain('const EXIT_DURATION_MS = 850')
  })
})
