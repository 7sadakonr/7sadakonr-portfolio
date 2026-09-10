import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminAuthProvider } from './auth/AdminAuthProvider'
import ProtectedAdminRoute from './auth/ProtectedAdminRoute'
import AdminLayout from './components/AdminLayout'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminProjectFormPage from './pages/AdminProjectFormPage'
import AdminProjectsPage from './pages/AdminProjectsPage'
import AdminProfilePage from './pages/AdminProfilePage'
import AdminContactPage from './pages/AdminContactPage'
import AdminResumePage from './pages/AdminResumePage'
import './admin.css'

const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'))

const AdminRoutes = () => (
  <AdminAuthProvider>
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route element={<ProtectedAdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            path="analytics"
            element={
              <Suspense fallback={<main className="admin-loading">Loading analytics…</main>}>
                <AdminAnalyticsPage />
              </Suspense>
            }
          />
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="projects/new" element={<AdminProjectFormPage />} />
          <Route path="projects/:id/edit" element={<AdminProjectFormPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
          <Route path="contact" element={<AdminContactPage />} />
          <Route path="resume" element={<AdminResumePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin/analytics" replace />} />
    </Routes>
  </AdminAuthProvider>
)

export default AdminRoutes
