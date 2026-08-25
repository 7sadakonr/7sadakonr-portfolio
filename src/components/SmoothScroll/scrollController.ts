import type Lenis from 'lenis'
import type { ScrollToOptions } from 'lenis'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

let activeLenis: Lenis | null = null

export const setActiveLenis = (instance: Lenis | null) => {
  activeLenis = instance
}

export const scrollToTarget = (target: HTMLElement, options: ScrollToOptions & { onComplete?: () => void } = {}) => {
  const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches

  // Ensure scroll is active and not stopped by modals or overlays
  document.body.style.overflow = 'unset'
  document.documentElement.style.overflow = 'unset'
  resumeScroll()

  if (activeLenis && !prefersReducedMotion) {
    activeLenis.resize()
    activeLenis.scrollTo(target, options)
    return
  }

  const top = target.getBoundingClientRect().top + window.scrollY + (options.offset ?? 0)
  window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  if (options.onComplete) {
    setTimeout(options.onComplete, prefersReducedMotion ? 50 : 1000)
  }
}

export const pauseScroll = () => {
  if (activeLenis) {
    activeLenis.stop()
  }
}

export const resumeScroll = () => {
  if (activeLenis) {
    activeLenis.start()
  }
}

export const cancelScrollAnimation = () => {
  if (activeLenis) {
    activeLenis.stop()
    activeLenis.start()
  }
}

export const triggerResize = () => {
  if (activeLenis) {
    activeLenis.resize()
  }
}

export { REDUCED_MOTION_QUERY }
