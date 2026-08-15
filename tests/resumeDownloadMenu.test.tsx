import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Footer from '../src/components/Footer/Footer'
import AboutPage from '../src/pages/AboutPage'

describe('Resume downloads', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('reveals Thai and English download links from the footer Resume control', () => {
    render(<Footer />)

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))

    const thaiResume = screen.getByRole('link', { name: 'ภาษาไทย' })
    const englishResume = screen.getByRole('link', { name: 'English' })

    expect(thaiResume.getAttribute('download')).toBe('Jetsadakorn_Muangwichit_Resume_TH.pdf')
    expect(englishResume.getAttribute('download')).toBe('Jetsadakorn_Muangwichit_Resume_EN.pdf')
  })

  it('reveals Thai and English downloads from the About page button', () => {
    render(<AboutPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Download Resume' }))

    expect(screen.getByRole('link', { name: 'ภาษาไทย' })).not.toBeNull()
    expect(screen.getByRole('link', { name: 'English' })).not.toBeNull()
  })

  it('closes the footer language menu and returns focus to Resume when Escape is pressed', () => {
    render(<Footer />)

    const trigger = screen.getByRole('button', { name: 'Resume' })
    trigger.focus()
    fireEvent.click(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('link', { name: 'ภาษาไทย' })).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('returns focus to the open About menu instead of the footer Resume trigger on Escape', () => {
    render(
      <>
        <AboutPage />
        <Footer />
      </>
    )

    const heroTrigger = screen.getByRole('button', { name: 'Download Resume' })
    heroTrigger.focus()
    fireEvent.click(heroTrigger)
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(heroTrigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(heroTrigger)
  })
})
