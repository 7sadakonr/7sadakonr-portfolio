import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { acquireScrollLock, cancelScrollAnimation, scrollToTarget, triggerResize } from '../src/components/SmoothScroll/scrollController'

const runtime = vi.hoisted(() => ({ loadLenis: vi.fn() }))
vi.mock('../src/utils/runtimeWarmup', () => runtime)

import SmoothScroll from '../src/components/SmoothScroll/SmoothScroll'

class MockLenis {
  static instances: MockLenis[] = []
  isStopped = false
  isScrolling: false | 'smooth' = false
  time = 0
  start = vi.fn(() => { this.isStopped = false })
  stop = vi.fn(() => { this.isStopped = true })
  destroy = vi.fn()
  resize = vi.fn()
  raf = vi.fn()
  scrollTo = vi.fn()
  constructor(readonly options: Record<string, unknown>) { MockLenis.instances.push(this) }
}

describe('smooth scroll controller', () => {
  let finePointer = false

  beforeEach(() => {
    finePointer = false
    MockLenis.instances = []
    runtime.loadLenis.mockResolvedValue({ default: MockLenis })
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: query === '(pointer: fine)' ? finePointer : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
    vi.stubGlobal('scrollTo', vi.fn())
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 })
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps native scrolling on touch-first devices', () => {
    render(<SmoothScroll isPrepared isEnabled><div>content</div></SmoothScroll>)
    expect(runtime.loadLenis).not.toHaveBeenCalled()
  })

  it('initializes a near-native Lenis configuration on fine pointers', async () => {
    finePointer = true
    const view = render(<SmoothScroll isPrepared isEnabled><div>content</div></SmoothScroll>)

    await waitFor(() => expect(runtime.loadLenis).toHaveBeenCalledOnce())
    expect(MockLenis.instances[0]?.options).toMatchObject({
      lerp: 0.085,
      wheelMultiplier: 0.85,
      touchMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      overscroll: true,
      autoRaf: false,
    })
    view.unmount()
  })

  it('wakes the RAF loop from Lenis idle after a wheel interaction', async () => {
    finePointer = true
    const view = render(<SmoothScroll isPrepared isEnabled><div>content</div></SmoothScroll>)

    await waitFor(() => expect(MockLenis.instances).toHaveLength(1))
    expect(MockLenis.instances[0]?.isScrolling).toBe(false)
    window.dispatchEvent(new Event('wheel'))

    expect(requestAnimationFrame).toHaveBeenCalled()
    view.unmount()
  })

  it('uses native smooth scrolling with the target position and offset when Lenis is unavailable', () => {
    const target = document.createElement('section')
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ top: 80 } as DOMRect)

    scrollToTarget(target, { offset: -20 })

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 180, behavior: 'smooth' })
  })

  it('keeps scrolling locked until every overlay releases its own lock', () => {
    document.body.style.overflow = 'visible'
    document.documentElement.style.overflow = 'auto'
    const releasePreloader = acquireScrollLock()
    const releaseCommandMenu = acquireScrollLock()

    releasePreloader()
    expect(document.body.style.overflow).toBe('hidden')
    releaseCommandMenu()
    expect(document.body.style.overflow).toBe('visible')
    expect(document.documentElement.style.overflow).toBe('auto')
  })

  it('does not navigate the background while an overlay owns the scroll lock', () => {
    const target = document.createElement('section')
    const releaseCommandMenu = acquireScrollLock()

    scrollToTarget(target)

    expect(window.scrollTo).not.toHaveBeenCalled()
    releaseCommandMenu()
  })

  it('cancels native navigation and keeps project resize safe before Lenis loads', () => {
    cancelScrollAnimation()
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 120, behavior: 'auto' })
    expect(triggerResize()).toBeUndefined()
  })
})
