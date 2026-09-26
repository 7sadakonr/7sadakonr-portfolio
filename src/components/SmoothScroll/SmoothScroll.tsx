import { useCallback, useEffect, useRef } from 'react'
import { loadLenis, type LenisInstance } from '../../utils/runtimeWarmup'
import {
  REDUCED_MOTION_QUERY,
  cancelScrollAnimation,
  isScrollPaused,
  setActiveLenis,
  setLenisRafStop,
  setLenisRafWake,
} from './scrollController'
import { isNavigationInProgress, resetNavigation } from '../../features/navigation/navigationState'

interface SmoothScrollProps {
  children: React.ReactNode
  isPrepared: boolean
  isEnabled: boolean
}

export default function SmoothScroll({ children, isPrepared, isEnabled }: SmoothScrollProps) {
  const requestRef = useRef<number | null>(null)
  const lenisRef = useRef<LenisInstance | null>(null)
  const enabledRef = useRef(isEnabled)
  const preparedRef = useRef(isPrepared)
  const motionPreferenceRef = useRef<MediaQueryList | null>(null)
  const tickRef = useRef<(time: number) => void>(() => undefined)

  const stopRafLoop = useCallback(() => {
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current)
      requestRef.current = null
    }
  }, [])

  const canAnimate = useCallback(() => Boolean(
    lenisRef.current
    && enabledRef.current
    && !document.hidden
    && !motionPreferenceRef.current?.matches
    && !isScrollPaused(),
  ), [])

  const startRafLoop = useCallback(() => {
    if (requestRef.current !== null || !canAnimate()) return
    requestRef.current = requestAnimationFrame(tickRef.current)
  }, [canAnimate])

  const wakeLenis = useCallback(() => {
    const lenis = lenisRef.current
    if (!lenis || !canAnimate() || lenis.isStopped || lenis.isScrolling !== 'smooth') return

    // Lenis retains the external RAF timestamp; reset it after a sleeping period
    // so the first active frame does not advance by the entire idle duration.
    if (requestRef.current === null) lenis.time = 0
    startRafLoop()
  }, [canAnimate, startRafLoop])

  tickRef.current = (time) => {
    const lenis = lenisRef.current
    requestRef.current = null
    if (!lenis || !canAnimate() || lenis.isStopped) {
      stopRafLoop()
      return
    }

    lenis.raf(time)
    if (lenis.isScrolling === 'smooth') startRafLoop()
  }

  const syncAvailability = useCallback(() => {
    const lenis = lenisRef.current
    if (!lenis) return
    if (!canAnimate()) {
      stopRafLoop()
      lenis.stop()
      return
    }
    lenis.start()
  }, [canAnimate, stopRafLoop])

  useEffect(() => {
    enabledRef.current = isEnabled
    syncAvailability()
  }, [isEnabled, syncAvailability])

  const initializeLenis = useCallback(() => {
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!preparedRef.current || !hasFinePointer || lenisRef.current || motionPreferenceRef.current?.matches) return

    let disposed = false
    void loadLenis().then(({ default: Lenis }) => {
      if (disposed || motionPreferenceRef.current?.matches || lenisRef.current) return
      const lenis = new Lenis({
        duration: 0.9,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.5,
        touchMultiplier: 1.5,
        syncTouch: false,
      })
      lenisRef.current = lenis
      setActiveLenis(lenis)
      syncAvailability()
    })

    return () => { disposed = true }
  }, [syncAvailability])

  useEffect(() => {
    preparedRef.current = isPrepared
    return initializeLenis()
  }, [initializeLenis, isPrepared])

  useEffect(() => {
    const motionPreference = window.matchMedia(REDUCED_MOTION_QUERY)
    motionPreferenceRef.current = motionPreference
    const destroyLenis = () => {
      stopRafLoop()
      lenisRef.current?.destroy()
      lenisRef.current = null
      setActiveLenis(null)
    }
    const handleMotionPreferenceChange = () => {
      if (motionPreference.matches) destroyLenis()
      else initializeLenis()
    }
    const handleUserInteraction = () => {
      wakeLenis()
      if (!isNavigationInProgress()) return
      cancelScrollAnimation()
      resetNavigation()
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (event.clientX >= document.documentElement.clientWidth - 20) handleUserInteraction()
    }

    setLenisRafWake(wakeLenis)
    setLenisRafStop(stopRafLoop)
    document.addEventListener('visibilitychange', syncAvailability)
    motionPreference.addEventListener('change', handleMotionPreferenceChange)
    window.addEventListener('wheel', handleUserInteraction, { passive: true })
    window.addEventListener('touchstart', handleUserInteraction, { passive: true })
    window.addEventListener('keydown', handleUserInteraction, { passive: true })
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })

    return () => {
      document.removeEventListener('visibilitychange', syncAvailability)
      motionPreference.removeEventListener('change', handleMotionPreferenceChange)
      window.removeEventListener('wheel', handleUserInteraction)
      window.removeEventListener('touchstart', handleUserInteraction)
      window.removeEventListener('keydown', handleUserInteraction)
      window.removeEventListener('pointerdown', handlePointerDown)
      setLenisRafWake(null)
      setLenisRafStop(null)
      motionPreferenceRef.current = null
      destroyLenis()
    }
  }, [initializeLenis, stopRafLoop, syncAvailability, wakeLenis])

  return <>{children}</>
}
