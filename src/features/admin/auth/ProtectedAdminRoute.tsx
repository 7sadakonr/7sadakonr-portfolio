import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from './useAdminAuth'

const ProtectedAdminRoute = () => {
  const { isLoading, isAdmin } = useAdminAuth()
  if (isLoading) return <main className="admin-loading">Checking session…</main>
  return isAdmin ? <Outlet /> : <Navigate to="/admin/login" replace />
}

export default ProtectedAdminRoute
