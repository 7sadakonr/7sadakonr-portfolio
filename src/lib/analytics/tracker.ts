export interface EventPayload {
  event_name: 'page_view' | 'project_open' | 'resume_download'
  page?: string
  project_slug?: string
  referrer_host?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  [key: string]: unknown
}

interface QueuedEvent {
  event_name: string
  page: string
  project_slug?: string
  referrer_host?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

const ADMIN_OPT_OUT_KEY = 'portfolio_admin_opt_out'
const FLUSH_INTERVAL_MS = 1500
const ENDPOINT = '/api/analytics'

const ALLOWED_EVENTS = new Set([
  'page_view',
  'project_open',
  'resume_download',
])

const IMMEDIATE_EVENTS = new Set([
  'page_view',
  'project_open',
  'resume_download',
])

let eventQueue: QueuedEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let isInitialized = false

export function isAdminOptOut(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (window.location && typeof window.location.pathname === 'string' && window.location.pathname.startsWith('/admin')) {
      return true
    }
    if (localStorage.getItem(ADMIN_OPT_OUT_KEY) === 'true') {
      return true
    }
  } catch {
    // Ignore storage/location access errors
  }
  return false
}

export function setAdminOptOut(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (enabled) {
      localStorage.setItem(ADMIN_OPT_OUT_KEY, 'true')
      if (flushTimer) {
        clearTimeout(flushTimer)
        flushTimer = null
      }
      eventQueue = []
      isInitialized = false
    } else {
      localStorage.removeItem(ADMIN_OPT_OUT_KEY)
    }
  } catch {
    // Ignore storage access errors
  }
}

function parseHost(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function cleanupLegacyIdentifiers(): void {
  try {
    localStorage.removeItem('portfolio_visitor_id')
    localStorage.removeItem('portfolio_session_meta')
  } catch {
    // Ignore storage errors
  }
}

function flush(isExiting = false): void {
  if (isAdminOptOut()) {
    eventQueue = []
    return
  }

  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }

  if (eventQueue.length === 0) return

  const eventsToSend = eventQueue.slice(0, 20)
  eventQueue = eventQueue.slice(eventsToSend.length)

  const payload = JSON.stringify({
    events: eventsToSend,
  })

  if (isExiting && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([payload], { type: 'application/json' })
      const sent = navigator.sendBeacon(ENDPOINT, blob)
      if (sent) return
    } catch {
      // Fall through to fetch
    }
  }

  if (typeof fetch === 'function') {
    try {
      void fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Fail silently
      })
    } catch {
      // Fail silently
    }
  }
}

function scheduleFlush(): void {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush()
  }, FLUSH_INTERVAL_MS)
}

/**
 * Public function to enqueue aggregate events.
 * Accepts only allowed aggregate metrics: 'page_view', 'project_open', 'resume_download'.
 */
export function trackEvent(name: string, payload: Partial<EventPayload> = {}): void {
  if (isAdminOptOut()) return
  if (!ALLOWED_EVENTS.has(name)) return

  try {
    const page = payload.page || (typeof window !== 'undefined' ? window.location.pathname || '/' : '/')
    let referrerHost: string | undefined
    let utmSource: string | undefined
    let utmMedium: string | undefined
    let utmCampaign: string | undefined

    if (name === 'page_view' && typeof window !== 'undefined') {
      try {
        if (document.referrer) {
          const ref = parseHost(document.referrer)
          const currentHost = window.location.hostname.replace(/^www\./, '')
          if (ref && ref !== currentHost) {
            referrerHost = ref
          }
        }
      } catch {
        // Ignore referrer parsing errors
      }

      try {
        const params = new URLSearchParams(window.location.search)
        utmSource = params.get('utm_source') || undefined
        utmMedium = params.get('utm_medium') || undefined
        utmCampaign = params.get('utm_campaign') || undefined
      } catch {
        // Ignore URL parsing errors
      }
    }

    const event: QueuedEvent = {
      event_name: name,
      page,
      project_slug: payload.project_slug,
      referrer_host: payload.referrer_host || referrerHost,
      utm_source: payload.utm_source || utmSource,
      utm_medium: payload.utm_medium || utmMedium,
      utm_campaign: payload.utm_campaign || utmCampaign,
    }

    eventQueue.push(event)

    if (IMMEDIATE_EVENTS.has(name) || eventQueue.length >= 5) {
      flush()
    } else {
      scheduleFlush()
    }
  } catch {
    // Fail silently
  }
}

/**
 * Initialize tracker once. Purges any legacy visitor/session IDs and tracks landing page_view.
 */
export function initAnalytics(): void {
  if (isAdminOptOut()) return
  if (isInitialized || typeof window === 'undefined') return
  isInitialized = true

  try {
    // Purge any legacy visitor/session identifiers
    cleanupLegacyIdentifiers()

    // Track landing page view
    trackEvent('page_view', {
      page: window.location.pathname || '/',
    })

    // Listeners for flush on exit
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flush(true)
      }
    }

    const handlePageHide = () => {
      flush(true)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
  } catch {
    // Non-critical: fail silently
  }
}

export function _resetAnalyticsForTesting(): void {
  isInitialized = false
  eventQueue = []
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
}
