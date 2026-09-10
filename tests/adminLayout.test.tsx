import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AdminLayout from '../src/features/admin/components/AdminLayout'

vi.mock('../src/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: () => ({ logout: vi.fn() }),
}))

describe('AdminLayout', () => {
  it('opens the mobile admin menu and closes it after choosing a destination', () => {
    render(
      <MemoryRouter initialEntries={['/admin/analytics']}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/admin/analytics" element={<p>Analytics page</p>} />
            <Route path="/admin/projects" element={<p>Projects page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    const menuButton = screen.getByRole('button', { name: /open admin menu/i })
    expect(menuButton.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(menuButton)
    expect(menuButton.getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.activeElement).toBe(menuButton)

    fireEvent.click(menuButton)
    fireEvent.click(screen.getByRole('link', { name: 'Projects' }))
    expect(menuButton.getAttribute('aria-expanded')).toBe('false')
  })
})
