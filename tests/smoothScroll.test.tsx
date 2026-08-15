import { render } from '@testing-library/react'
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

})
