import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/components/GlassSurface/GlassSurface', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../src/components/CommandMenu/CommandMenu', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>Command menu</div> : null,
}))

import Navbar from '../src/components/Navbar/Navbar'

const NavigateToAbout = () => {
  const navigate = useNavigate()
  return <button type="button" onClick={() => navigate('/about')}>Go to About</button>
}

describe('mobile command pill', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('keeps the current-page label after opening the command menu', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>,
    )

    const trigger = await screen.findByRole('button', { name: 'Open command menu' })
    expect(trigger.textContent).toContain('Home')

    fireEvent.click(trigger)

    expect(trigger.textContent).toContain('Home')
  })

  it('makes the next page label visible after scroll-spy changes the active page', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
        <NavigateToAbout />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Go to About' }))

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 200))
    })
    await act(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    })

    const label = container.querySelector('.pill-text')
    expect(label?.textContent).toBe('About')
    expect(label?.classList.contains('is-enter-start')).toBe(false)
  })
})
