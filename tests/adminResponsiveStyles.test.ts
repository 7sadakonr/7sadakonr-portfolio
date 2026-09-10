import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('admin responsive styles', () => {
  it('provides the shared tablet and phone layout foundation', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/features/admin/admin.css'), 'utf8')

    expect(css).toContain('@media (max-width: 768px)')
    expect(css).toContain('@media (max-width: 430px)')
    expect(css).toContain('.admin-page { width: min(100% - 24px, 1120px)')
    expect(css).toContain('min-height: 44px')
  })
})
