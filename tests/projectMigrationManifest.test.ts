import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PROJECTS } from '../src/features/projects/data/projects'

describe('project migration manifest', () => {
  it('preserves every current PROJECTS entry before database migration', async () => {
    const raw = await readFile('scripts/data/projects.seed.json', 'utf8')
    const seed = JSON.parse(raw) as Array<{ legacy_source_id: number; title: string; description: string; tech: string[]; image_source_path: string | null; image_sha256?: string; live_url: string; github_url: string; fallback_gradient: string | null; sort_order: number }>

    expect(seed).toHaveLength(PROJECTS.length)
    expect(seed.map((project) => project.legacy_source_id)).toEqual(PROJECTS.map((project) => project.id))
    expect(seed.map((project) => project.title)).toEqual(PROJECTS.map((project) => project.title))
    expect(seed.map((project) => project.description)).toEqual(PROJECTS.map((project) => project.description))
    expect(seed.map((project) => project.tech)).toEqual(PROJECTS.map((project) => project.tech))
    expect(seed.map((project) => project.live_url)).toEqual(PROJECTS.map((project) => project.liveUrl))
    expect(seed.map((project) => project.github_url)).toEqual(PROJECTS.map((project) => project.githubUrl))
    expect(seed.map((project) => project.sort_order)).toEqual(PROJECTS.map((_, index) => index))
    expect(seed.map((project) => project.fallback_gradient)).toEqual(PROJECTS.map((project) => project.gradient ?? null))

    for (const [index, project] of PROJECTS.entries()) {
      const manifest = seed[index]
      if (!manifest) throw new Error(`Missing manifest entry at index ${index}`)
      if (!project.image) {
        expect(manifest.image_source_path).toBeNull()
        continue
      }
      expect(manifest.image_source_path).not.toBeNull()
      expect(basename(manifest.image_source_path!)).toContain(basename(new URL(project.image, 'http://portfolio.local').pathname).split('?')[0] ?? '')
      const bytes = await readFile(manifest.image_source_path!)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.image_sha256)
    }
  })
})
