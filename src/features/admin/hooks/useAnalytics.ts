import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export type DateRangeDays = 7 | 30 | 90

export interface AnalyticsOverviewData {
  visitors: number
  visitors_prev: number
  visitors_today: number
  visitors_yesterday: number
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

export interface TimeSeriesPoint {
  date: string
  count: number
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

  const [overview, setOverview] = useState<AnalyticsOverviewData | null>(null)
  const [timeseries, setTimeseries] = useState<TimeSeriesPoint[]>([])
  const [utmCampaigns, setUtmCampaigns] = useState<UtmCampaignRow[]>([])
  const [projectPerformance, setProjectPerformance] = useState<ProjectPerformanceRow[]>([])
  const [topInteractions, setTopInteractions] = useState<TopInteractionRow[]>([])
  const [funnel, setFunnel] = useState<FunnelData | null>(null)
  const [recentSessions, setRecentSessions] = useState<RecentSessionItem[]>([])

  const [isVercelSynced, setIsVercelSynced] = useState<boolean>(false)

  const fetchData = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const toDate = new Date()
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const p_from = fromDate.toISOString()
    const p_to = toDate.toISOString()

    try {
      const [
        overviewRes,
        timeseriesRes,
        utmRes,
        projectRes,
        topRes,
        funnelRes,
        recentRes,
        vercelData,
      ] = await Promise.all([
        supabase.rpc('analytics_overview', { p_from, p_to }),
        supabase.rpc('analytics_timeseries', { p_from, p_to, p_metric: metric }),
        supabase.rpc('analytics_utm_campaigns', { p_from, p_to }),
        supabase.rpc('analytics_project_performance', { p_from, p_to }),
        supabase.rpc('analytics_top_interactions', { p_from, p_to }),
        supabase.rpc('analytics_funnel', { p_from, p_to }),
        supabase.rpc('analytics_recent_sessions', { p_limit: 30 }),
        fetch(`/api/vercel-traffic?days=${days}`)
          .then(async (r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ])

      if (overviewRes.error) throw overviewRes.error
      if (timeseriesRes.error) throw timeseriesRes.error
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

      // Fallback derivation if visitors were missing from old Supabase RPC:
      let effectiveVisitors = rawVisitors
      if (effectiveVisitors === 0 && rawSessions > 0) {
        effectiveVisitors = rawSessions
      }
      if (effectiveVisitors === 0 && Array.isArray(recentRes.data) && recentRes.data.length > 0) {
        effectiveVisitors = new Set(recentRes.data.map((s: { visitor_short?: string; session_id?: string }) => s.visitor_short || s.session_id)).size
      }

      let effectiveToday = rawVisitorsToday
      if (effectiveToday === 0 && rawInteractionsToday > 0) {
        effectiveToday = Math.min(rawInteractionsToday, Math.max(1, effectiveVisitors))
      }

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
        interactions: rawInteractions,
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
        const vPageviews = toSafeNum(vercelTraffic.totalPageviews, 0)

        // Total Visitors: take the maximum of Supabase unique visitor count and Vercel total visitors
        const unifiedVisitors = Math.max(effectiveVisitors, vVisitors)

        // Visitors Today: if Vercel has today's count, merge with Supabase
        const todayIso = new Date().toISOString().slice(0, 10)
        const vToday = toSafeNum(
          vercelTraffic.dailyTimeSeries?.find((d) => d.date === todayIso)?.visitors,
          0
        )
        const unifiedToday = Math.max(effectiveToday, vToday)

        // Total Interactions: combine behavioral events with Vercel pageviews
        const unifiedInteractions = rawInteractions + vPageviews

        // Sessions: at least match visitor count
        const unifiedSessions = Math.max(mergedOverview.sessions, vVisitors)

        mergedOverview = {
          ...mergedOverview,
          visitors: unifiedVisitors,
          visitors_today: unifiedToday,
          interactions: unifiedInteractions,
          sessions: unifiedSessions,
        }
      }
      setOverview(mergedOverview)

      // 2. Unified Activity Time Series: Merge Vercel daily visitor/pageview trends with Supabase
      let mergedTimeseries: TimeSeriesPoint[] = []
      if (Array.isArray(timeseriesRes.data)) {
        mergedTimeseries = (timeseriesRes.data as TimeSeriesPoint[]).map((pt) => ({
          date: String(pt.date || ''),
          count: toSafeNum(pt.count, 0),
        }))
      }

      if (vercelTraffic?.dailyTimeSeries && vercelTraffic.dailyTimeSeries.length > 0) {
        const vMap = new Map<string, { visitors: number; pageviews: number }>()
        for (const item of vercelTraffic.dailyTimeSeries) {
          if (item?.date) {
            vMap.set(item.date, {
              visitors: toSafeNum(item.visitors, 0),
              pageviews: toSafeNum(item.pageviews, 0),
            })
          }
        }

        mergedTimeseries = mergedTimeseries.map((pt) => {
          const v = vMap.get(pt.date)
          if (!v) return pt
          if (metric === 'visitors') {
            return {
              ...pt,
              count: Math.max(pt.count, v.visitors),
            }
          }
          if (metric === 'interactions') {
            return {
              ...pt,
              count: pt.count + v.pageviews,
            }
          }
          return pt
        })
      }
      setTimeseries(mergedTimeseries)

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
      setRecentSessions((recentRes.data as RecentSessionItem[]) || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics data'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [days, metric])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

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
    timeseries,
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
