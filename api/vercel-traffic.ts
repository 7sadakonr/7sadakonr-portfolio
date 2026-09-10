import type { VercelRequest, VercelResponse } from '@vercel/node'

interface VercelAggregateRow {
  key?: string
  date?: string
  day?: string
  timestamp?: string | number
  time?: string | number
  referrer?: string
  country?: string
  pageViews?: number
  visitors?: number
  count?: number
  total?: number
}

interface VercelAggregateResponse {
  data?: VercelAggregateRow[]
  [key: string]: unknown
}

export function normalizeVisitorSeries(
  rows: VercelAggregateRow[],
  granularity: 'hour' | 'day',
): Array<{ date: string; visitors: number }> {
  const visitorsByDate = new Map<string, number>()

  for (const row of rows) {
    const dateValue = row.key ?? row.date ?? row.day ?? row.timestamp ?? row.time
    if (dateValue === undefined || dateValue === null) continue

    const date = new Date(dateValue)
    if (isNaN(date.getTime())) continue

    const visitors = Number(row.visitors)
    if (!Number.isFinite(visitors)) continue

    const normalizedDate = granularity === 'hour'
      ? `${date.toISOString().slice(11, 13)}:00`
      : date.toISOString().slice(0, 10)
    visitorsByDate.set(normalizedDate, (visitorsByDate.get(normalizedDate) ?? 0) + visitors)
  }

  return Array.from(visitorsByDate, ([date, visitors]) => ({ date, visitors }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const vercelToken = (process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN || '').trim()
  const projectId = (process.env.VERCEL_PROJECT_ID || process.env.PROJECT_ID || '').trim()
  let teamId = (process.env.VERCEL_TEAM_ID || '').trim()

  if (!vercelToken || !projectId) {
    res.status(200).json({
      configured: false,
      message: 'Vercel API Token or Project ID is not yet configured in environment variables.',
    })
    return
  }

  // Auto-detect teamId if project is owned by a team and teamId was not explicitly set
  if (!teamId) {
    try {
      const projRes = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}`, {
        headers: { Authorization: `Bearer ${vercelToken}` },
      })
      if (projRes.ok) {
        const projData = (await projRes.json()) as { accountId?: string }
        if (projData?.accountId && projData.accountId.startsWith('team_')) {
          teamId = projData.accountId
        }
      }
    } catch {
      // Continue without auto-detected teamId
    }
  }

  // Determine query range (default 30 days, or requested days)
  const daysParam = req.query.days ? parseInt(String(req.query.days), 10) : 30
  const days = isNaN(daysParam) || daysParam <= 0 ? 30 : daysParam
  const until = Date.now()
  const since = until - days * 24 * 60 * 60 * 1000

  const baseParams = new URLSearchParams({
    projectId,
    since: String(since),
    until: String(until),
  })

  if (teamId) {
    baseParams.set('teamId', teamId)
  }

  const headers = {
    Authorization: `Bearer ${vercelToken}`,
    'Content-Type': 'application/json',
  }

  try {
    // 1. Fetch total count of visits
    const countUrl = `https://api.vercel.com/v1/query/web-analytics/visits/count?${baseParams.toString()}`
    const countPromise = fetch(countUrl, { headers })

    // Fallback/parallel query to aggregate daily totals in case count returns different schema
    const aggTotalsParams = new URLSearchParams(baseParams)
    aggTotalsParams.set('granularity', 'day')
    const aggTotalsUrl = `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${aggTotalsParams.toString()}`
    const aggTotalsPromise = fetch(aggTotalsUrl, { headers })

    // Dedicated visitor series; hourly for a one-day range and daily otherwise.
    const seriesParams = new URLSearchParams(baseParams)
    const seriesGranularity = days === 1 ? 'hour' : 'day'
    seriesParams.set('granularity', seriesGranularity)
    const seriesUrl = `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${seriesParams.toString()}`
    const seriesPromise = fetch(seriesUrl, { headers })

    // 2. Fetch top referrers
    const referrersParams = new URLSearchParams(baseParams)
    referrersParams.set('by', 'referrer')
    referrersParams.set('limit', '8')
    const referrersUrl = `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${referrersParams.toString()}`
    const referrersPromise = fetch(referrersUrl, { headers })

    // 3. Fetch top countries
    const countriesParams = new URLSearchParams(baseParams)
    countriesParams.set('by', 'country')
    countriesParams.set('limit', '6')
    const countriesUrl = `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${countriesParams.toString()}`
    const countriesPromise = fetch(countriesUrl, { headers })

    const [countRes, aggTotalsRes, seriesRes, refRes, countryRes] = await Promise.all([
      countPromise,
      aggTotalsPromise,
      seriesPromise,
      referrersPromise,
      countriesPromise,
    ])

    // If both count and aggregate failed due to authentication or permissions
    if (!countRes.ok && !aggTotalsRes.ok) {
      const errText = await (countRes.status !== 404 ? countRes.text() : aggTotalsRes.text()).catch(() => '')
      console.warn(`[Vercel Traffic API] Failed querying Vercel Web Analytics: status ${countRes.status}`, errText)
      res.status(200).json({
        configured: false,
        status: countRes.status,
        message: `Vercel Web Analytics API returned ${countRes.status}. Make sure VERCEL_TOKEN and VERCEL_PROJECT_ID are valid.`,
      })
      return
    }

    const countData = countRes.ok ? await countRes.json().catch(() => null) : null
    const aggTotalsRaw = aggTotalsRes.ok ? await aggTotalsRes.json().catch(() => null) : null
    const seriesRaw = seriesRes.ok ? await seriesRes.json().catch(() => null) : null
    const refDataRaw = refRes.ok ? await refRes.json().catch(() => null) : null
    const countryDataRaw = countryRes.ok ? await countryRes.json().catch(() => null) : null

    let totalPageviews = 0
    let totalVisitors = 0

    const parseNum = (val: unknown): number => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val
      if (typeof val === 'string') {
        const p = parseFloat(val)
        return isNaN(p) ? 0 : p
      }
      return 0
    }

    const extractMetricsFromObj = (obj: unknown): { pv: number; v: number } => {
      if (!obj || typeof obj !== 'object') return { pv: 0, v: 0 }
      const rec = obj as Record<string, unknown>
      const inner = rec.data && typeof rec.data === 'object' && !Array.isArray(rec.data)
        ? (rec.data as Record<string, unknown>)
        : rec

      const pv = parseNum(inner.pageviews ?? inner.pageViews ?? inner.total ?? inner.count ?? inner.value)
      const v = parseNum(inner.visitors ?? inner.uniqueVisitors ?? inner.unique_visitors)
      return { pv, v: v > 0 ? v : pv }
    }

    const countMetrics = extractMetricsFromObj(countData)
    totalPageviews = countMetrics.pv
    totalVisitors = countMetrics.v

    const normalizeDate = (val: unknown): string => {
      if (!val) return ''
      if (typeof val === 'number' || /^\d{10,13}$/.test(String(val))) {
        const ms = Number(val) < 1e11 ? Number(val) * 1000 : Number(val)
        return new Date(ms).toISOString().slice(0, 10)
      }
      const str = String(val)
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return str.slice(0, 10)
      }
      try {
        const d = new Date(str)
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
      } catch {
        // fallback
      }
      return str.slice(0, 10)
    }

    // Process daily breakdown from aggregate
    const dailyMap = new Map<string, { pageviews: number; visitors: number }>()
    let aggPageviews = 0
    let aggVisitors = 0

    if (aggTotalsRaw && typeof aggTotalsRaw === 'object') {
      const rows: unknown[] = Array.isArray(aggTotalsRaw)
        ? (aggTotalsRaw as unknown[])
        : Array.isArray((aggTotalsRaw as Record<string, unknown>).data)
          ? ((aggTotalsRaw as Record<string, unknown>).data as unknown[])
          : []

      for (const row of rows) {
        if (!row || typeof row !== 'object') continue
        const r = row as Record<string, unknown>
        const dateVal = normalizeDate(r.date ?? r.key ?? r.day ?? r.timestamp ?? r.time)
        const m = extractMetricsFromObj(row)
        aggPageviews += m.pv
        aggVisitors += m.v
        if (dateVal) {
          const prev = dailyMap.get(dateVal) || { pageviews: 0, visitors: 0 }
          dailyMap.set(dateVal, {
            pageviews: prev.pageviews + m.pv,
            visitors: prev.visitors + m.v,
          })
        }
      }
    }

    const dailyTimeSeries = Array.from(dailyMap.entries()).map(([date, counts]) => ({
      date,
      pageviews: counts.pageviews,
      visitors: counts.visitors,
    }))

    // Always take the most complete total
    if (totalPageviews === 0 || aggPageviews > totalPageviews) {
      totalPageviews = aggPageviews
    }
    if (totalVisitors === 0 || aggVisitors > totalVisitors) {
      totalVisitors = aggVisitors
    }

    const seriesRows: VercelAggregateRow[] = Array.isArray(seriesRaw)
      ? (seriesRaw as VercelAggregateRow[])
      : Array.isArray((seriesRaw as VercelAggregateResponse)?.data)
        ? ((seriesRaw as VercelAggregateResponse).data ?? [])
        : []
    const visitorTimeSeries = normalizeVisitorSeries(seriesRows, seriesGranularity)

    // Process referrers
    const topReferrers: Array<{ referrer: string; count: number }> = []
    const refRows: VercelAggregateRow[] = Array.isArray(refDataRaw)
      ? (refDataRaw as VercelAggregateRow[])
      : Array.isArray((refDataRaw as VercelAggregateResponse)?.data)
        ? ((refDataRaw as VercelAggregateResponse).data ?? [])
        : []

    for (const r of refRows) {
      if (!r) continue
      const name = r.referrer || r.key || '(Direct / None)'
      const val = r.pageViews ?? r.visitors ?? r.count ?? r.total ?? 0
      topReferrers.push({ referrer: name, count: val })
    }

    // Process countries
    const topCountries: Array<{ country: string; count: number }> = []
    const countryRows: VercelAggregateRow[] = Array.isArray(countryDataRaw)
      ? (countryDataRaw as VercelAggregateRow[])
      : Array.isArray((countryDataRaw as VercelAggregateResponse)?.data)
        ? ((countryDataRaw as VercelAggregateResponse).data ?? [])
        : []

    for (const c of countryRows) {
      if (!c) continue
      const name = c.country || c.key || 'Unknown'
      const val = c.pageViews ?? c.visitors ?? c.count ?? c.total ?? 0
      topCountries.push({ country: name, count: val })
    }

    res.status(200).json({
      configured: true,
      totalPageviews,
      totalVisitors,
      topReferrers,
      topCountries,
      dailyTimeSeries,
      visitorTimeSeries,
      visitorDataAvailable: seriesRes.ok,
      periodDays: days,
    })
  } catch (err) {
    console.error('[Vercel Traffic API] Failed querying Vercel Web Analytics:', err)
    res.status(500).json({
      configured: true,
      error: 'Failed to communicate with Vercel Web Analytics API',
    })
  }
}
