import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AnimatedContent from '../src/components/Animation/AnimatedContent'

const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate')

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

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    if (originalAnimate) {
      Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate)
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'animate')
    }
  })

  it('disables CSS transitions while it prepares the entrance state', () => {
    const { getByTestId } = render(
      <AnimatedContent direction="horizontal" distance={50}>
        <div className="glass-card" data-testid="card" />
      </AnimatedContent>,
    )

    expect(getByTestId('card').style.transition).toBe('none')
  })

  it('keeps the final transform when a mobile browser cancels the reveal animation', () => {
    let observerCallback: IntersectionObserverCallback | undefined
    let finishAnimation: (() => void) | null = null
    let committed = false

    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback
      }
      observe(target: Element) {
        observerCallback?.([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
      }
      disconnect() {}
      unobserve() {}
      takeRecords() { return [] }
      root = null
      rootMargin = ''
      thresholds = []
    })

    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: function (this: HTMLElement) {
        return {
          set onfinish(callback: (() => void) | null) {
            finishAnimation = callback
          },
          commitStyles: () => {
            committed = true
          },
          cancel: () => {
            if (!committed) this.style.transform = 'translate3d(50px, 0px, 0)'
          },
        } as unknown as Animation
      },
    })

    const { getByTestId } = render(
      <AnimatedContent direction="horizontal" distance={50}>
        <div data-testid="card" />
      </AnimatedContent>,
    )

    finishAnimation?.()

    expect(getByTestId('card').style.transform).toBe('none')
  })
})
