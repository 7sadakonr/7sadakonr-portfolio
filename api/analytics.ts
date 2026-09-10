import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_EVENTS = new Set([
  'page_view',
  'section_view',
  'scroll_depth',
  'project_open',
  'project_github_click',
  'project_demo_click',
  'resume_download',
  'contact_click',
  'email_click',
  'linkedin_click',
  'github_profile_click',
  'navbar_click',
  'external_link_click',
])

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_BATCH_SIZE = 50
const MAX_STRING_LEN = 500

function sanitizeString(val: unknown, maxLen = MAX_STRING_LEN): string | null {
  if (typeof val !== 'string') return null
  const trimmed = val.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLen)
}

function parseUserAgent(ua: string | undefined): { device_type: string; browser: string; os: string } {
  if (!ua) return { device_type: 'desktop', browser: 'Unknown', os: 'Unknown' }
  const uaLower = ua.toLowerCase()
  let device_type = 'desktop'
  if (/mobile|android|iphone|ipod|phone/i.test(uaLower)) device_type = 'mobile'
  else if (/ipad|tablet/i.test(uaLower)) device_type = 'tablet'

  let browser = 'Other'
  if (/edg\//i.test(ua)) browser = 'Edge'
  else if (/chrome|crios/i.test(ua) && !/edg\//i.test(ua)) browser = 'Chrome'
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari'
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox'
  else if (/opr\//i.test(ua)) browser = 'Opera'

  let os = 'Other'
  if (/windows/i.test(ua)) os = 'Windows'
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS'
  else if (/linux/i.test(ua)) os = 'Linux'

  return { device_type, browser, os }
}

interface RawEvent {
  event_id?: unknown
  event_name?: unknown
  page?: unknown
  section?: unknown
  target_type?: unknown
  target_id?: unknown
  target_label?: unknown
  project_slug?: unknown
  destination_host?: unknown
  metadata?: unknown
}

interface RawPayload {
  session_id?: unknown
  visitor_id?: unknown
  landing_path?: unknown
  referrer_host?: unknown
  utm_source?: unknown
  utm_medium?: unknown
  utm_campaign?: unknown
  events?: unknown
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Set security & CORS headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  const origin = req.headers.origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[Analytics API] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.')
    res.setHeader('X-Analytics-Status', 'missing-credentials')
    res.status(204).end()
    return
  }

  try {
    let payload: RawPayload = req.body
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload) as RawPayload
      } catch {
        res.status(400).json({ error: 'Invalid JSON' })
        return
      }
    }

    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Invalid payload' })
      return
    }

    const sessionId = typeof payload.session_id === 'string' && UUID_REGEX.test(payload.session_id) ? payload.session_id : null
    const visitorId = typeof payload.visitor_id === 'string' && UUID_REGEX.test(payload.visitor_id) ? payload.visitor_id : null

    if (!sessionId || !visitorId) {
      res.status(400).json({ error: 'Invalid session_id or visitor_id' })
      return
    }

    const rawEvents = Array.isArray(payload.events) ? payload.events : []
    if (rawEvents.length === 0) {
      res.status(204).end()
      return
    }

    if (rawEvents.length > MAX_BATCH_SIZE) {
      res.status(400).json({ error: `Exceeded max batch size of ${MAX_BATCH_SIZE}` })
      return
    }

    // Geolocation from Vercel request headers (optional, never store IP)
    const country = sanitizeString(req.headers['x-vercel-ip-country'], 64)
    const region = sanitizeString(req.headers['x-vercel-ip-country-region'], 64)
    const city = sanitizeString(req.headers['x-vercel-ip-city'], 128)

    const uaHeader = Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent']
    const uaInfo = parseUserAgent(uaHeader)

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })

    const nowIso = new Date().toISOString()

    // 1. Upsert session
    const { error: sessionError } = await supabase.from('analytics_sessions').upsert(
      {
        session_id: sessionId,
        visitor_id: visitorId,
        landing_path: sanitizeString(payload.landing_path),
        referrer_host: sanitizeString(payload.referrer_host),
        utm_source: sanitizeString(payload.utm_source, 128),
        utm_medium: sanitizeString(payload.utm_medium, 128),
        utm_campaign: sanitizeString(payload.utm_campaign, 128),
        country,
        region,
        city,
        device_type: uaInfo.device_type,
        browser: uaInfo.browser,
        os: uaInfo.os,
        last_seen_at: nowIso,
      },
      { onConflict: 'session_id' },
    )
    if (sessionError) {
      console.error('[Analytics API] Session upsert error:', sessionError.message)
    }

    // 2. Validate & prepare events
    const sanitizedEvents: Array<{
      event_id: string
      session_id: string
      visitor_id: string
      event_name: string
      page: string | null
      section: string | null
      target_type: string | null
      target_id: string | null
      target_label: string | null
      project_slug: string | null
      destination_host: string | null
      metadata: Record<string, unknown> | null
      created_at: string
    }> = []

    for (const item of rawEvents as RawEvent[]) {
      if (!item || typeof item !== 'object') continue
      const eventId = typeof item.event_id === 'string' && UUID_REGEX.test(item.event_id) ? item.event_id : null
      const eventName = typeof item.event_name === 'string' && ALLOWED_EVENTS.has(item.event_name) ? item.event_name : null

      if (!eventId || !eventName) continue

      sanitizedEvents.push({
        event_id: eventId,
        session_id: sessionId,
        visitor_id: visitorId,
        event_name: eventName,
        page: sanitizeString(item.page),
        section: sanitizeString(item.section, 64),
        target_type: sanitizeString(item.target_type, 64),
        target_id: sanitizeString(item.target_id, 128),
        target_label: sanitizeString(item.target_label, 256),
        project_slug: sanitizeString(item.project_slug, 128),
        destination_host: sanitizeString(item.destination_host, 128),
        metadata: item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
          ? (item.metadata as Record<string, unknown>)
          : null,
        created_at: nowIso,
      })
    }

    if (sanitizedEvents.length > 0) {
      const { error: eventsError } = await supabase.from('analytics_events').upsert(sanitizedEvents, {
        onConflict: 'event_id',
        ignoreDuplicates: true,
      })
      if (eventsError) {
        console.error('[Analytics API] Events upsert error:', eventsError.message)
      }
    }

    res.setHeader('X-Analytics-Status', 'ok')
    res.status(204).end()
  } catch (err) {
    console.error('[Analytics API] Unhandled handler error:', err)
    res.status(204).end()
  }
}
