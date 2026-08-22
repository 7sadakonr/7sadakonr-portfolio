import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../auth/useAdminAuth'

const AdminLoginPage = () => {
  const { isAdmin, isLoading, login } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && isAdmin) return <Navigate to="/admin/projects" replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate('/admin/projects', { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Invalid email or password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={(event) => void handleSubmit(event)}>
        <p className="admin-eyebrow">Portfolio back office</p>
        <h1>Sign in</h1>
        <p>Manage published work without changing source files.</p>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {error && <p className="admin-form-error" role="alert">{error}</p>}
        <button className="admin-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  )
}

export default AdminLoginPage
