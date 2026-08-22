import { describe, expect, it } from 'vitest'
import * as runtimeWarmup from '../src/utils/runtimeWarmup'

describe('Navbar deferral', () => {
  it('caches the Navbar module so mounting after Hero readiness does not trigger duplicate imports', async () => {
    const loadNavbar = runtimeWarmup.loadNavbar

    expect(loadNavbar).toBeTypeOf('function')

    const [first, second] = await Promise.all([loadNavbar(), loadNavbar()])

    expect(first.default).toBe(second.default)
  })
})
