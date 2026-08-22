import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AdminLoginPage from '../src/features/admin/pages/AdminLoginPage'

vi.mock('../src/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: () => ({ isAdmin: false, isLoading: false, login: vi.fn(), logout: vi.fn() }),
}))

describe('AdminLoginPage', () => {
  it('collects an email address rather than a custom username', () => {
    render(<MemoryRouter><AdminLoginPage /></MemoryRouter>)

    expect(screen.getByLabelText('Email')).toHaveProperty('type', 'email')
    expect(screen.queryByLabelText('Username')).toBeNull()
  })
})
