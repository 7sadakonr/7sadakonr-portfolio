import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../auth/useAdminAuth'

const AdminLayout = () => {
  const navigate = useNavigate()
  const { logout } = useAdminAuth()
  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <button className="admin-brand" type="button" onClick={() => navigate('/admin/analytics')}>Portfolio / Admin</button>
        <button className="admin-button admin-button--quiet" type="button" onClick={() => void handleLogout()}>Log out</button>
      </header>
      <nav className="admin-nav" aria-label="Admin navigation">
        <NavLink to="/admin/analytics">Analytics</NavLink>
        <NavLink to="/admin/projects">Projects</NavLink>
        <NavLink to="/admin/profile">Profile</NavLink>
        <NavLink to="/admin/contact">Contact</NavLink>
        <NavLink to="/admin/resume">Resume</NavLink>
      </nav>
      <Outlet />
    </main>
  )
}

export default AdminLayout
