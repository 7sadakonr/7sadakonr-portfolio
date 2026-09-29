import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_EVENTS = new Set([
  'page_view',
  'project_open',
  'resume_download',
])

const MAX_BATCH_SIZE = 20
const MAX_STRING_LEN = 256

function sanitizeString(val: unknown, maxLen = MAX_STRING_LEN): string {
  if (typeof val !== 'string') return ''
  const trimmed = val.trim()
  if (!trimmed) return ''
  return trimmed.slice(0, maxLen)
}

function sanitizeCountry(val: unknown): string {
  if (typeof val !== 'string') return ''
  const trimmed = val.trim().toUpperCase()
  if (!/^[A-Z]{2,8}$/.test(trimmed)) return ''
  return trimmed
}

interface RawEvent {
  event_name?: unknown
  page?: unknown
  project_slug?: unknown
  referrer_host?: unknown
  utm_source?: unknown
  utm_medium?: unknown
  utm_campaign?: unknown
}

interface RawPayload {
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
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.VITE_SUPABASE_SERVICEROLE ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
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

    const rawEvents = Array.isArray(payload.events) ? payload.events : []

    if (rawEvents.length === 0) {
      res.status(204).end()
      return
    }

    if (rawEvents.length > MAX_BATCH_SIZE) {
      res.status(400).json({ error: `Exceeded max batch size of ${MAX_BATCH_SIZE}` })
      return
    }

    // Geolocation from Vercel request headers: Country only, no IP stored
    const countryHeader = Array.isArray(req.headers['x-vercel-ip-country'])
      ? req.headers['x-vercel-ip-country'][0]
      : req.headers['x-vercel-ip-country']
    const country = sanitizeCountry(countryHeader)

    const sanitizedEvents: Array<{
      event_name: string
      page: string
      project_slug: string
      referrer_host: string
      utm_source: string
      utm_medium: string
      utm_campaign: string
    }> = []

    for (const item of rawEvents as RawEvent[]) {
      if (!item || typeof item !== 'object') continue
      const eventName = typeof item.event_name === 'string' && ALLOWED_EVENTS.has(item.event_name)
        ? item.event_name
        : null

      if (!eventName) continue

      sanitizedEvents.push({
        event_name: eventName,
        page: sanitizeString(item.page, 256),
        project_slug: sanitizeString(item.project_slug, 128),
        referrer_host: sanitizeString(item.referrer_host, 128),
        utm_source: sanitizeString(item.utm_source, 128),
        utm_medium: sanitizeString(item.utm_medium, 128),
        utm_campaign: sanitizeString(item.utm_campaign, 128),
      })
    }

    if (sanitizedEvents.length > 0) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })

      const { error } = await supabase.rpc('analytics_record_events', {
        p_events: sanitizedEvents,
        p_country: country,
      })

      if (error) {
        console.error('[Analytics API] Error recording aggregate events:', error.message)
      }
    }

    res.setHeader('X-Analytics-Status', 'ok')
    res.status(204).end()
  } catch (err) {
    console.error('[Analytics API] Unhandled handler error:', err)
    res.status(204).end()
  }
}
