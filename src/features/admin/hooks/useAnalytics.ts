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

export interface GoalMetric {
  sessions: number
  events: number
  rate: number
}

export interface SectionRetentionItem {
  section: string
  label: string
  sessions: number
  rate: number
}

export interface FunnelData {
  sessions: number
  visitors?: number
  viewed_projects: number
  opened_project: number
  clicked_link: number
  converted: number
  goals?: {
    resume_downloads: GoalMetric
    project_engagement: GoalMetric
    demo_views: GoalMetric
    github_inspects: GoalMetric
    contact_intents: GoalMetric
  }
  section_retention?: SectionRetentionItem[]
}

export interface RecentSessionItem {
  session_id: string
  visitor_short: string
  started_at: string
  last_seen_at: string
  landing_path: string | null
  referrer_host?: string | null
  utm_source: string | null
  utm_campaign: string | null
  country: string | null
  device_type: string | null
  event_count: number
  duration_seconds: number
}

export interface SessionEvent {
  event_name: string
  page: string | null
  section: string | null
  target_label: string | null
  project_slug: string | null
  destination_host: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface SessionDetailData {
  session: {
    session_id: string
    visitor_short: string
    started_at: string
    last_seen_at: string
    landing_path: string | null
    referrer_host: string | null
    utm_source: string | null
    utm_medium: string | null
    utm_campaign: string | null
    country: string | null
    region: string | null
    city: string | null
    device_type: string | null
    browser: string | null
    os: string | null
  }
  events: SessionEvent[]
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
  const [funnel, setFunnel] = useState<FunnelData | null>(null)
  const [recentSessions, setRecentSessions] = useState<RecentSessionItem[]>([])

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
        funnelRes,
        recentRes,
        vercelData,
        tsInteractionsRes,
        tsOpensRes,
        tsClicksRes,
        tsResumeRes,
      ] = await Promise.all([
        supabase.rpc('analytics_overview', { p_from, p_to }),
        supabase.rpc('analytics_utm_campaigns', { p_from, p_to }),
        supabase.rpc('analytics_project_performance', { p_from, p_to }),
        supabase.rpc('analytics_top_interactions', { p_from, p_to }),
        supabase.rpc('analytics_funnel', { p_from, p_to }),
        supabase.rpc('analytics_recent_sessions', { p_limit: 50 }),
        fetch(`/api/vercel-traffic?days=${days}`)
          .then(async (r) => (r.ok ? r.json() : null))
          .catch(() => null),
        Promise.resolve(supabase.rpc('analytics_timeseries', { p_from, p_to, p_metric: 'interactions' })).catch(() => ({ data: [], error: null })),
        Promise.resolve(supabase.rpc('analytics_timeseries', { p_from, p_to, p_metric: 'project_opens' })).catch(() => ({ data: [], error: null })),
        Promise.resolve(supabase.rpc('analytics_timeseries', { p_from, p_to, p_metric: 'external_clicks' })).catch(() => ({ data: [], error: null })),
        Promise.resolve(supabase.rpc('analytics_timeseries', { p_from, p_to, p_metric: 'resume_downloads' })).catch(() => ({ data: [], error: null })),
      ])

      if (overviewRes.error) throw overviewRes.error
      if (utmRes.error) throw utmRes.error
      if (projectRes.error) throw projectRes.error
      if (topRes.error) throw topRes.error
      if (funnelRes.error) throw funnelRes.error
      if (recentRes.error) throw recentRes.error

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
      const rawAvgEvents = toSafeNum(rawData.avg_session_events, 0)

      // Identify current admin visitor in this browser to exclude from live counters
      const adminVisitorId = typeof window !== 'undefined' ? localStorage.getItem('portfolio_visitor_id') : null
      const adminVisitorShort = adminVisitorId ? adminVisitorId.slice(0, 8).toLowerCase() : null

      // Filter out admin's own sessions from recentRes.data
      const rawRecent = Array.isArray(recentRes.data) ? (recentRes.data as RecentSessionItem[]) : []
      const filteredRecent = rawRecent.filter((s) => {
        const vShort = (s.visitor_short || '').toLowerCase()
        const sId = (s.session_id || '').toLowerCase()
        const isSelf = adminVisitorId && (vShort === adminVisitorShort || sId === adminVisitorId.toLowerCase())
        return !isSelf
      })

      // Ensure referrer_host is populated for inbound origin styling (e.g. GitHub referrals)
      if (filteredRecent.length > 0 && filteredRecent.some((s) => s.referrer_host === undefined)) {
        try {
          const sessionIds = filteredRecent.map((s) => s.session_id)
          const { data: sessionRows } = await supabase
            .from('analytics_sessions')
            .select('session_id, referrer_host, utm_source, utm_campaign')
            .in('session_id', sessionIds)

          if (sessionRows && sessionRows.length > 0) {
            const sessionMap = new Map(sessionRows.map((r) => [r.session_id, r]))
            for (const s of filteredRecent) {
              const match = sessionMap.get(s.session_id)
              if (match) {
                if (s.referrer_host === undefined) {
                  s.referrer_host = match.referrer_host ?? null
                }
                if (!s.utm_source && match.utm_source) {
                  s.utm_source = match.utm_source
                }
                if (!s.utm_campaign && match.utm_campaign) {
                  s.utm_campaign = match.utm_campaign
                }
              }
            }
          }
        } catch {
          // Proceed gracefully without failing dashboard load
        }
      }

      // Hourly buckets map for 1-day view (24 hours)
      const hourlyInteractionsMap = new Map<string, number>()
      for (const key of rollingHourKeys(fromDate, toDate)) {
        hourlyInteractionsMap.set(key, 0)
      }

      if (filteredRecent.length > 0) {
        for (const s of filteredRecent) {
          const sDate = new Date(s.started_at || s.last_seen_at || Date.now())
          if (!isNaN(sDate.getTime()) && sDate >= fromDate && sDate <= toDate) {
            const hKey = hourBucket(sDate)
            if (hourlyInteractionsMap.has(hKey)) {
              const evCount = toSafeNum(s.event_count, 1)
              hourlyInteractionsMap.set(hKey, (hourlyInteractionsMap.get(hKey) || 0) + evCount)
            }
          }
        }
      }

      // Active interactions sum (real intentional actions: demo, github, resume, contact, project opens)
      const activeInteractionsSum = Array.isArray(topRes.data) && (topRes.data as TopInteractionRow[]).length > 0
        ? (topRes.data as TopInteractionRow[]).reduce((sum, item) => sum + toSafeNum(item.total, 0), 0)
        : (rawProjectOpens + rawExternalClicks + rawResumeDownloads)

      // Exclude passive telemetry (page_views, section_views, scroll_depths) if database overview counted all events
      const calibratedInteractions = (rawInteractions > activeInteractionsSum && activeInteractionsSum > 0)
        ? activeInteractionsSum
        : (activeInteractionsSum > 0 ? activeInteractionsSum : rawInteractions)

      interface VercelPayload {
        configured?: boolean
        totalVisitors?: number
        visitorDataAvailable?: boolean
        visitorTimeSeries?: Array<{ date: string; visitors: number }>
        dailyTimeSeries?: Array<{ date: string; visitors: number }>
        visitorDailyDataAvailable?: boolean
        totalPageviews?: number
        topReferrers?: Array<{ referrer: string; count: number }>
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
        interactions: calibratedInteractions,
        interactions_prev: rawInteractionsPrev,
        interactions_today: rawInteractionsToday,
        interactions_yesterday: rawInteractionsYesterday,
        project_opens: rawProjectOpens,
        external_clicks: rawExternalClicks,
        resume_downloads: rawResumeDownloads,
        sessions: rawSessions,
        avg_session_events: rawAvgEvents,
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
        // Legacy RPC rows contain UTC HH:00 only. Duplicate boundary hours are
        // ambiguous: do not merge records that could belong to different dates.
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
      const rawInteractionsSum = rawInteractionsArray.reduce((acc, pt) => acc + toSafeNum(pt.count, 0), 0)
      const processedInteractions: TimeSeriesPoint[] = dateKeys.map((key) => {
        if (isHourly) {
          const sessionEvCount = hourlyInteractionsMap.get(key) || 0
          const rpcCount = matchHourlyCount(rawInteractionsArray, key)
          return { date: key, count: Math.max(sessionEvCount, rpcCount) }
        }

        const found = rawInteractionsArray.find((p) => String(p.date || '').slice(0, 10) === key)
        let count = found ? toSafeNum(found.count, 0) : 0
        if (rawInteractionsSum > 0 && calibratedInteractions < rawInteractionsSum) {
          count = Math.round((count / rawInteractionsSum) * calibratedInteractions)
        }
        return { date: key, count }
      })

      if (isHourly) {
        const interactionsSum = processedInteractions.reduce((acc, p) => acc + p.count, 0)
        if (interactionsSum === 0 && calibratedInteractions > 0) {
          const curHKey = hourBucket(toDate)
          const curPt = processedInteractions.find((p) => p.date === curHKey)
          if (curPt) {
            curPt.count = calibratedInteractions
          }
        }
      } else {
        const interactionsSum = processedInteractions.reduce((acc, p) => acc + p.count, 0)
        if (interactionsSum === 0 && calibratedInteractions > 0) {
          const lastPt = processedInteractions[processedInteractions.length - 1]
          if (lastPt) {
            lastPt.count = calibratedInteractions
          }
        }
      }

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

      // 2.4 Process 'external_clicks' series
      const rawClicksArray = Array.isArray(tsClicksRes.data) ? (tsClicksRes.data as TimeSeriesPoint[]) : []
      const processedClicks: TimeSeriesPoint[] = dateKeys.map((key) => {
        if (isHourly) {
          const rpcCount = matchHourlyCount(rawClicksArray, key)
          return { date: key, count: rpcCount }
        }
        const found = rawClicksArray.find((p) => String(p.date || '').slice(0, 10) === key)
        return { date: key, count: found ? toSafeNum(found.count, 0) : 0 }
      })

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

      setProjectPerformance((projectRes.data as ProjectPerformanceRow[]) || [])
      setTopInteractions((topRes.data as TopInteractionRow[]) || [])
      setFunnel(funnelRes.data as FunnelData)
      setRecentSessions(filteredRecent)
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

  // Deep traffic insights (peak hour/day, averages, busiest time window)
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

  const fetchSessionDetail = useCallback(async (sessionId: string): Promise<SessionDetailData | null> => {
    if (!supabase) return null
    try {
      const { data, error } = await supabase.rpc('analytics_session_detail', { p_session_id: sessionId })
      if (error || !data) return null
      return data as SessionDetailData
    } catch {
      return null
    }
  }, [])

  const fetchSessionsByDate = useCallback(async (dateStr: string): Promise<RecentSessionItem[]> => {
    if (!supabase) return []
    try {
      const parts = dateStr.split('-').map(Number)
      const year = parts[0]
      const month = parts[1]
      const day = parts[2]
      if (year === undefined || month === undefined || day === undefined || isNaN(year) || isNaN(month) || isNaN(day)) {
        return []
      }
      const start = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString()
      const end = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString()

      const { data: sessionRows, error } = await supabase
        .from('analytics_sessions')
        .select('session_id, visitor_id, started_at, last_seen_at, landing_path, referrer_host, utm_source, utm_campaign, country, device_type')
        .gte('started_at', start)
        .lte('started_at', end)
        .order('started_at', { ascending: false })
        .limit(100)

      if (error || !sessionRows) return []

      const adminVisitorId = typeof window !== 'undefined' ? localStorage.getItem('portfolio_visitor_id') : null
      const adminVisitorShort = adminVisitorId ? adminVisitorId.slice(0, 8).toLowerCase() : null

      const filtered = sessionRows.filter((s) => {
        const vId = (s.visitor_id || '').toLowerCase()
        const sId = (s.session_id || '').toLowerCase()
        const isSelf =
          adminVisitorId &&
          (vId === adminVisitorId.toLowerCase() ||
            sId === adminVisitorId.toLowerCase() ||
            (adminVisitorShort && vId.startsWith(adminVisitorShort)))
        return !isSelf
      })

      if (filtered.length === 0) return []

      const sessionIds = filtered.map((s) => s.session_id)
      const { data: eventRows } = await supabase
        .from('analytics_events')
        .select('session_id')
        .in('session_id', sessionIds)

      const countMap = new Map<string, number>()
      if (eventRows) {
        for (const ev of eventRows) {
          countMap.set(ev.session_id, (countMap.get(ev.session_id) || 0) + 1)
        }
      }

      return filtered.map((s) => {
        const startMs = new Date(s.started_at).getTime()
        const endMs = new Date(s.last_seen_at || s.started_at).getTime()
        const durationSeconds = Math.max(0, Math.round((endMs - startMs) / 1000))

        return {
          session_id: s.session_id,
          visitor_short: s.visitor_id ? s.visitor_id.slice(0, 8) : 'anon',
          started_at: s.started_at,
          last_seen_at: s.last_seen_at || s.started_at,
          landing_path: s.landing_path,
          referrer_host: s.referrer_host,
          utm_source: s.utm_source,
          utm_campaign: s.utm_campaign,
          country: s.country,
          device_type: s.device_type,
          event_count: countMap.get(s.session_id) || 1,
          duration_seconds: durationSeconds,
        }
      })
    } catch {
      return []
    }
  }, [])

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
    funnel,
    recentSessions,
    isVercelSynced,
    isVisitorDataAvailable: isVercelSynced,
    refetch: fetchData,
    fetchSessionDetail,
    fetchSessionsByDate,
  }
}
