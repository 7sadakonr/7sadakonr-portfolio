import { Outlet, useNavigate } from 'react-router-dom'
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
        <button className="admin-brand" type="button" onClick={() => navigate('/admin/projects')}>Portfolio / Admin</button>
        <button className="admin-button admin-button--quiet" type="button" onClick={() => void handleLogout()}>Log out</button>
      </header>
      <Outlet />
    </main>
  )
}

export default AdminLayout
