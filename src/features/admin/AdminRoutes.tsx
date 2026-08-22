import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminAuthProvider } from './auth/AdminAuthProvider'
import ProtectedAdminRoute from './auth/ProtectedAdminRoute'
import AdminLayout from './components/AdminLayout'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminProjectFormPage from './pages/AdminProjectFormPage'
import AdminProjectsPage from './pages/AdminProjectsPage'
import './admin.css'

const AdminRoutes = () => (
  <AdminAuthProvider>
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route element={<ProtectedAdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="projects/new" element={<AdminProjectFormPage />} />
          <Route path="projects/:id/edit" element={<AdminProjectFormPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin/projects" replace />} />
    </Routes>
  </AdminAuthProvider>
)

export default AdminRoutes
