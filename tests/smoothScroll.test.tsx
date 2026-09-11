import { fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const runtime = vi.hoisted(() => ({
  loadLenis: vi.fn(),
}))

vi.mock('../src/utils/runtimeWarmup', () => runtime)

import SmoothScroll from '../src/components/SmoothScroll/SmoothScroll'

describe('SmoothScroll', () => {
  beforeEach(() => {
    runtime.loadLenis.mockResolvedValue({ default: vi.fn() })
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(pointer: fine)' ? false : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps native scrolling on touch-first devices', () => {
    render(
      <SmoothScroll isPrepared isEnabled>
        <div>content</div>
      </SmoothScroll>,
    )

    expect(runtime.loadLenis).not.toHaveBeenCalled()
  })

  it('preserves the native scroll position when Lenis starts from the first wheel interaction', async () => {
    const lenis = {
      destroy: vi.fn(),
      raf: vi.fn(),
      resize: vi.fn(),
      scrollTo: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }
    const Lenis = vi.fn(function Lenis() { return lenis })
    runtime.loadLenis.mockResolvedValue({ default: Lenis })
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(pointer: fine)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 240 })

    render(
      <SmoothScroll isPrepared isEnabled>
        <div>content</div>
      </SmoothScroll>,
    )

    fireEvent.wheel(window)

    await waitFor(() => expect(Lenis).toHaveBeenCalledTimes(1))
    expect(lenis.resize).toHaveBeenCalledTimes(1)
    expect(lenis.scrollTo).toHaveBeenCalledWith(240, { immediate: true, force: true })
  })

})
