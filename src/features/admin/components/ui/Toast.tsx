import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  message?: string
}

interface ToastApi {
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast must be used inside <ToastProvider>')
  return api
}

const LIFETIME_MS: Record<ToastTone, number> = { success: 4000, info: 4000, error: 8000 }

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback((tone: ToastTone, title: string, message?: string) => {
    const id = nextId.current++
    setToasts((current) => [...current.slice(-3), { id, tone, title, message }])
    timers.current.set(id, setTimeout(() => dismiss(id), LIFETIME_MS[tone]))
  }, [dismiss])

  useEffect(() => {
    const active = timers.current
    return () => active.forEach((timer) => clearTimeout(timer))
  }, [])

  const api = useMemo<ToastApi>(() => ({
    success: (title, message) => push('success', title, message),
    error: (title, message) => push('error', title, message),
    info: (title, message) => push('info', title, message),
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="adm-toasts" role="region" aria-label="Notifications" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`adm-toast adm-toast--${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
              <div className="adm-toast__body">
                <p className="adm-toast__title">{toast.title}</p>
                {toast.message && <p className="adm-toast__message">{toast.message}</p>}
              </div>
              <button type="button" className="adm-toast__close" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">✕</button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
