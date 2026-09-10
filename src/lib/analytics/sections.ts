import { trackEvent } from './trackEvent'

const SECTIONS = ['home', 'about', 'projects', 'contact']
const viewedSections = new Set<string>()
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Attaches an IntersectionObserver to portfolio section elements.
 * Each section is recorded only once per session when meaningfully visible.
 */
export function initSectionTracking(): () => void {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return () => {}
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id
        if (!id || !SECTIONS.includes(id)) return

        if (entry.isIntersecting && !viewedSections.has(id)) {
          if (!pendingTimers.has(id)) {
            const timer = setTimeout(() => {
              pendingTimers.delete(id)
              if (!viewedSections.has(id)) {
                viewedSections.add(id)
                trackEvent('section_view', {
                  section: id,
                  target_id: id,
                  target_label: id.charAt(0).toUpperCase() + id.slice(1),
                })
              }
            }, 500)
            pendingTimers.set(id, timer)
          }
        } else {
          const timer = pendingTimers.get(id)
          if (timer) {
            clearTimeout(timer)
            pendingTimers.delete(id)
          }
        }
      })
    },
    {
      threshold: 0.35,
    },
  )

  SECTIONS.forEach((id) => {
    const el = document.getElementById(id)
    if (el) observer.observe(el)
  })

  return () => {
    pendingTimers.forEach((timer) => clearTimeout(timer))
    pendingTimers.clear()
    observer.disconnect()
  }
}
