import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'

interface AdminAuthContextValue {
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

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
      }
    }
    void restore()
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      void hasAdminMembership(session).then((isMember) => {
        if (isActive) {
          setIsAdmin(isMember)
          setIsLoading(false)
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
    },
    logout: async () => {
      if (supabase) await supabase.auth.signOut({ scope: 'local' })
      setIsAdmin(false)
    },
  }), [isAdmin, isLoading])

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export { AdminAuthContext }
