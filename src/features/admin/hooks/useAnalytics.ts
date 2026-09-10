import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export type DateRangeDays = 1 | 7 | 30

export interface AnalyticsOverviewData {
  visitors: number
  visitors_prev: number
  visitors_today: number
  visitors_yesterday: number
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

export function useAnalytics() {
  const [days, setDays] = useState<DateRangeDays>(30)
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
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
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
        tsVisitorsRes,
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
        supabase.rpc('analytics_recent_sessions', { p_limit: 30 }),
        fetch(`/api/vercel-traffic?days=${days}`)
          .then(async (r) => (r.ok ? r.json() : null))
          .catch(() => null),
        Promise.resolve(supabase.rpc('analytics_timeseries', { p_from, p_to, p_metric: 'visitors' })).catch(() => ({ data: [], error: null })),
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

      const rawVisitors = toSafeNum(rawData.visitors, 0)
      const rawVisitorsPrev = toSafeNum(rawData.visitors_prev, 0)
      const rawVisitorsToday = toSafeNum(rawData.visitors_today, 0)
      const rawVisitorsYesterday = toSafeNum(rawData.visitors_yesterday, 0)
      const rawInteractions = toSafeNum(rawData.interactions, 0)
      const rawInteractionsPrev = toSafeNum(rawData.interactions_prev, 0)
      const rawInteractionsToday = toSafeNum(rawData.interactions_today, 0)
      const rawInteractionsYesterday = toSafeNum(rawData.interactions_yesterday, 0)
      const rawProjectOpens = toSafeNum(rawData.project_opens, 0)
      const rawExternalClicks = toSafeNum(rawData.external_clicks, 0)
      const rawResumeDownloads = toSafeNum(rawData.resume_downloads, 0)
      const rawSessions = toSafeNum(rawData.sessions, 0)
      const rawAvgEvents = toSafeNum(rawData.avg_session_events, 0)

      // Active Now: unique visitors with activity in the last 5 minutes
      const activeCutoffMs = Date.now() - 5 * 60 * 1000
      const activeNowSet = new Set<string>()

      // Local midnight for today's visitors (client timezone resilient)
      const localMidnight = new Date()
      localMidnight.setHours(0, 0, 0, 0)
      const localMidnightMs = localMidnight.getTime()
      const todayVisitorSet = new Set<string>()

      // Identify current admin visitor in this browser to exclude from live counters
      const adminVisitorId = typeof window !== 'undefined' ? localStorage.getItem('portfolio_visitor_id') : null
      const adminVisitorShort = adminVisitorId ? adminVisitorId.slice(0, 8).toLowerCase() : null
      let adminWasActiveInDb = false

      // Filter out admin's own sessions from recentRes.data
      const rawRecent = Array.isArray(recentRes.data) ? (recentRes.data as RecentSessionItem[]) : []
      const filteredRecent = rawRecent.filter((s) => {
        const vShort = (s.visitor_short || '').toLowerCase()
        const sId = (s.session_id || '').toLowerCase()
        const isSelf = adminVisitorId && (vShort === adminVisitorShort || sId === adminVisitorId.toLowerCase())
        if (isSelf) {
          const lastSeenMs = s.last_seen_at ? new Date(s.last_seen_at).getTime() : 0
          const startedMs = s.started_at ? new Date(s.started_at).getTime() : 0
          if (lastSeenMs >= activeCutoffMs || startedMs >= activeCutoffMs) {
            adminWasActiveInDb = true
          }
          return false
        }
        return true
      })

      // Hourly buckets map for 1-day view (24 hours)
      const hourlyVisitorsMap = new Map<string, Set<string>>()
      const hourlyInteractionsMap = new Map<string, number>()
      for (let h = 0; h < 24; h++) {
        const key = `${String(h).padStart(2, '0')}:00`
        hourlyVisitorsMap.set(key, new Set())
        hourlyInteractionsMap.set(key, 0)
      }

      // Fallback derivation if visitors were missing from old Supabase RPC:
      let effectiveVisitors = rawVisitors
      if (effectiveVisitors === 0 && rawSessions > 0) {
        effectiveVisitors = rawSessions
      }
      if (filteredRecent.length > 0) {
        const uniqueRecentVisitors = new Set(filteredRecent.map((s) => s.visitor_short || s.session_id))
        if (effectiveVisitors === 0) {
          effectiveVisitors = uniqueRecentVisitors.size
        }

        for (const s of filteredRecent) {
          const vId = String(s.visitor_short || s.session_id || '')
          if (!vId) continue
          const lastSeenMs = s.last_seen_at ? new Date(s.last_seen_at).getTime() : 0
          const startedMs = s.started_at ? new Date(s.started_at).getTime() : 0

          // Check if active in last 5 minutes
          if (lastSeenMs >= activeCutoffMs || startedMs >= activeCutoffMs) {
            activeNowSet.add(vId)
          }

          // Check if visited since local midnight
          if (startedMs >= localMidnightMs || lastSeenMs >= localMidnightMs) {
            todayVisitorSet.add(vId)
          }

          // Bucket into hour if within last 24h
          const sDate = new Date(s.started_at || s.last_seen_at || Date.now())
          if (!isNaN(sDate.getTime()) && Date.now() - sDate.getTime() <= 24 * 60 * 60 * 1000) {
            const hKey = `${String(sDate.getHours()).padStart(2, '0')}:00`
            if (hourlyVisitorsMap.has(hKey)) {
              hourlyVisitorsMap.get(hKey)!.add(vId)
              const evCount = toSafeNum(s.event_count, 1)
              hourlyInteractionsMap.set(hKey, (hourlyInteractionsMap.get(hKey) || 0) + evCount)
            }
          }
        }
      }

      const rawActiveNow = toSafeNum(rawData.active_now, 0)
      const adjustedDbActive = adminWasActiveInDb ? Math.max(0, rawActiveNow - 1) : rawActiveNow
      const calculatedActiveNow = Math.max(
        adjustedDbActive,
        activeNowSet.size
      )

      const adjustedDbToday = adminWasActiveInDb ? Math.max(0, rawVisitorsToday - 1) : rawVisitorsToday
      let effectiveToday = Math.max(
        adjustedDbToday,
        todayVisitorSet.size
      )
      if (effectiveToday === 0 && rawInteractionsToday > 0) {
        effectiveToday = Math.min(rawInteractionsToday, Math.max(1, effectiveVisitors))
      }
      if (effectiveToday === 0 && calculatedActiveNow > 0) {
        effectiveToday = calculatedActiveNow
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
        totalPageviews?: number
        topReferrers?: Array<{ referrer: string; count: number }>
        dailyTimeSeries?: Array<{ date: string; pageviews: number; visitors: number }>
      }

      const vercelTraffic = vercelData && (vercelData as VercelPayload).configured ? (vercelData as VercelPayload) : null
      setIsVercelSynced(!!vercelTraffic && (toSafeNum(vercelTraffic.totalVisitors) > 0 || toSafeNum(vercelTraffic.totalPageviews) > 0))

      // 1. Unified Overview Cards: Merge Vercel macro audience into Supabase behavioral metrics
      let mergedOverview: AnalyticsOverviewData = {
        visitors: effectiveVisitors,
        visitors_prev: rawVisitorsPrev,
        visitors_today: effectiveToday,
        visitors_yesterday: rawVisitorsYesterday,
        active_now: calculatedActiveNow,
        interactions: calibratedInteractions,
        interactions_prev: rawInteractionsPrev,
        interactions_today: rawInteractionsToday,
        interactions_yesterday: rawInteractionsYesterday,
        project_opens: rawProjectOpens,
        external_clicks: rawExternalClicks,
        resume_downloads: rawResumeDownloads,
        sessions: Math.max(rawSessions, effectiveVisitors),
        avg_session_events: rawAvgEvents,
      }

      if (vercelTraffic) {
        const vVisitors = toSafeNum(vercelTraffic.totalVisitors, 0)

        // Total Visitors: take the maximum of Supabase unique visitor count and Vercel total visitors
        const unifiedVisitors = Math.max(effectiveVisitors, vVisitors)

        // Visitors Today: if Vercel has today's count, merge with Supabase
        const todayIso = new Date().toISOString().slice(0, 10)
        const vToday = toSafeNum(
          vercelTraffic.dailyTimeSeries?.find((d) => d.date === todayIso)?.visitors,
          0
        )
        const unifiedToday = Math.max(effectiveToday, vToday)

        // Sessions: at least match visitor count
        const unifiedSessions = Math.max(mergedOverview.sessions, vVisitors)

        mergedOverview = {
          ...mergedOverview,
          visitors: unifiedVisitors,
          visitors_today: unifiedToday,
          active_now: calculatedActiveNow,
          interactions: calibratedInteractions,
          sessions: unifiedSessions,
        }
      }
      setOverview(mergedOverview)

      // 2. Build Date Axis: Hourly for 1-day view (24h), Daily for multi-day views (7d, 30d)
      const isHourly = days === 1
      const dateKeys: string[] = []

      if (isHourly) {
        for (let h = 0; h < 24; h++) {
          dateKeys.push(`${String(h).padStart(2, '0')}:00`)
        }
      } else {
        const curDate = new Date(fromDate)
        const toDateFloor = new Date(toDate)
        while (curDate <= toDateFloor) {
          dateKeys.push(curDate.toISOString().slice(0, 10))
          curDate.setDate(curDate.getDate() + 1)
        }
        const todayIso = new Date().toISOString().slice(0, 10)
        if (!dateKeys.includes(todayIso)) {
          dateKeys.push(todayIso)
        }
      }

      // Build Vercel daily metrics map
      const vercelMap = new Map<string, { visitors: number; pageviews: number }>()
      if (vercelTraffic?.dailyTimeSeries && vercelTraffic.dailyTimeSeries.length > 0) {
        for (const item of vercelTraffic.dailyTimeSeries) {
          if (item?.date) {
            vercelMap.set(item.date, {
              visitors: toSafeNum(item.visitors, 0),
              pageviews: toSafeNum(item.pageviews, 0),
            })
          }
        }
      }

      // Extract unique visitors per day from recent sessions (failsafe against unmigrated SQL)
      const sessionsVisitorByDay = new Map<string, Set<string>>()
      if (Array.isArray(recentRes.data)) {
        for (const s of recentRes.data) {
          if (s?.started_at) {
            const day = String(s.started_at).slice(0, 10)
            const vId = String(s.visitor_short || s.session_id || '')
            if (vId) {
              if (!sessionsVisitorByDay.has(day)) {
                sessionsVisitorByDay.set(day, new Set())
              }
              sessionsVisitorByDay.get(day)!.add(vId)
            }
          }
        }
      }

      // Determine if Supabase analytics_timeseries for visitors returned raw event count (missing case branch)
      const rawVisitorsArray = Array.isArray(tsVisitorsRes.data) ? (tsVisitorsRes.data as TimeSeriesPoint[]) : []
      const rawVisitorsSum = rawVisitorsArray.reduce((acc, pt) => acc + toSafeNum(pt.count, 0), 0)
      const hasEventsFallbackBug = rawInteractions > 0 && rawVisitorsSum === rawInteractions && rawVisitorsSum > effectiveVisitors

      // Helper to match hourly point from RPC
      const matchHourlyCount = (arr: TimeSeriesPoint[], key: string): number => {
        const found = arr.find((p) => {
          const s = String(p.date || '')
          if (s.includes(':')) {
            return s.startsWith(key) || s.slice(11, 16) === key
          }
          try {
            const d = new Date(s)
            return !isNaN(d.getTime()) && `${String(d.getHours()).padStart(2, '0')}:00` === key
          } catch {
            return false
          }
        })
        return found ? toSafeNum(found.count, 0) : 0
      }

      // 2.1 Process 'visitors' series
      const processedVisitors: TimeSeriesPoint[] = dateKeys.map((key) => {
        if (isHourly) {
          const sessionCount = hourlyVisitorsMap.get(key)?.size || 0
          const rpcCount = matchHourlyCount(rawVisitorsArray, key)
          return { date: key, count: Math.max(sessionCount, rpcCount) }
        }

        let count = 0
        if (hasEventsFallbackBug) {
          count = sessionsVisitorByDay.get(key)?.size || 0
        } else {
          const found = rawVisitorsArray.find((p) => String(p.date || '').slice(0, 10) === key)
          count = found ? toSafeNum(found.count, 0) : (sessionsVisitorByDay.get(key)?.size || 0)
        }

        const v = vercelMap.get(key)
        if (v && v.visitors > 0) {
          count = Math.max(count, v.visitors)
        }

        const todayIso = new Date().toISOString().slice(0, 10)
        if (key === todayIso && effectiveToday > 0) {
          count = Math.max(count, effectiveToday)
        }

        return { date: key, count }
      })

      if (isHourly) {
        const visitorsSum = processedVisitors.reduce((acc, p) => acc + p.count, 0)
        if (visitorsSum === 0 && effectiveToday > 0) {
          const curHKey = `${String(new Date().getHours()).padStart(2, '0')}:00`
          const curPt = processedVisitors.find((p) => p.date === curHKey)
          if (curPt) {
            curPt.count = effectiveToday
          }
        }
      } else {
        const visitorsSum = processedVisitors.reduce((acc, p) => acc + p.count, 0)
        if (visitorsSum === 0 && effectiveVisitors > 0) {
          const lastPt = processedVisitors[processedVisitors.length - 1]
          if (lastPt) {
            lastPt.count = effectiveVisitors
          }
        }
      }

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
          const curHKey = `${String(new Date().getHours()).padStart(2, '0')}:00`
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
      if (peakTimeLabel.includes(':')) {
        const parts = peakTimeLabel.split(':')
        const firstHour = parts[0]
        const hour = firstHour ? parseInt(firstHour, 10) : NaN
        if (!isNaN(hour)) {
          const nextHour = (hour + 1) % 24
          peakTimeLabel = `${String(hour).padStart(2, '0')}:00 - ${String(nextHour).padStart(2, '0')}:00`
        }
      }
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
        const dateStr = String(pt.date || '')
        const parts = dateStr.split(':')
        const firstPart = parts[0]
        const h = firstPart ? parseInt(firstPart, 10) : NaN
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
    refetch: fetchData,
    fetchSessionDetail,
  }
}
