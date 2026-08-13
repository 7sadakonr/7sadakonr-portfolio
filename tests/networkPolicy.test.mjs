import test from 'node:test'
import assert from 'node:assert/strict'
import { canWarmHeavyAssets } from '../.test-dist/networkPolicy.js'

test('skips heavy warm-up for Save-Data and constrained connections', () => {
  assert.equal(canWarmHeavyAssets({ saveData: true }), false)
  assert.equal(canWarmHeavyAssets({ effectiveType: 'slow-2g' }), false)
  assert.equal(canWarmHeavyAssets({ effectiveType: '2g' }), false)
})

test('allows heavy warm-up when connection information is unavailable or fast', () => {
  assert.equal(canWarmHeavyAssets(undefined), true)
  assert.equal(canWarmHeavyAssets({ effectiveType: '3g' }), true)
  assert.equal(canWarmHeavyAssets({ effectiveType: '4g' }), true)
})
