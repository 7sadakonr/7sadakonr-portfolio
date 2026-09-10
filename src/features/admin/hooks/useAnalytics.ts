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

export interface FunnelData {
  sessions: number
  viewed_projects: number
  opened_project: number
  clicked_link: number
  converted: number
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
      ] = await Promise.all([
        supabase.rpc('analytics_overview', { p_from, p_to }),
        supabase.rpc('analytics_timeseries', { p_from, p_to, p_metric: metric }),
        supabase.rpc('analytics_utm_campaigns', { p_from, p_to }),
        supabase.rpc('analytics_project_performance', { p_from, p_to }),
        supabase.rpc('analytics_top_interactions', { p_from, p_to }),
        supabase.rpc('analytics_funnel', { p_from, p_to }),
        supabase.rpc('analytics_recent_sessions', { p_limit: 30 }),
      ])

      if (overviewRes.error) throw overviewRes.error
      if (timeseriesRes.error) throw timeseriesRes.error
      if (utmRes.error) throw utmRes.error
      if (projectRes.error) throw projectRes.error
      if (topRes.error) throw topRes.error
      if (funnelRes.error) throw funnelRes.error
      if (recentRes.error) throw recentRes.error

      setOverview(overviewRes.data as AnalyticsOverviewData)
      setTimeseries((timeseriesRes.data as TimeSeriesPoint[]) || [])
      setUtmCampaigns((utmRes.data as UtmCampaignRow[]) || [])
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
    refetch: fetchData,
    fetchSessionDetail,
  }
}
