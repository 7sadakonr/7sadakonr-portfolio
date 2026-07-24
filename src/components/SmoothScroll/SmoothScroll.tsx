import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

export let lenisInstance: Lenis | null = null

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const requestRef = useRef<number>()

  useEffect(() => {
    let lenis: Lenis;
    
    // Defer Lenis initialization until after first paint to improve LCP
    const timerId = setTimeout(() => {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        touchMultiplier: 2,
      })

      lenisRef.current = lenis
      lenisInstance = lenis

      const animate = (time: number) => {
        lenis.raf(time)
        requestRef.current = requestAnimationFrame(animate)
      }
      requestRef.current = requestAnimationFrame(animate)
    }, 0)

    return () => {
      clearTimeout(timerId)
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      if (lenis) {
        lenis.destroy()
      }
      lenisInstance = null
    }
  }, [])

  return <>{children}</>
}
