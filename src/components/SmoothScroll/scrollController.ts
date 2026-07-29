import Lenis, { type ScrollToOptions } from 'lenis'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

let activeLenis: Lenis | null = null

export const setActiveLenis = (instance: Lenis | null) => {
  activeLenis = instance
}

export const scrollToTarget = (target: HTMLElement, options: ScrollToOptions = {}) => {
  const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches

  if (activeLenis && !prefersReducedMotion) {
    activeLenis.scrollTo(target, options)
    return
  }

  const top = target.getBoundingClientRect().top + window.scrollY + (options.offset ?? 0)
  window.scrollTo({ top, behavior: 'auto' })
}

export { REDUCED_MOTION_QUERY }
