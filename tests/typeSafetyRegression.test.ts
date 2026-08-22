import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

describe('type safety regressions', () => {
  it('handles an absent intersection entry safely', async () => {
    const calendar = await read('../src/components/GithubCalendar/GithubCalendar.tsx')

    expect(calendar).toContain('if (entry?.isIntersecting)')
  })

  it('does not call the removed preloader progress setter', async () => {
    const preloader = await read('../src/components/Preloader/Preloader.tsx')

    expect(preloader).not.toContain('setProgress(100)')
    expect(preloader).toContain('progressRef.current = 100')
    expect(preloader).toContain('progressTargetRef.current = 100')
  })
})
