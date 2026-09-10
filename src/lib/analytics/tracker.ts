import { createUuid } from '../../utils/createUuid'

export interface EventPayload {
  event_name: string
  page?: string
  section?: string
  target_type?: string
  target_id?: string
  target_label?: string
  project_slug?: string
  destination_host?: string
  metadata?: Record<string, unknown>
}

interface QueuedEvent extends EventPayload {
  event_id: string
  created_at: string
}

const VISITOR_KEY = 'portfolio_visitor_id'
const SESSION_KEY = 'portfolio_session_meta'
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const FLUSH_BATCH_SIZE = 5
const FLUSH_INTERVAL_MS = 3000
const ENDPOINT = '/api/analytics'

const IMMEDIATE_EVENTS = new Set([
  'project_open',
  'project_demo_click',
  'project_github_click',
  'resume_download',
  'contact_click',
  'email_click',
  'linkedin_click',
  'github_profile_click',
])

let eventQueue: QueuedEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let isInitialized = false

// Cached session state
let currentVisitorId = ''
let currentSessionId = ''
let currentLandingPath = ''
let currentReferrerHost = ''
let currentUtmSource = ''
let currentUtmMedium = ''
let currentUtmCampaign = ''

function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY)
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
      return existing
    }
    const newId = createUuid()
    localStorage.setItem(VISITOR_KEY, newId)
    return newId
  } catch {
    return createUuid()
  }
}

interface SessionMeta {
  sessionId: string
  lastSeen: number
  landingPath: string
  referrerHost: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
}

function parseHost(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function initSession(): void {
  const now = Date.now()
  let meta: SessionMeta | null = null

  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      meta = JSON.parse(raw) as SessionMeta
    }
  } catch {
    meta = null
  }

  // Parse UTM params from current URL
  let utmSource = ''
  let utmMedium = ''
  let utmCampaign = ''
  try {
    const params = new URLSearchParams(window.location.search)
    utmSource = params.get('utm_source') ?? ''
    utmMedium = params.get('utm_medium') ?? ''
    utmCampaign = params.get('utm_campaign') ?? ''
  } catch {
    // Ignore URL parsing errors
  }

  // Determine referrer host
  let referrerHost = ''
  try {
    if (document.referrer) {
      const refHost = parseHost(document.referrer)
      if (refHost && refHost !== window.location.hostname.replace(/^www\./, '')) {
        referrerHost = refHost
      }
    }
  } catch {
    // Ignore referrer parsing errors
  }

  const isExpired = !meta || !meta.lastSeen || now - meta.lastSeen > SESSION_TIMEOUT_MS

  if (isExpired || !meta?.sessionId) {
    currentSessionId = createUuid()
    currentLandingPath = window.location.pathname || '/'
    currentReferrerHost = referrerHost
    currentUtmSource = utmSource
    currentUtmMedium = utmMedium
    currentUtmCampaign = utmCampaign
  } else {
    currentSessionId = meta.sessionId
    currentLandingPath = meta.landingPath || window.location.pathname || '/'
    currentReferrerHost = meta.referrerHost || referrerHost
    currentUtmSource = utmSource || meta.utmSource || ''
    currentUtmMedium = utmMedium || meta.utmMedium || ''
    currentUtmCampaign = utmCampaign || meta.utmCampaign || ''
  }

  saveSessionMeta(now)
}

function saveSessionMeta(timestamp: number): void {
  try {
    const meta: SessionMeta = {
      sessionId: currentSessionId,
      lastSeen: timestamp,
      landingPath: currentLandingPath,
      referrerHost: currentReferrerHost,
      utmSource: currentUtmSource,
      utmMedium: currentUtmMedium,
      utmCampaign: currentUtmCampaign,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(meta))
  } catch {
    // Local storage unavailable (e.g. strict private browsing)
  }
}

function touchSession(): void {
  const now = Date.now()
  saveSessionMeta(now)
}

function flush(isExiting = false): void {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }

  if (eventQueue.length === 0) return

  const eventsToSend = eventQueue.slice(0, 50)
  eventQueue = eventQueue.slice(eventsToSend.length)

  const payload = JSON.stringify({
    session_id: currentSessionId,
    visitor_id: currentVisitorId,
    landing_path: currentLandingPath,
    referrer_host: currentReferrerHost,
    utm_source: currentUtmSource || undefined,
    utm_medium: currentUtmMedium || undefined,
    utm_campaign: currentUtmCampaign || undefined,
    events: eventsToSend,
  })

  touchSession()

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
 * Public function to enqueue custom events. Fire-and-forget, never throws.
 */
export function trackEvent(name: string, payload: Partial<EventPayload> = {}): void {
  if (!isInitialized) {
    // If called before idle init, initialize synchronously without blocking
    initAnalytics()
  }

  try {
    const event: QueuedEvent = {
      event_id: createUuid(),
      event_name: name,
      page: payload.page || window.location.pathname || '/',
      section: payload.section,
      target_type: payload.target_type,
      target_id: payload.target_id,
      target_label: payload.target_label,
      project_slug: payload.project_slug,
      destination_host: payload.destination_host,
      metadata: payload.metadata,
      created_at: new Date().toISOString(),
    }

    eventQueue.push(event)

    if (IMMEDIATE_EVENTS.has(name) || eventQueue.length >= FLUSH_BATCH_SIZE) {
      flush()
    } else {
      scheduleFlush()
    }
  } catch {
    // Fail silently
  }
}

/**
 * Initialize tracker once. Sets up session, exit handlers.
 */
export function initAnalytics(): void {
  if (isInitialized || typeof window === 'undefined') return
  isInitialized = true

  try {
    currentVisitorId = getOrCreateVisitorId()
    initSession()

    // Enqueue landing page view for custom journey tracking
    trackEvent('page_view', {
      page: window.location.pathname || '/',
      metadata: {
        title: document.title,
      },
    })

    // Quickly flush initial landing events so session and visitor register immediately
    setTimeout(() => {
      flush()
    }, 1000)

    // Exit flush listeners
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
  currentVisitorId = ''
  currentSessionId = ''
  currentLandingPath = ''
  currentReferrerHost = ''
  currentUtmSource = ''
  currentUtmMedium = ''
  currentUtmCampaign = ''
}

