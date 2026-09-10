import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
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

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <button className="admin-brand" type="button" onClick={() => navigate('/admin/analytics')}>Portfolio / Admin</button>
        <div className="admin-header-actions">
          <button
            ref={menuToggleRef}
            className="admin-menu-toggle"
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="admin-navigation"
            aria-label={isMenuOpen ? 'Close admin menu' : 'Open admin menu'}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span className="admin-menu-toggle-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
          <button className="admin-button admin-button--quiet admin-desktop-logout" type="button" onClick={() => void handleLogout()}>Log out</button>
        </div>
      </header>
      <nav id="admin-navigation" className={`admin-nav ${isMenuOpen ? 'is-open' : ''}`} aria-label="Admin navigation">
        <NavLink to="/admin/analytics" onClick={() => setIsMenuOpen(false)}>Analytics</NavLink>
        <NavLink to="/admin/projects" onClick={() => setIsMenuOpen(false)}>Projects</NavLink>
        <NavLink to="/admin/profile" onClick={() => setIsMenuOpen(false)}>Profile</NavLink>
        <NavLink to="/admin/contact" onClick={() => setIsMenuOpen(false)}>Contact</NavLink>
        <NavLink to="/admin/resume" onClick={() => setIsMenuOpen(false)}>Resume</NavLink>
        <button className="admin-button admin-button--quiet admin-mobile-logout" type="button" onClick={() => void handleLogout()}>Log out</button>
      </nav>
      <Outlet />
    </main>
  )
}

export default AdminLayout
