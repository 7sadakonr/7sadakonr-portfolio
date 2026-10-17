import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), 'src/features/admin', file), 'utf8')

describe('admin design tokens', () => {
  const css = `${read('admin.css')}\n${read('admin-ui.css')}`

  it('defines every --admin-* custom property that is used', () => {
    const defined = new Set([...css.matchAll(/(--admin-[\w-]+)\s*:/g)].map((match) => match[1]))
    const used = [...css.matchAll(/var\((--admin-[\w-]+)/g)].map((match) => match[1]!)
    expect(used.filter((name) => !defined.has(name))).toEqual([])
  })

  it('keeps a visible keyboard focus ring', () => {
    expect(read('admin-ui.css')).toMatch(/:focus-visible[^{]*\{[^}]*outline:\s*2px solid/)
  })
})
