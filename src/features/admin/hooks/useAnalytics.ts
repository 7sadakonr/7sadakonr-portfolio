import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getWindow, type AnalyticsWindow, type RangeKey } from './analyticsTime'
import { fetchVercelTraffic, messageOf, parseTraffic, toNumber, toRows, unwrapRpc, type TrafficStatus } from './analyticsFetch'

export interface MetricTotals {
  page_views: number
  project_opens: number
  resume_downloads: number
  github_clicks: number
  demo_clicks: number
}

export interface Overview {
  current: MetricTotals
  previous: MetricTotals
}

export interface SeriesPoint extends MetricTotals {
  date: string
}

export interface VisitorPoint {
  key: string
  visitors: number
}

export interface Traffic {
  visitors: { current: number | null; previous: number | null }
  series: VisitorPoint[]
  previousSeries: VisitorPoint[]
  seriesAvailable: boolean
  topReferrers: Array<{ referrer: string; count: number }>
  topCountries: Array<{ country: string; count: number }>
}

export interface CampaignRow {
  source: string
  campaign: string
  visits: number
  actions: number
}

export interface ProjectRow {
  slug: string
  title: string | null
  opens: number
  github_clicks: number
  demo_clicks: number
}

export type { TrafficStatus } from './analyticsFetch'
export type SectionName = 'overview' | 'timeseries' | 'traffic' | 'campaigns' | 'projects' | 'activity' | 'heatmap'
export type SectionErrors = Partial<Record<SectionName, string>>

const EMPTY_TOTALS: MetricTotals = { page_views: 0, project_opens: 0, resume_downloads: 0, github_clicks: 0, demo_clicks: 0 }
const POLL_MS = 60_000

const toTotals = (value: unknown): MetricTotals => {
  const record = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  return {
    page_views: toNumber(record.page_views),
    project_opens: toNumber(record.project_opens),
    resume_downloads: toNumber(record.resume_downloads),
    github_clicks: toNumber(record.github_clicks),
    demo_clicks: toNumber(record.demo_clicks),
  }
}

export function useAnalytics(initialRange: RangeKey = '7d') {
  const [range, setRange] = useState<RangeKey>(initialRange)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [errors, setErrors] = useState<SectionErrors>({})

  const [window, setWindow] = useState<AnalyticsWindow>(() => getWindow(initialRange))
  const [overview, setOverview] = useState<Overview | null>(null)
  const [timeseries, setTimeseries] = useState<SeriesPoint[]>([])
  const [previousTimeseries, setPreviousTimeseries] = useState<SeriesPoint[]>([])
  const [traffic, setTraffic] = useState<Traffic | null>(null)
  const [trafficStatus, setTrafficStatus] = useState<TrafficStatus>('loading')
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])

  const requestId = useRef(0)

  const fetchData = useCallback(async (background = false) => {
    const client = supabase
    if (!client) {
      setErrors({ overview: 'Supabase is not configured.' })
      setIsLoading(false)
      return
    }

    const id = ++requestId.current
    const win = getWindow(range)
    const iso = (ms: number) => new Date(ms).toISOString()
    const bounds = { p_from: iso(win.start), p_to: iso(win.end) }
    const prevBounds = { p_from: iso(win.prevStart), p_to: iso(win.prevEnd) }

    if (background) setIsRefreshing(true)
    else setIsLoading(true)

    const trafficRequest = fetchVercelTraffic(client, range)

    const [overviewRes, seriesRes, prevSeriesRes, campaignRes, projectRes, trafficRes] = await Promise.allSettled([
      client.rpc('analytics_overview', { ...bounds, p_prev_from: prevBounds.p_from, p_prev_to: prevBounds.p_to }),
      client.rpc('analytics_timeseries', { ...bounds, p_granularity: win.granularity }),
      client.rpc('analytics_timeseries', { ...prevBounds, p_granularity: win.granularity }),
      client.rpc('analytics_utm_campaigns', bounds),
      client.rpc('analytics_project_performance', bounds),
      trafficRequest,
    ])

    if (id !== requestId.current) return // a newer request (range change) superseded this one

    const nextErrors: SectionErrors = {}
    const rpc = (result: PromiseSettledResult<{ data: unknown; error: unknown }>, section: SectionName) => unwrapRpc(result, section, nextErrors)

    const overviewData = rpc(overviewRes, 'overview') as { current?: unknown; previous?: unknown } | null
    const seriesData = rpc(seriesRes, 'timeseries')
    const prevSeriesData = rpc(prevSeriesRes, 'timeseries')
    const campaignData = rpc(campaignRes, 'campaigns')
    const projectData = rpc(projectRes, 'projects')

    setWindow(win)
    if (overviewData) setOverview({ current: toTotals(overviewData.current), previous: toTotals(overviewData.previous) })
    if (seriesData !== null) setTimeseries(toRows<Record<string, unknown>>(seriesData).map((row) => ({ date: String(row.date), ...toTotals(row) })))
    if (prevSeriesData !== null) setPreviousTimeseries(toRows<Record<string, unknown>>(prevSeriesData).map((row) => ({ date: String(row.date), ...toTotals(row) })))
    if (campaignData !== null) {
      setCampaigns(toRows<Record<string, unknown>>(campaignData).map((row) => ({
        source: String(row.source ?? ''), campaign: String(row.campaign ?? ''), visits: toNumber(row.visits), actions: toNumber(row.actions),
      })))
    }
    if (projectData !== null) {
      setProjects(toRows<Record<string, unknown>>(projectData).map((row) => ({
        slug: String(row.slug ?? ''), title: typeof row.title === 'string' ? row.title : null,
        opens: toNumber(row.opens), github_clicks: toNumber(row.github_clicks), demo_clicks: toNumber(row.demo_clicks),
      })))
    }

    if (trafficRes.status === 'rejected') {
      nextErrors.traffic = messageOf(trafficRes.reason)
      setTrafficStatus('error')
    } else {
      const parsed = parseTraffic(trafficRes.value)
      setTraffic(parsed)
      setTrafficStatus(parsed ? 'ok' : 'unconfigured')
    }

    setErrors(nextErrors)
    setLastUpdated(new Date())
    setIsLoading(false)
    setIsRefreshing(false)
  }, [range])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // Keep data fresh while the tab is visible; refetch when the admin comes back to it.
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') void fetchData(true)
    }
    const timer = setInterval(refreshIfVisible, POLL_MS)
    document.addEventListener('visibilitychange', refreshIfVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [fetchData])

  const refetch = useCallback(() => fetchData(true), [fetchData])

  return useMemo(() => ({
    range, setRange, window, isLoading, isRefreshing, lastUpdated, errors,
    overview: overview ?? { current: EMPTY_TOTALS, previous: EMPTY_TOTALS },
    hasOverview: overview !== null,
    timeseries, previousTimeseries, traffic, trafficStatus, campaigns, projects, refetch,
  }), [range, window, isLoading, isRefreshing, lastUpdated, errors, overview, timeseries, previousTimeseries, traffic, trafficStatus, campaigns, projects, refetch])
}
