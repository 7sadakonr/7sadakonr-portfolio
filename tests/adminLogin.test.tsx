import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AdminLoginPage from '../src/features/admin/pages/AdminLoginPage'
import { useAdminAuth } from '../src/features/admin/auth/useAdminAuth'

vi.mock('../src/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: vi.fn(() => ({ isAdmin: false, isLoading: false, login: vi.fn(), logout: vi.fn() })),
}))

describe('AdminLoginPage', () => {
  it('collects an email address rather than a custom username', () => {
    render(<MemoryRouter><AdminLoginPage /></MemoryRouter>)

    expect(screen.getByLabelText('Email')).toHaveProperty('type', 'email')
    expect(screen.queryByLabelText('Username')).toBeNull()
  })

  it('redirects to /admin/analytics when already authenticated', () => {
    vi.mocked(useAdminAuth).mockReturnValueOnce({ isAdmin: true, isLoading: false, login: vi.fn(), logout: vi.fn() })
    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/analytics" element={<div>Analytics Landing</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Analytics Landing')).not.toBeNull()
  })
})
