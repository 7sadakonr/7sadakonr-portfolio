import { describe, expect, it } from 'vitest'
import { canWarmHeavyAssets } from '../src/utils/networkPolicy'

describe('canWarmHeavyAssets', () => {
  it('skips heavy warm-up for Save-Data and constrained connections', () => {
    expect(canWarmHeavyAssets({ saveData: true })).toBe(false)
    expect(canWarmHeavyAssets({ effectiveType: 'slow-2g' })).toBe(false)
    expect(canWarmHeavyAssets({ effectiveType: '2g' })).toBe(false)
  })

  it('allows heavy warm-up when connection information is unavailable or fast', () => {
    expect(canWarmHeavyAssets(undefined)).toBe(true)
    expect(canWarmHeavyAssets({ effectiveType: '3g' })).toBe(true)
    expect(canWarmHeavyAssets({ effectiveType: '4g' })).toBe(true)
  })
})
