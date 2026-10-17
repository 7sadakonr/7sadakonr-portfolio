import type { SupabaseClient } from '@supabase/supabase-js'
import type { RangeKey } from './analyticsTime'
import type { SectionErrors, SectionName, Traffic } from './useAnalytics'

export const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0
}

export const toRows = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

export const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : (error as { message?: string } | null)?.message ?? 'Request failed'

export type TrafficStatus = 'loading' | 'ok' | 'unconfigured' | 'error'

// Calls /api/vercel-traffic with the admin's Supabase access token.
export async function fetchVercelTraffic(client: SupabaseClient, range: RangeKey): Promise<Record<string, unknown>> {
  const { data } = await client.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) throw new Error('Not signed in')
  const response = await fetch(`/api/vercel-traffic?range=${range}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error(`Vercel traffic request failed (${response.status})`)
  return (await response.json()) as Record<string, unknown>
}

// null when Vercel Web Analytics is not configured.
export function parseTraffic(body: Record<string, unknown>): Traffic | null {
  if (body.configured !== true) return null
  const visitors = (body.visitors ?? {}) as { current?: number | null; previous?: number | null }
  return {
    visitors: { current: visitors.current ?? null, previous: visitors.previous ?? null },
    series: toRows(body.series),
    previousSeries: toRows(body.previousSeries),
    seriesAvailable: body.seriesAvailable === true,
    topReferrers: toRows(body.topReferrers),
    topCountries: toRows(body.topCountries),
  }
}

// Unwraps one settled Supabase RPC result, recording its error under `section` instead of throwing.
export function unwrapRpc(
  result: PromiseSettledResult<{ data: unknown; error: unknown }>,
  section: SectionName,
  errors: SectionErrors,
): unknown {
  if (result.status === 'rejected') { errors[section] = messageOf(result.reason); return null }
  if (result.value.error) { errors[section] = messageOf(result.value.error); return null }
  return result.value.data
}
