import type Lenis from 'lenis'
import type { ScrollToOptions } from 'lenis'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const NATIVE_SCROLL_COMPLETE_DELAY = 1000

export type ScrollTargetOptions = ScrollToOptions & { onComplete?: () => void }

let activeLenis: Lenis | null = null
const scrollLocks = new Set<symbol>()
let savedOverflow: { body: string; document: string } | null = null
let completionTimer: number | undefined
let wakeLenisRaf: (() => void) | null = null
let stopLenisRaf: (() => void) | null = null

const clearCompletionTimer = () => {
  if (completionTimer === undefined) return
  window.clearTimeout(completionTimer)
  completionTimer = undefined
}

export const scrollToTarget = (target: HTMLElement, options: ScrollTargetOptions = {}) => {
  const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches
  clearCompletionTimer()

  if (scrollLocks.size > 0) return
  if (activeLenis && !prefersReducedMotion) {
    activeLenis.resize()
    activeLenis.scrollTo(target, options)
    wakeLenisRaf?.()
    return
  }

  const top = target.getBoundingClientRect().top + window.scrollY + (options.offset ?? 0)
  window.scrollTo({ top, behavior: options.immediate || prefersReducedMotion ? 'auto' : 'smooth' })
  if (options.onComplete) completionTimer = window.setTimeout(options.onComplete, options.immediate || prefersReducedMotion ? 50 : NATIVE_SCROLL_COMPLETE_DELAY)
}

export const setActiveLenis = (instance: Lenis | null) => { activeLenis = instance }
export const setLenisRafWake = (callback: (() => void) | null) => { wakeLenisRaf = callback }
export const setLenisRafStop = (callback: (() => void) | null) => { stopLenisRaf = callback }
export const isScrollPaused = () => scrollLocks.size > 0

export const acquireScrollLock = () => {
  const lock = Symbol('scroll lock')
  if (scrollLocks.size === 0) {
    savedOverflow = {
      body: document.body.style.overflow,
      document: document.documentElement.style.overflow,
    }
  }
  scrollLocks.add(lock)
  stopLenisRaf?.()
  activeLenis?.stop()
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
  return () => {
    if (!scrollLocks.delete(lock) || scrollLocks.size !== 0 || !savedOverflow) return
    document.body.style.overflow = savedOverflow.body
    document.documentElement.style.overflow = savedOverflow.document
    savedOverflow = null
    activeLenis?.start()
    wakeLenisRaf?.()
  }
}

export const cancelScrollAnimation = () => {
  clearCompletionTimer()
  if (activeLenis) {
    activeLenis.stop()
    if (scrollLocks.size === 0) activeLenis.start()
    stopLenisRaf?.()
    return
  }
  window.scrollTo({ top: window.scrollY, behavior: 'auto' })
}

export const triggerResize = () => { activeLenis?.resize() }

export { REDUCED_MOTION_QUERY }
