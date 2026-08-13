import { useCallback, useEffect, useRef } from 'react'
import { loadLenis, type LenisInstance } from '../../utils/runtimeWarmup'
import { REDUCED_MOTION_QUERY, setActiveLenis } from './scrollController'

interface SmoothScrollProps {
  children: React.ReactNode
  isPrepared: boolean
  isEnabled: boolean
}

export default function SmoothScroll({ children, isPrepared, isEnabled }: SmoothScrollProps) {
  const requestRef = useRef<number | null>(null)
  const lenisRef = useRef<LenisInstance | null>(null)
  const enabledRef = useRef(isEnabled)
  const motionPreferenceRef = useRef<MediaQueryList | null>(null)

  const stopAnimation = useCallback(() => {
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current)
      requestRef.current = null
    }
  }, [])

  const syncActivity = useCallback(() => {
    const lenis = lenisRef.current
    const motionPreference = motionPreferenceRef.current
    if (!lenis || !motionPreference) return

    if (!enabledRef.current || document.hidden || motionPreference.matches) {
      stopAnimation()
      lenis.stop()
      return
    }

    lenis.start()
    if (requestRef.current !== null) return

    const animate = (time: number) => {
      const currentLenis = lenisRef.current
      if (!currentLenis || document.hidden || !enabledRef.current || motionPreference.matches) {
        requestRef.current = null
        return
      }
      currentLenis.raf(time)
      requestRef.current = requestAnimationFrame(animate)
    }
    requestRef.current = requestAnimationFrame(animate)
  }, [stopAnimation])

  useEffect(() => {
    enabledRef.current = isEnabled
    syncActivity()
  }, [isEnabled, syncActivity])

  useEffect(() => {
    if (!isPrepared || lenisRef.current || motionPreferenceRef.current?.matches) return

    let disposed = false
    void loadLenis().then(({ default: Lenis }) => {
      if (disposed || motionPreferenceRef.current?.matches || lenisRef.current) return

      const lenis = new Lenis({
        duration: 1.5,
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
      syncActivity()
    })

    return () => {
      disposed = true
    }
  }, [isPrepared, syncActivity])

  useEffect(() => {
    const motionPreference = window.matchMedia(REDUCED_MOTION_QUERY)
    motionPreferenceRef.current = motionPreference
    const destroyLenis = () => {
      stopAnimation()
      lenisRef.current?.destroy()
      lenisRef.current = null
      setActiveLenis(null)
    }
    const handleMotionPreferenceChange = () => {
      if (motionPreference.matches) destroyLenis()
      else syncActivity()
    }

    document.addEventListener('visibilitychange', syncActivity)
    motionPreference.addEventListener('change', handleMotionPreferenceChange)

    return () => {
      document.removeEventListener('visibilitychange', syncActivity)
      motionPreference.removeEventListener('change', handleMotionPreferenceChange)
      motionPreferenceRef.current = null
      destroyLenis()
    }
  }, [stopAnimation, syncActivity])

  return <>{children}</>
}
