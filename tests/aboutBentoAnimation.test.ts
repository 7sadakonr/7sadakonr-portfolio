import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('About bento animation', () => {
  it('renders bento cards without AnimatedContent while keeping text reveal', async () => {
    const about = await readFile(resolve(process.cwd(), 'src/pages/AboutPage.tsx'), 'utf8')

    expect((about.match(/<AnimatedContent/g) ?? [])).toHaveLength(1)
    expect((about.match(/<TextReveal/g) ?? []).length).toBeGreaterThan(0)
  })
})
