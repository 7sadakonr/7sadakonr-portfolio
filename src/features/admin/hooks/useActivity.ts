import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getWindow, type AnalyticsWindow } from './analyticsTime'
import { fetchVercelTraffic, messageOf, parseTraffic, toNumber, toRows, unwrapRpc, type TrafficStatus } from './analyticsFetch'
import type { ActivityRow } from './analyticsActivity'
import type { SectionErrors, SectionName, SeriesPoint, Traffic } from './useAnalytics'

const POLL_MS = 60_000

const toSeries = (value: unknown): SeriesPoint[] =>
  toRows<Record<string, unknown>>(value).map((row) => ({
    date: String(row.date),
    page_views: toNumber(row.page_views),
    project_opens: toNumber(row.project_opens),
    resume_downloads: toNumber(row.resume_downloads),
    github_clicks: toNumber(row.github_clicks),
    demo_clicks: toNumber(row.demo_clicks),
  }))

// Hour-by-hour activity: last 24 hours (+ the 24 before, for comparison) and a 7-day grid for the heatmap.
export function useActivity() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [errors, setErrors] = useState<SectionErrors>({})
  const [window24, setWindow24] = useState<AnalyticsWindow>(() => getWindow('24h'))
  const [window7, setWindow7] = useState<AnalyticsWindow>(() => getWindow('7d'))
  const [timeseries, setTimeseries] = useState<SeriesPoint[]>([])
  const [previousTimeseries, setPreviousTimeseries] = useState<SeriesPoint[]>([])
  const [weekSeries, setWeekSeries] = useState<SeriesPoint[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [traffic, setTraffic] = useState<Traffic | null>(null)
  const [trafficStatus, setTrafficStatus] = useState<TrafficStatus>('loading')
  const requestId = useRef(0)

  const fetchData = useCallback(async (background = false) => {
    const client = supabase
    if (!client) {
      setErrors({ timeseries: 'Supabase is not configured.' })
      setIsLoading(false)
      return
    }

    const id = ++requestId.current
    const day = getWindow('24h')
    const week = getWindow('7d')
    const iso = (ms: number) => new Date(ms).toISOString()
    const dayBounds = { p_from: iso(day.start), p_to: iso(day.end) }
    const prevBounds = { p_from: iso(day.prevStart), p_to: iso(day.prevEnd) }
    const weekBounds = { p_from: iso(week.start), p_to: iso(week.end) }

    if (background) setIsRefreshing(true)
    else setIsLoading(true)

    const [seriesRes, prevRes, weekRes, activityRes, trafficRes] = await Promise.allSettled([
      client.rpc('analytics_timeseries', { ...dayBounds, p_granularity: 'hour' }),
      client.rpc('analytics_timeseries', { ...prevBounds, p_granularity: 'hour' }),
      client.rpc('analytics_timeseries', { ...weekBounds, p_granularity: 'hour' }),
      client.rpc('analytics_activity_hourly', dayBounds),
      fetchVercelTraffic(client, '24h'),
    ])

    if (id !== requestId.current) return

    const nextErrors: SectionErrors = {}
    const rpc = (result: PromiseSettledResult<{ data: unknown; error: unknown }>, section: SectionName) => unwrapRpc(result, section, nextErrors)

    const seriesData = rpc(seriesRes, 'timeseries')
    const prevData = rpc(prevRes, 'timeseries')
    const weekData = rpc(weekRes, 'heatmap')
    const activityData = rpc(activityRes, 'activity')

    setWindow24(day)
    setWindow7(week)
    if (seriesData !== null) setTimeseries(toSeries(seriesData))
    if (prevData !== null) setPreviousTimeseries(toSeries(prevData))
    if (weekData !== null) setWeekSeries(toSeries(weekData))
    if (activityData !== null) {
      setActivity(toRows<Record<string, unknown>>(activityData).map((row) => ({
        date: String(row.date),
        metric: String(row.metric),
        project_slug: String(row.project_slug ?? ''),
        title: typeof row.title === 'string' ? row.title : null,
        count: toNumber(row.count),
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
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

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
    window24, window7, isLoading, isRefreshing, lastUpdated, errors,
    timeseries, previousTimeseries, weekSeries, activity, traffic, trafficStatus, refetch,
  }), [window24, window7, isLoading, isRefreshing, lastUpdated, errors, timeseries, previousTimeseries, weekSeries, activity, traffic, trafficStatus, refetch])
}
