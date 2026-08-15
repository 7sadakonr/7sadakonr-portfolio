import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Fireflies from '../src/components/Animation/Fireflies'

let observe: (() => void) | undefined

describe('Fireflies', () => {
  beforeEach(() => {
    observe = undefined
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    vi.stubGlobal('IntersectionObserver', class {
      constructor(private readonly callback: IntersectionObserverCallback) {}

      observe() {
        observe = () => this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
      }

      disconnect() {}
      root = null
      rootMargin = ''
      thresholds = []
      takeRecords() { return [] }
      unobserve() {}
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('keeps stars in their intro state until the background is visible', () => {
    const { container } = render(<Fireflies count={1} enabled />)
    const stars = container.querySelector('.fireflies-container')

    expect(stars?.classList.contains('is-active')).toBe(false)

    act(() => observe?.())

    expect(stars?.classList.contains('is-active')).toBe(true)
  })
})
