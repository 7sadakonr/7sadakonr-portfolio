import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button, Chip } from '@heroui/react'
import { useAdminAuth } from '../auth/useAdminAuth'

const AdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAdminAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuToggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')
    document.body.classList.add('dark')
    document.body.setAttribute('data-theme', 'dark')
    return () => {
      document.documentElement.classList.remove('dark')
      document.documentElement.removeAttribute('data-theme')
      document.body.classList.remove('dark')
      document.body.removeAttribute('data-theme')
    }
  }, [])

  useEffect(() => {
    if (!isMenuOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        menuToggleRef.current?.focus()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isMenuOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  const navItems = [
    {
      to: '/admin/analytics',
      label: 'Analytics',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      to: '/admin/projects',
      label: 'Projects',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      to: '/admin/profile',
      label: 'Profile',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      to: '/admin/contact',
      label: 'Contact',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
    },
    {
      to: '/admin/resume',
      label: 'Resume',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
  ]

  return (
    <main className="admin-shell dark" data-theme="dark">
      <header className="admin-header">
        <div className="flex items-center gap-3">
          <button
            className="admin-brand cursor-pointer flex items-center gap-2"
            type="button"
            onClick={() => navigate('/admin/analytics')}
          >
            <span className="font-extrabold tracking-tight text-white">Portfolio</span>
            <span className="text-zinc-500 font-normal">/</span>
            <span className="text-violet-400 font-bold">Admin</span>
          </button>
          <Chip
            size="sm"
            variant="soft"
            color="success"
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" aria-hidden="true" />
            Live System
          </Chip>
        </div>

        <div className="admin-header-actions flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            className="admin-desktop-logout text-xs cursor-pointer px-3 py-1.5 border-zinc-700/70 hover:border-red-800/80 hover:bg-red-950/20 hover:text-red-300 transition-colors"
            onClick={() => void handleLogout()}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mr-1">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </Button>

          <button
            ref={menuToggleRef}
            className="admin-menu-toggle sm:hidden"
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="admin-navigation"
            aria-label={isMenuOpen ? 'Close admin menu' : 'Open admin menu'}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {isMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      <nav id="admin-navigation" className={`admin-nav ${isMenuOpen ? 'is-open' : ''}`} aria-label="Admin navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsMenuOpen(false)}
            className={({ isActive }) =>
              `admin-nav-link ${
                isActive
                  ? 'active bg-zinc-800 text-white font-semibold border-none shadow-none'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}



        <Button
          size="sm"
          variant="danger-soft"
          className="admin-mobile-logout text-xs mt-2 w-full justify-start cursor-pointer"
          onClick={() => void handleLogout()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mr-1">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Log out</span>
        </Button>
      </nav>

      <Outlet />
    </main>
  )
}

export default AdminLayout
