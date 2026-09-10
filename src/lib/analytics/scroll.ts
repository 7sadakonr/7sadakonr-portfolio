import { trackEvent } from './trackEvent'

const reachedThresholds = new Set<number>()
const THRESHOLDS = [25, 50, 75, 100]

/**
 * Attaches a passive, throttled scroll listener to record scroll depth milestones.
 * Each milestone (25%, 50%, 75%, 100%) fires only once per session.
 */
export function initScrollTracking(): () => void {
  if (typeof window === 'undefined') return () => {}

  let ticking = false

  const checkScroll = () => {
    ticking = false
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    if (docHeight <= 0) return

    const scrollY = window.scrollY || window.pageYOffset
    const percentage = Math.min(100, Math.round((scrollY / docHeight) * 100))

    for (const threshold of THRESHOLDS) {
      if (percentage >= threshold && !reachedThresholds.has(threshold)) {
        reachedThresholds.add(threshold)
        trackEvent('scroll_depth', {
          metadata: { depth_percentage: threshold },
          target_label: `${threshold}%`,
        })
      }
    }
  }

  const handleScroll = () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(checkScroll)
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true })

  return () => {
    window.removeEventListener('scroll', handleScroll)
  }
}
