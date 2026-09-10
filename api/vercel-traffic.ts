import type { VercelRequest, VercelResponse } from '@vercel/node'

interface VercelAggregateRow {
  key?: string
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

  const vercelToken = process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID || process.env.PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID

  if (!vercelToken || !projectId) {
    res.status(200).json({
      configured: false,
      message: 'Vercel API Token or Project ID is not yet configured in environment variables.',
    })
    return
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
    const countPromise = fetch(countUrl, { headers }).then(async (r) => (r.ok ? r.json() : null)).catch(() => null)

    // Fallback/parallel query to aggregate daily totals in case count returns different schema
    const aggTotalsParams = new URLSearchParams(baseParams)
    aggTotalsParams.set('granularity', 'day')
    const aggTotalsUrl = `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${aggTotalsParams.toString()}`
    const aggTotalsPromise = fetch(aggTotalsUrl, { headers }).then(async (r) => (r.ok ? r.json() : null)).catch(() => null)

    // 2. Fetch top referrers
    const referrersParams = new URLSearchParams(baseParams)
    referrersParams.set('by', 'referrer')
    referrersParams.set('limit', '8')
    const referrersUrl = `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${referrersParams.toString()}`
    const referrersPromise = fetch(referrersUrl, { headers }).then(async (r) => (r.ok ? r.json() : null)).catch(() => null)

    // 3. Fetch top countries
    const countriesParams = new URLSearchParams(baseParams)
    countriesParams.set('by', 'country')
    countriesParams.set('limit', '6')
    const countriesUrl = `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${countriesParams.toString()}`
    const countriesPromise = fetch(countriesUrl, { headers }).then(async (r) => (r.ok ? r.json() : null)).catch(() => null)

    const [countData, aggTotalsRaw, refDataRaw, countryDataRaw] = await Promise.all([
      countPromise,
      aggTotalsPromise,
      referrersPromise,
      countriesPromise,
    ])

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

    // If count returned 0 or null, sum from aggregate breakdown
    if (totalPageviews === 0 && aggTotalsRaw && typeof aggTotalsRaw === 'object') {
      const rows: unknown[] = Array.isArray(aggTotalsRaw)
        ? (aggTotalsRaw as unknown[])
        : Array.isArray((aggTotalsRaw as Record<string, unknown>).data)
          ? ((aggTotalsRaw as Record<string, unknown>).data as unknown[])
          : []

      for (const row of rows) {
        const m = extractMetricsFromObj(row)
        totalPageviews += m.pv
        totalVisitors += m.v
      }
    }

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
