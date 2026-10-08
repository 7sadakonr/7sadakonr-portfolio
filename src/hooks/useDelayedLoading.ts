import { useEffect, useRef, useState } from 'react'

/**
 * Lifecycle of a skeleton placeholder relative to a loading flag:
 * - `pending`  loading just started; mounted but not yet visible (a fast load never reaches `visible`)
 * - `visible`  shown after `delayMs`, held for at least `minVisibleMs`
 * - `leaving`  loading finished; fading out for `exitMs`
 * - `idle`     unmounted
 */
export type SkeletonPhase = 'pending' | 'visible' | 'leaving' | 'idle'

interface SkeletonPresenceOptions {
  delayMs?: number
  minVisibleMs?: number
  exitMs?: number
}

export const useSkeletonPresence = (
  isLoading: boolean,
  { delayMs = 200, minVisibleMs = 400, exitMs = 240 }: SkeletonPresenceOptions = {},
): SkeletonPhase => {
  const [phase, setPhase] = useState<SkeletonPhase>(() => (isLoading ? 'pending' : 'idle'))
  const visibleAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (isLoading) {
      if (phase === 'idle') {
        setPhase('pending')
        return undefined
      }
      if (phase === 'pending') {
        const timeoutId = window.setTimeout(() => {
          visibleAtRef.current = Date.now()
          setPhase('visible')
        }, delayMs)
        return () => window.clearTimeout(timeoutId)
      }
      if (phase === 'leaving') {
        visibleAtRef.current = Date.now()
        setPhase('visible')
      }
      return undefined
    }

    if (phase === 'pending') {
      setPhase('idle')
      return undefined
    }

    if (phase === 'visible') {
      const visibleAt = visibleAtRef.current ?? Date.now()
      const remaining = Math.max(0, minVisibleMs - (Date.now() - visibleAt))
      const timeoutId = window.setTimeout(() => setPhase('leaving'), remaining)
      return () => window.clearTimeout(timeoutId)
    }

    return undefined
  }, [isLoading, phase, delayMs, minVisibleMs])

  useEffect(() => {
    if (phase !== 'leaving') return
    const timeoutId = window.setTimeout(() => {
      visibleAtRef.current = null
      setPhase('idle')
    }, exitMs)
    return () => window.clearTimeout(timeoutId)
  }, [phase, exitMs])

  return phase
}
