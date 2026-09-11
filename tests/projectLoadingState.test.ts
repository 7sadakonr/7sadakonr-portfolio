import { describe, expect, it } from 'vitest'
import { getProjectLoadingPhase } from '../src/features/projects/projectLoadingState'

describe('project loading lifecycle', () => {
  it('reserves the skeleton layout before the delayed skeleton becomes visible', () => {
    expect(getProjectLoadingPhase(true, false)).toBe('reserved')
  })

  it('shows the existing skeleton layout after the delay while the request is pending', () => {
    expect(getProjectLoadingPhase(true, true)).toBe('visible')
  })

  it('keeps the skeleton visible until its minimum display duration has elapsed after data resolves', () => {
    expect(getProjectLoadingPhase(false, true)).toBe('visible')
  })

  it('allows the skeleton to exit only after the request settles', () => {
    expect(getProjectLoadingPhase(false, false)).toBe('exiting')
  })
})
