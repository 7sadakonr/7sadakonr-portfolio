import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { setAdminOptOut } from '../../../lib/analytics/tracker'

interface AdminAuthContextValue {
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

const syncAdminExclusion = async () => {
  setAdminOptOut(true)
  if (!supabase || typeof window === 'undefined') return
  try {
    const visitorId = localStorage.getItem('portfolio_visitor_id')
    if (visitorId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visitorId)) {
      await supabase.rpc('analytics_exclude_admin_visitor', { p_visitor_id: visitorId })
    }
  } catch {
    // Ignore RPC failure if migration is pending
  }
}

const hasAdminMembership = async (session: Session | null) => {
  if (!supabase || !session) return false
  const { data, error } = await supabase
    .from('portfolio_admins')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle()
  return !error && data !== null
}

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setIsLoading(false)
      return
    }

    let isActive = true
    const restore = async () => {
      const { data } = await client.auth.getSession()
      const isMember = await hasAdminMembership(data.session)
      if (isActive) {
        setIsAdmin(isMember)
        setIsLoading(false)
        if (isMember) {
          void syncAdminExclusion()
        }
      }
    }
    void restore()
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      void hasAdminMembership(session).then((isMember) => {
        if (isActive) {
          setIsAdmin(isMember)
          setIsLoading(false)
          if (isMember) {
            void syncAdminExclusion()
          }
        }
      })
    })
    return () => {
      isActive = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AdminAuthContextValue>(() => ({
    isLoading,
    isAdmin,
    login: async (email, password) => {
      if (!supabase) throw new Error('Admin login is not configured.')
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error || !(await hasAdminMembership(data.session))) {
        await supabase.auth.signOut({ scope: 'local' })
        throw new Error('Invalid email or password')
      }
      setIsAdmin(true)
      void syncAdminExclusion()
    },
    logout: async () => {
      setAdminOptOut(false)
      if (supabase) await supabase.auth.signOut({ scope: 'local' })
      setIsAdmin(false)
    },
  }), [isAdmin, isLoading])

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export { AdminAuthContext }
