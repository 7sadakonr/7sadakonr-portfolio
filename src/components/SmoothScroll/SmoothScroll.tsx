import { useCallback, useEffect, useRef } from 'react'
import { loadLenis, type LenisInstance } from '../../utils/runtimeWarmup'
import { scheduleIdleWork } from '../../utils/runtimeScheduler'
import { REDUCED_MOTION_QUERY, setActiveLenis } from './scrollController'

interface SmoothScrollProps {
  children: React.ReactNode
  isPrepared: boolean
  isEnabled: boolean
  allowIdleLoad?: boolean
}

export default function SmoothScroll({ children, isPrepared, isEnabled, allowIdleLoad = false }: SmoothScrollProps) {
  const requestRef = useRef<number | null>(null)
  const lenisRef = useRef<LenisInstance | null>(null)
  const isLoadingRef = useRef(false)
  const loadGenerationRef = useRef(0)
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
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!isPrepared || !hasFinePointer) return

    let cancelled = false
    let cancelIdleWork: (() => void) | undefined
    const requestLenis = () => {
      if (cancelled || isLoadingRef.current || lenisRef.current || window.matchMedia(REDUCED_MOTION_QUERY).matches) return

      isLoadingRef.current = true
      const generation = ++loadGenerationRef.current
      void loadLenis().then(({ default: Lenis }) => {
        if (cancelled || generation !== loadGenerationRef.current || window.matchMedia(REDUCED_MOTION_QUERY).matches || lenisRef.current) {
          if (!lenisRef.current) isLoadingRef.current = false
          return
        }

        const scrollPosition = window.scrollY
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
        lenis.resize()
        lenis.scrollTo(scrollPosition, { immediate: true, force: true })
        lenisRef.current = lenis
        isLoadingRef.current = false
        setActiveLenis(lenis)
        syncActivity()
      }).catch(() => {
        if (generation === loadGenerationRef.current) isLoadingRef.current = false
      })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) requestLenis()
    }

    window.addEventListener('wheel', requestLenis, { passive: true, once: true })
    window.addEventListener('keydown', handleKeyDown, { passive: true })
    if (allowIdleLoad) cancelIdleWork = scheduleIdleWork(requestLenis)

    return () => {
      cancelled = true
      loadGenerationRef.current += 1
      if (!lenisRef.current) isLoadingRef.current = false
      cancelIdleWork?.()
      window.removeEventListener('wheel', requestLenis)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [allowIdleLoad, isPrepared, syncActivity])

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

    const handleUserInteraction = () => {
      import('../../features/navigation/navigationState').then(({ isNavigationInProgress, resetNavigation }) => {
        if (isNavigationInProgress()) {
          import('./scrollController').then(({ cancelScrollAnimation }) => {
            cancelScrollAnimation()
            resetNavigation()
          })
        }
      })
    }
    const handlePointerDown = (e: PointerEvent) => {
      if (e.clientX >= document.documentElement.clientWidth - 20) {
        handleUserInteraction()
      }
    }
    window.addEventListener('wheel', handleUserInteraction, { passive: true })
    window.addEventListener('touchstart', handleUserInteraction, { passive: true })
    window.addEventListener('keydown', handleUserInteraction, { passive: true })
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })

    return () => {
      document.removeEventListener('visibilitychange', syncActivity)
      motionPreference.removeEventListener('change', handleMotionPreferenceChange)
      window.removeEventListener('wheel', handleUserInteraction)
      window.removeEventListener('touchstart', handleUserInteraction)
      window.removeEventListener('keydown', handleUserInteraction)
      window.removeEventListener('pointerdown', handlePointerDown)
      motionPreferenceRef.current = null
      destroyLenis()
    }
  }, [stopAnimation, syncActivity])

  return <>{children}</>
}
