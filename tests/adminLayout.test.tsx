import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AdminLayout from '../src/features/admin/components/AdminLayout'
import { useUnsavedChanges } from '../src/features/admin/hooks/useUnsavedChanges'

vi.mock('../src/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: () => ({ logout: vi.fn() }),
}))

describe('AdminLayout', () => {
  afterEach(cleanup)

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

    expect(screen.getByRole('link', { name: 'Activity' }).getAttribute('href')).toBe('/admin/activity')
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

  it('locks page scroll while the drawer is open and closes on backdrop tap', () => {
    render(
      <MemoryRouter initialEntries={['/admin/analytics']}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/admin/analytics" element={<p>Analytics page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    const menuButton = screen.getByRole('button', { name: /open admin menu/i })
    expect(document.documentElement.style.overflow).toBe('')
    fireEvent.click(menuButton)
    expect(document.documentElement.style.overflow).toBe('hidden')

    fireEvent.click(screen.getByTestId('admin-nav-backdrop'))
    expect(menuButton.getAttribute('aria-expanded')).toBe('false')
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('asks before leaving a page with unsaved changes and lets the admin stay or discard', async () => {
    const DirtyPage = () => {
      useUnsavedChanges(true)
      return <p>Dirty form</p>
    }
    render(
      <MemoryRouter initialEntries={['/admin/profile']}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/admin/profile" element={<DirtyPage />} />
            <Route path="/admin/projects" element={<p>Projects page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Projects' }))
    expect(await screen.findByText('Leave without saving?')).toBeTruthy()
    expect(screen.getByText('Dirty form')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(screen.queryByText('Leave without saving?')).toBeNull()
    expect(screen.getByText('Dirty form')).toBeTruthy()

    fireEvent.click(screen.getByRole('link', { name: 'Projects' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Discard and leave' }))
    expect(await screen.findByText('Projects page')).toBeTruthy()
  })
})
