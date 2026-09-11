import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Preloader from '../src/components/Preloader/Preloader'

describe('Preloader interaction lifecycle', () => {
  afterEach(() => {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    vi.unstubAllGlobals()
  })

  it('releases scrolling while the visual curtain remains mounted after critical content is ready', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const { container, rerender } = render(<Preloader isCriticalReady={false} />)
    expect(document.body.style.overflow).toBe('hidden')

    rerender(<Preloader isCriticalReady />)

    expect(document.body.style.overflow).toBe('')
    expect(container.querySelector('.preloader-container--pass-through')).not.toBeNull()
  })
})
