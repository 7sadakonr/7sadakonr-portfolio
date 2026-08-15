import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AnimatedContent from '../src/components/Animation/AnimatedContent'

describe('AnimatedContent', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() { return [] }
      root = null
      rootMargin = ''
      thresholds = []
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('disables CSS transitions while it prepares the entrance state', () => {
    const { getByTestId } = render(
      <AnimatedContent direction="horizontal" distance={50}>
        <div className="glass-card" data-testid="card" />
      </AnimatedContent>,
    )

    expect(getByTestId('card').style.transition).toBe('none')
  })
})
