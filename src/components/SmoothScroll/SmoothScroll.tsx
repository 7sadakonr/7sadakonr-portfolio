import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { REDUCED_MOTION_QUERY, setActiveLenis } from './scrollController'

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const requestRef = useRef<number | null>(null)

  useEffect(() => {
    let lenis: Lenis | null = null
    let timerId: number | null = null
    const motionPreference = window.matchMedia(REDUCED_MOTION_QUERY)

    const stopAnimation = () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current)
        requestRef.current = null
      }
    }

    const animate = (time: number) => {
      if (!lenis || document.hidden) {
        requestRef.current = null
        return
      }

      lenis.raf(time)
      requestRef.current = requestAnimationFrame(animate)
    }

    const startAnimation = () => {
      if (lenis && !document.hidden && requestRef.current === null) {
        requestRef.current = requestAnimationFrame(animate)
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) stopAnimation()
      else startAnimation()
    }

    const createLenis = () => {
      if (lenis || motionPreference.matches) return

      lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.5,
        touchMultiplier: 1.5,
        syncTouch: false,
      })

      setActiveLenis(lenis)

      startAnimation()
    }

    const destroyLenis = () => {
      stopAnimation()
      lenis?.destroy()
      lenis = null
      setActiveLenis(null)
    }

    const handleMotionPreferenceChange = () => {
      if (motionPreference.matches) destroyLenis()
      else createLenis()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    motionPreference.addEventListener('change', handleMotionPreferenceChange)

    // Defer Lenis initialization until after first paint to improve LCP
    timerId = window.setTimeout(createLenis, 0)

    return () => {
      if (timerId !== null) window.clearTimeout(timerId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      motionPreference.removeEventListener('change', handleMotionPreferenceChange)
      destroyLenis()
    }
  }, [])

  return <>{children}</>
}
