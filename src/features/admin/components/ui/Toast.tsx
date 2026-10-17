import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ToastContext, type ToastApi, type ToastTone } from './toastContext'

interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  message?: string
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
        <div className="ad-toasts" role="region" aria-label="Notifications" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`ad-toast ad-toast--${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
              <div className="ad-toast__body">
                <p className="ad-toast__title">{toast.title}</p>
                {toast.message && <p className="ad-toast__message">{toast.message}</p>}
              </div>
              <button type="button" className="ad-toast__close" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">✕</button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
