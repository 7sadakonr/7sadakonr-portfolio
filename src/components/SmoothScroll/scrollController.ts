import type Lenis from 'lenis'
import type { ScrollToOptions } from 'lenis'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

let activeLenis: Lenis | null = null
let scrollPaused = false
let wakeLenisRaf: (() => void) | null = null
let stopLenisRaf: (() => void) | null = null

export const setActiveLenis = (instance: Lenis | null) => { activeLenis = instance }
export const setLenisRafWake = (callback: (() => void) | null) => { wakeLenisRaf = callback }
export const setLenisRafStop = (callback: (() => void) | null) => { stopLenisRaf = callback }
export const isScrollPaused = () => scrollPaused

export const scrollToTarget = (target: HTMLElement, options: ScrollToOptions & { onComplete?: () => void } = {}) => {
  const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches
  document.body.style.overflow = 'unset'
  document.documentElement.style.overflow = 'unset'
  resumeScroll()

  if (activeLenis && !prefersReducedMotion) {
    activeLenis.resize()
    activeLenis.scrollTo(target, options)
    wakeLenisRaf?.()
    return
  }

  const top = target.getBoundingClientRect().top + window.scrollY + (options.offset ?? 0)
  window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  if (options.onComplete) setTimeout(options.onComplete, prefersReducedMotion ? 50 : 1000)
}

export const pauseScroll = () => {
  scrollPaused = true
  stopLenisRaf?.()
  activeLenis?.stop()
}

export const resumeScroll = () => {
  scrollPaused = false
  activeLenis?.start()
}

export const cancelScrollAnimation = () => {
  if (!activeLenis) return
  activeLenis.stop()
  if (!scrollPaused) activeLenis.start()
  stopLenisRaf?.()
}

export const triggerResize = () => { activeLenis?.resize() }

export { REDUCED_MOTION_QUERY }
