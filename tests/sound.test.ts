import { describe, expect, it } from 'vitest'
import { playTick, playWhisk, playWisp } from '../src/lib/sound'

describe('sound', () => {
  it('is a silent no-op when AudioContext is unavailable', () => {
    expect(() => { playTick(); playWisp(); playWhisk() }).not.toThrow()
  })
})
