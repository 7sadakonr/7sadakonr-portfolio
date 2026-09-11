import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Chip, InputGroup } from '@heroui/react'
import { useAdminAuth } from '../auth/useAdminAuth'

const AdminLoginPage = () => {
  const { isAdmin, isLoading, login } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && isAdmin) return <Navigate to="/admin/analytics" replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate('/admin/analytics', { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Invalid email or password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="admin-login-page dark" data-theme="dark">
      <Card className="admin-login-card border border-zinc-800 bg-[#16161b] shadow-2xl p-0">
        <form onSubmit={(event) => void handleSubmit(event)} className="p-8 sm:p-10 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="admin-eyebrow">Back Office</span>
              <Chip size="sm" variant="soft" color="default" className="text-[11px] font-semibold text-zinc-400">
                Authorized Access
              </Chip>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">Sign In</h1>
            <p className="text-xs sm:text-sm text-zinc-400 m-0 leading-relaxed">
              Authenticate to manage portfolio work, site settings, and conversion insights.
            </p>
          </div>

          {error && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title className="text-xs font-bold">Authentication Failed</Alert.Title>
                <Alert.Description className="text-xs">{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          <div className="flex flex-col gap-4">
            <label htmlFor="admin-email" className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
              <span>Email</span>
              <InputGroup className="w-full border border-zinc-700/80 bg-[#181820] focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/25 rounded-xl transition-all">
                <InputGroup.Prefix className="text-zinc-400 pl-3.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </InputGroup.Prefix>
                <InputGroup.Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="text-xs bg-transparent text-white placeholder:text-zinc-400 focus:outline-none"
                />
              </InputGroup>
            </label>

            <label htmlFor="admin-password" className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
              <span>Password</span>
              <InputGroup className="w-full border border-zinc-700/80 bg-[#181820] focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/25 rounded-xl transition-all">
                <InputGroup.Prefix className="text-zinc-400 pl-3.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </InputGroup.Prefix>
                <InputGroup.Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="text-xs bg-transparent text-white placeholder:text-zinc-400 focus:outline-none"
                />
              </InputGroup>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isDisabled={isSubmitting}
            className="admin-button font-bold text-xs cursor-pointer mt-1 py-3 shadow-lg"
          >
            {isSubmitting ? 'Verifying credentials…' : 'Sign In to Dashboard'}
          </Button>

          <p className="text-center text-xs text-zinc-500 m-0">
            <a href="/" className="hover:text-zinc-300 underline transition-colors">
              ← Return to public portfolio
            </a>
          </p>
        </form>
      </Card>
    </main>
  )
}

export default AdminLoginPage
