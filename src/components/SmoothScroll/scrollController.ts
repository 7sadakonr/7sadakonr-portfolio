import type Lenis from 'lenis'
import type { ScrollToOptions } from 'lenis'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

let activeLenis: Lenis | null = null

export const setActiveLenis = (instance: Lenis | null) => {
  activeLenis = instance
}

export const scrollToTarget = (target: HTMLElement, options: ScrollToOptions = {}) => {
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

export { REDUCED_MOTION_QUERY }

