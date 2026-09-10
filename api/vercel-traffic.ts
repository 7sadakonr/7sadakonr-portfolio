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

    const [countData, refDataRaw, countryDataRaw] = await Promise.all([
      countPromise,
      referrersPromise,
      countriesPromise,
    ])

    let totalPageviews = 0
    let totalVisitors = 0

    if (countData && typeof countData === 'object') {
      const c = countData as Record<string, unknown>
      totalPageviews = typeof c.pageViews === 'number' ? c.pageViews : typeof c.total === 'number' ? c.total : typeof c.count === 'number' ? c.count : 0
      totalVisitors = typeof c.visitors === 'number' ? c.visitors : typeof c.uniqueVisitors === 'number' ? c.uniqueVisitors : totalPageviews
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
