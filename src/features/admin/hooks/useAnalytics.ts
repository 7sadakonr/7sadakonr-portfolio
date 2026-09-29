import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { formatAnalyticsHour, hourBucket, rollingHourKeys } from './analyticsTime'

export type DateRangeDays = 1 | 7 | 30

export interface AnalyticsOverviewData {
  visitors: number
  visitors_prev: number | null
  visitors_today: number | null
  visitors_yesterday: number | null
  active_now: number
  page_views?: number
  interactions: number
  interactions_prev: number
  interactions_today: number
  interactions_yesterday: number
  project_opens: number
  external_clicks: number
  resume_downloads: number
  sessions: number
  avg_session_events: number
}

export interface TrafficInsights {
  peakTimeLabel: string
  peakCount: number
  average: number
  busiestPeriodLabel: string
  unitLabel: string
}

export interface TimeSeriesPoint {
  date: string
  count: number
  label?: string
}

export interface UtmCampaignRow {
  source: string
  campaign: string
  sessions: number
  interactions: number
  conversions: number
}

export interface ProjectPerformanceRow {
  slug: string
  title: string | null
  opens: number
  visitors: number
  github_clicks: number
  demo_clicks: number
}

export interface TopInteractionRow {
  event_name: string
  target_label: string
  project_slug: string | null
  total: number
}

export interface TopCountryRow {
  country: string
  count: number
}

export type TimeSeriesMetric = 'visitors' | 'interactions' | 'project_opens' | 'external_clicks' | 'resume_downloads'

export function useAnalytics(initialDays: DateRangeDays = 1) {
  const [days, setDays] = useState<DateRangeDays>(initialDays)
  const [metric, setMetric] = useState<TimeSeriesMetric>('visitors')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date())

  const [overview, setOverview] = useState<AnalyticsOverviewData | null>(null)
  const [timeseriesMap, setTimeseriesMap] = useState<Record<TimeSeriesMetric, TimeSeriesPoint[]>>({
    visitors: [],
    interactions: [],
    project_opens: [],
    external_clicks: [],
    resume_downloads: [],
  })
  const [utmCampaigns, setUtmCampaigns] = useState<UtmCampaignRow[]>([])
  const [projectPerformance, setProjectPerformance] = useState<ProjectPerformanceRow[]>([])
  const [topInteractions, setTopInteractions] = useState<TopInteractionRow[]>([])
  const [topCountries, setTopCountries] = useState<TopCountryRow[]>([])

  const [isVercelSynced, setIsVercelSynced] = useState<boolean>(false)

  const fetchData = useCallback(async (isBackground = false) => {
    if (!supabase) {
      setError('Supabase is not configured.')
      setIsLoading(false)
      return
    }

    if (!isBackground) {
      setIsLoading(true)
    }
    setError(null)

    const toDate = new Date()
    const fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000)
    const p_from = fromDate.toISOString()
    const p_to = toDate.toISOString()

    try {
      const [
        overviewRes,
        utmRes,
        projectRes,
        topRes,
        countryRes,
        vercelData,
        tsInteractionsRes,
        tsOpensRes,
        tsResumeRes,
      ] = await Promise.all([
        supabase.rpc('analytics_overview', { p_from, p_to }),
        supabase.rpc('analytics_utm_campaigns', { p_from, p_to }),
        supabase.rpc('analytics_project_performance', { p_from, p_to }),
        supabase.rpc('analytics_top_interactions', { p_from, p_to }),
        Promise.resolve(supabase.rpc('analytics_top_countries', { p_from, p_to })).catch(() => ({ data: [], error: null })),
        fetch(`/api/vercel-traffic?days=${days}`)
          .then(async (r) => (r.ok ? r.json() : null))
          .catch(() => null),
        Promise.resolve(supabase.rpc('analytics_timeseries', { p_from, p_to, p_metric: 'interactions' })).catch(() => ({ data: [], error: null })),
        Promise.resolve(supabase.rpc('analytics_timeseries', { p_from, p_to, p_metric: 'project_opens' })).catch(() => ({ data: [], error: null })),
        Promise.resolve(supabase.rpc('analytics_timeseries', { p_from, p_to, p_metric: 'resume_downloads' })).catch(() => ({ data: [], error: null })),
      ])

      if (overviewRes.error) throw overviewRes.error
      if (utmRes.error) throw utmRes.error
      if (projectRes.error) throw projectRes.error
      if (topRes.error) throw topRes.error

      const rawData = (overviewRes.data && typeof overviewRes.data === 'object' ? overviewRes.data : {}) as Record<string, unknown>

      const toSafeNum = (val: unknown, fallback = 0): number => {
        if (typeof val === 'number') return isNaN(val) || !isFinite(val) ? fallback : val
        if (typeof val === 'string') {
          const p = parseFloat(val)
          return isNaN(p) || !isFinite(p) ? fallback : p
        }
        return fallback
      }

      const rawInteractions = toSafeNum(rawData.interactions, 0)
      const rawInteractionsPrev = toSafeNum(rawData.interactions_prev, 0)
      const rawInteractionsToday = toSafeNum(rawData.interactions_today, 0)
      const rawInteractionsYesterday = toSafeNum(rawData.interactions_yesterday, 0)
      const rawProjectOpens = toSafeNum(rawData.project_opens, 0)
      const rawExternalClicks = toSafeNum(rawData.external_clicks, 0)
      const rawResumeDownloads = toSafeNum(rawData.resume_downloads, 0)
      const rawSessions = toSafeNum(rawData.sessions, 0)
      const rawPageViews = toSafeNum(rawData.page_views, 0)

      interface VercelPayload {
        configured?: boolean
        totalVisitors?: number
        visitorDataAvailable?: boolean
        visitorTimeSeries?: Array<{ date: string; visitors: number }>
        dailyTimeSeries?: Array<{ date: string; visitors: number }>
        visitorDailyDataAvailable?: boolean
        totalPageviews?: number
        topReferrers?: Array<{ referrer: string; count: number }>
        topCountries?: Array<{ country: string; count: number }>
      }

      const vercelTraffic = vercelData && (vercelData as VercelPayload).configured ? (vercelData as VercelPayload) : null
      const vercelVisitors = toSafeNum(vercelTraffic?.totalVisitors, 0)
      const vercelVisitorDataAvailable = vercelTraffic?.visitorDataAvailable === true
      const vercelVisitorsByDate = new Map<string, number>()
      if (vercelVisitorDataAvailable) {
        for (const item of vercelTraffic?.visitorTimeSeries ?? []) {
          if (item?.date) {
            vercelVisitorsByDate.set(item.date, toSafeNum(item.visitors, 0))
          }
        }
      }
      const todayIso = toDate.toISOString().slice(0, 10)
      const yesterdayIso = new Date(toDate.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const dailyVisitors = new Map((vercelTraffic?.dailyTimeSeries ?? []).map((point) => [point.date, point.visitors]))
      const dailyAvailable = vercelVisitorDataAvailable && vercelTraffic?.visitorDailyDataAvailable === true
      setIsVercelSynced(vercelVisitorDataAvailable)

      // 1. Overview cards: Vercel is the sole source for visitor metrics.
      const mergedOverview: AnalyticsOverviewData = {
        visitors: vercelVisitors,
        visitors_prev: null,
        visitors_today: dailyAvailable ? dailyVisitors.get(todayIso) ?? 0 : null,
        visitors_yesterday: dailyAvailable ? dailyVisitors.get(yesterdayIso) ?? 0 : null,
        active_now: 0,
        page_views: rawPageViews,
        interactions: rawInteractions,
        interactions_prev: rawInteractionsPrev,
        interactions_today: rawInteractionsToday,
        interactions_yesterday: rawInteractionsYesterday,
        project_opens: rawProjectOpens,
        external_clicks: rawExternalClicks,
        resume_downloads: rawResumeDownloads,
        sessions: rawSessions,
        avg_session_events: 0,
      }
      setOverview(mergedOverview)

      // 2. Build Date Axis: Hourly for 1-day view (24h), Daily for multi-day views (7d, 30d)
      const isHourly = days === 1
      const dateKeys: string[] = []

      if (isHourly) {
        dateKeys.push(...rollingHourKeys(fromDate, toDate))
      } else {
        const curDate = new Date(fromDate)
        const toDateFloor = new Date(toDate)
        while (curDate <= toDateFloor) {
          dateKeys.push(curDate.toISOString().slice(0, 10))
          curDate.setUTCDate(curDate.getUTCDate() + 1)
        }
        if (!dateKeys.includes(todayIso)) {
          dateKeys.push(todayIso)
        }
      }

      // Helper to match hourly point from RPC
      const matchHourlyCount = (arr: TimeSeriesPoint[], key: string): number => {
        const exact = arr.find((point) => hourBucket(point.date) === key)
        const legacy = arr.filter((point) => point.date === formatAnalyticsHour(key))
        const found = exact ?? (legacy.length === 1 ? legacy[0] : undefined)
        return found ? toSafeNum(found.count, 0) : 0
      }

      // 2.1 Process 'visitors' series
      const processedVisitors: TimeSeriesPoint[] = vercelVisitorDataAvailable
        ? dateKeys.map((key) => ({
            date: key,
            count: vercelVisitorsByDate.get(key) ?? 0,
          }))
        : []

      // 2.2 Process 'interactions' series
      const rawInteractionsArray = Array.isArray(tsInteractionsRes.data) ? (tsInteractionsRes.data as TimeSeriesPoint[]) : []
      const processedInteractions: TimeSeriesPoint[] = dateKeys.map((key) => {
        if (isHourly) {
          const rpcCount = matchHourlyCount(rawInteractionsArray, key)
          return { date: key, count: rpcCount }
        }
        const found = rawInteractionsArray.find((p) => String(p.date || '').slice(0, 10) === key)
        return { date: key, count: found ? toSafeNum(found.count, 0) : 0 }
      })

      // 2.3 Process 'project_opens' series
      const rawOpensArray = Array.isArray(tsOpensRes.data) ? (tsOpensRes.data as TimeSeriesPoint[]) : []
      const processedOpens: TimeSeriesPoint[] = dateKeys.map((key) => {
        if (isHourly) {
          const rpcCount = matchHourlyCount(rawOpensArray, key)
          return { date: key, count: rpcCount }
        }
        const found = rawOpensArray.find((p) => String(p.date || '').slice(0, 10) === key)
        return { date: key, count: found ? toSafeNum(found.count, 0) : 0 }
      })

      // 2.4 Process 'external_clicks' series (empty in aggregate model)
      const processedClicks: TimeSeriesPoint[] = dateKeys.map((key) => ({ date: key, count: 0 }))

      // 2.5 Process 'resume_downloads' series
      const rawResumeArray = Array.isArray(tsResumeRes.data) ? (tsResumeRes.data as TimeSeriesPoint[]) : []
      const processedResume: TimeSeriesPoint[] = dateKeys.map((key) => {
        if (isHourly) {
          const rpcCount = matchHourlyCount(rawResumeArray, key)
          return { date: key, count: rpcCount }
        }
        const found = rawResumeArray.find((p) => String(p.date || '').slice(0, 10) === key)
        return { date: key, count: found ? toSafeNum(found.count, 0) : 0 }
      })

      setTimeseriesMap({
        visitors: processedVisitors,
        interactions: processedInteractions,
        project_opens: processedOpens,
        external_clicks: processedClicks,
        resume_downloads: processedResume,
      })
      setLastUpdated(new Date())

      // 3. Unified Referral Sources: Merge Vercel top referrers into UTM Campaign table
      const mergedUtm = (utmRes.data as UtmCampaignRow[]) || []
      if (vercelTraffic?.topReferrers && vercelTraffic.topReferrers.length > 0) {
        const existingSources = new Set(mergedUtm.map((u) => (u.source || '').toLowerCase()))
        for (const ref of vercelTraffic.topReferrers) {
          if (ref.referrer && !existingSources.has(ref.referrer.toLowerCase())) {
            mergedUtm.push({
              source: ref.referrer,
              campaign: '(direct / vercel referrer)',
              sessions: ref.count,
              interactions: ref.count,
              conversions: 0,
            })
          }
        }
      }
      setUtmCampaigns(mergedUtm)

      // 4. Countries: Merge Supabase aggregate countries with Vercel countries
      const dbCountries = (countryRes.data as TopCountryRow[]) || []
      const countryMap = new Map<string, number>()
      for (const row of dbCountries) {
        if (row.country) {
          countryMap.set(row.country.toUpperCase(), (countryMap.get(row.country.toUpperCase()) || 0) + toSafeNum(row.count, 0))
        }
      }
      if (vercelTraffic?.topCountries) {
        for (const c of vercelTraffic.topCountries) {
          if (c.country) {
            const code = c.country.toUpperCase()
            if (!countryMap.has(code)) {
              countryMap.set(code, toSafeNum(c.count, 0))
            }
          }
        }
      }
      const mergedCountries: TopCountryRow[] = Array.from(countryMap.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
      setTopCountries(mergedCountries)

      setProjectPerformance((projectRes.data as ProjectPerformanceRow[]) || [])
      setTopInteractions((topRes.data as TopInteractionRow[]) || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics data'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [days])

  // Initial fetch and dependency on days
  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // Real-time background sync (15s auto-polling + visibility/focus wakeup)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    const startPolling = () => {
      if (timer) clearInterval(timer)
      timer = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          void fetchData(true)
        }
      }, 15000)
    }

    startPolling()

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchData(true)
      }
    }

    const handleFocus = () => {
      void fetchData(true)
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus)
    }

    return () => {
      if (timer) clearInterval(timer)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus)
      }
    }
  }, [fetchData])

  // Traffic insights (peak hour/day, averages, busiest time window)
  const trafficInsights = useMemo<TrafficInsights>(() => {
    const currentSeries = timeseriesMap[metric] || []
    if (!currentSeries || currentSeries.length === 0) {
      return {
        peakTimeLabel: '-',
        peakCount: 0,
        average: 0,
        busiestPeriodLabel: '-',
        unitLabel: days === 1 ? 'per hour' : 'per day',
      }
    }

    const firstPt = currentSeries[0]
    if (!firstPt) {
      return {
        peakTimeLabel: '-',
        peakCount: 0,
        average: 0,
        busiestPeriodLabel: '-',
        unitLabel: days === 1 ? 'per hour' : 'per day',
      }
    }

    let peakPt: TimeSeriesPoint = firstPt
    let sum = 0
    for (const pt of currentSeries) {
      sum += pt.count
      if (pt.count > peakPt.count) {
        peakPt = pt
      }
    }

    const average = currentSeries.length > 0 ? Math.round((sum / currentSeries.length) * 10) / 10 : 0

    let peakTimeLabel = peakPt.date || '-'
    if (days === 1) {
      const next = new Date(new Date(peakTimeLabel).getTime() + 60 * 60 * 1000).toISOString()
      peakTimeLabel = `${formatAnalyticsHour(peakTimeLabel)} - ${formatAnalyticsHour(next)} UTC`
    }

    let busiestPeriodLabel = '-'
    if (days === 1) {
      const periods = [
        { name: 'Morning (06:00 - 12:00)', total: 0 },
        { name: 'Afternoon (12:00 - 18:00)', total: 0 },
        { name: 'Evening (18:00 - 24:00)', total: 0 },
        { name: 'Night (00:00 - 06:00)', total: 0 },
      ]
      for (const pt of currentSeries) {
        const h = new Date(pt.date).getUTCHours()
        if (!isNaN(h)) {
          if (h >= 6 && h < 12 && periods[0]) periods[0].total += pt.count
          else if (h >= 12 && h < 18 && periods[1]) periods[1].total += pt.count
          else if (h >= 18 && h < 24 && periods[2]) periods[2].total += pt.count
          else if (periods[3]) periods[3].total += pt.count
        }
      }
      periods.sort((a, b) => b.total - a.total)
      const topPeriod = periods[0]
      busiestPeriodLabel = topPeriod && topPeriod.total > 0 ? topPeriod.name : 'Evenly Distributed'
    } else {
      busiestPeriodLabel = peakPt.count > 0 ? `Peak on ${peakPt.date}` : '-'
    }

    return {
      peakTimeLabel,
      peakCount: peakPt.count,
      average,
      busiestPeriodLabel,
      unitLabel: days === 1 ? 'per hour' : 'per day',
    }
  }, [timeseriesMap, metric, days])

  return {
    days,
    setDays,
    metric,
    setMetric,
    isLoading,
    error,
    overview,
    timeseries: timeseriesMap[metric] || [],
    trafficInsights,
    lastUpdated,
    utmCampaigns,
    projectPerformance,
    topInteractions,
    topCountries,
    isVercelSynced,
    isVisitorDataAvailable: isVercelSynced,
    refetch: fetchData,
  }
}
