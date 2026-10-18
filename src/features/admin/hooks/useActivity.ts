import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getWindow, type AnalyticsWindow, type RangeKey } from './analyticsTime'
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

// Hour-by-hour activity: last 24 hours (+ the 24 before, for comparison) for the "this hour" row and log,
// a chart (daily for 7d / 30d) over the chosen range, and a daily last-30-days series for the calendar heatmap.
export function useActivity() {
  const [range, setRangeState] = useState<RangeKey>('24h')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [errors, setErrors] = useState<SectionErrors>({})
  const [window24, setWindow24] = useState<AnalyticsWindow>(() => getWindow('24h'))
  const [monthWindow, setMonthWindow] = useState<AnalyticsWindow>(() => getWindow('30d'))
  const [rangeWindow, setRangeWindow] = useState<AnalyticsWindow>(() => getWindow('24h'))
  const [timeseries, setTimeseries] = useState<SeriesPoint[]>([])
  const [previousTimeseries, setPreviousTimeseries] = useState<SeriesPoint[]>([])
  const [rangeSeries, setRangeSeries] = useState<SeriesPoint[]>([])
  const [rangePreviousSeries, setRangePreviousSeries] = useState<SeriesPoint[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [traffic, setTraffic] = useState<Traffic | null>(null)
  const [monthSeries, setMonthSeries] = useState<SeriesPoint[]>([])
  const [rangeTraffic, setRangeTraffic] = useState<Traffic | null>(null)
  const [trafficStatus, setTrafficStatus] = useState<TrafficStatus>('loading')
  const requestId = useRef(0)

  const fetchData = useCallback(async (background = false, selected: RangeKey = '24h') => {
    const client = supabase
    if (!client) {
      setErrors({ timeseries: 'Supabase is not configured.' })
      setIsLoading(false)
      return
    }

    const id = ++requestId.current
    const day = getWindow('24h')
    const chart = getWindow(selected)
    const wide = selected !== '24h'
    const month = getWindow('30d')
    const iso = (ms: number) => new Date(ms).toISOString()
    const dayBounds = { p_from: iso(day.start), p_to: iso(day.end) }
    const prevBounds = { p_from: iso(day.prevStart), p_to: iso(day.prevEnd) }
    const monthBounds = { p_from: iso(month.start), p_to: iso(month.end) }
    const chartBounds = { p_from: iso(chart.start), p_to: iso(chart.end) }
    const chartPrevBounds = { p_from: iso(chart.prevStart), p_to: iso(chart.prevEnd) }

    if (background) setIsRefreshing(true)
    else setIsLoading(true)

    const [seriesRes, prevRes, activityRes, trafficRes, chartRes, chartPrevRes, rangeTrafficRes, monthRes] = await Promise.allSettled([
      client.rpc('analytics_timeseries', { ...dayBounds, p_granularity: 'hour' }),
      client.rpc('analytics_timeseries', { ...prevBounds, p_granularity: 'hour' }),
      client.rpc('analytics_activity_hourly', dayBounds),
      fetchVercelTraffic(client, '24h'),
      wide ? client.rpc('analytics_timeseries', { ...chartBounds, p_granularity: 'day' }) : Promise.resolve(null),
      wide ? client.rpc('analytics_timeseries', { ...chartPrevBounds, p_granularity: 'day' }) : Promise.resolve(null),
      wide ? fetchVercelTraffic(client, selected) : Promise.resolve(null),
      // The 30d chart already holds this series, so only the other ranges need their own copy.
      selected === '30d' ? Promise.resolve(null) : client.rpc('analytics_timeseries', { ...monthBounds, p_granularity: 'day' }),
    ])

    if (id !== requestId.current) return

    const nextErrors: SectionErrors = {}
    const rpc = (result: PromiseSettledResult<{ data: unknown; error: unknown }>, section: SectionName) => unwrapRpc(result, section, nextErrors)

    const seriesData = rpc(seriesRes, 'timeseries')
    const prevData = rpc(prevRes, 'timeseries')
    const activityData = rpc(activityRes, 'activity')

    setWindow24(day)
    setRangeWindow(chart)
    setMonthWindow(month)
    if (seriesData !== null) setTimeseries(toSeries(seriesData))
    if (prevData !== null) setPreviousTimeseries(toSeries(prevData))
    if (selected !== '30d') {
      const monthData = rpc(monthRes as PromiseSettledResult<{ data: unknown; error: unknown }>, 'heatmap')
      if (monthData !== null) setMonthSeries(toSeries(monthData))
    }
    if (wide) {
      const chartData = rpc(chartRes as PromiseSettledResult<{ data: unknown; error: unknown }>, 'timeseries')
      const chartPrevData = rpc(chartPrevRes as PromiseSettledResult<{ data: unknown; error: unknown }>, 'timeseries')
      if (chartData !== null) setRangeSeries(toSeries(chartData))
      if (chartPrevData !== null) setRangePreviousSeries(toSeries(chartPrevData))
      if (rangeTrafficRes.status === 'fulfilled' && rangeTrafficRes.value) setRangeTraffic(parseTraffic(rangeTrafficRes.value))
      else setRangeTraffic(null)
    }
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
    void fetchData(false, range)
  }, [fetchData, range])

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') void fetchData(true, range)
    }
    const timer = setInterval(refreshIfVisible, POLL_MS)
    document.addEventListener('visibilitychange', refreshIfVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [fetchData, range])

  const refetch = useCallback(() => fetchData(true, range), [fetchData, range])
  const setRange = useCallback((next: RangeKey) => setRangeState(next), [])

  // For 24h the chart is the hourly series itself; wider ranges use their own daily series.
  const wide = range !== '24h'
  const chartWindow = wide ? rangeWindow : window24
  const chartSeries = wide ? rangeSeries : timeseries
  const chartPrevious = wide ? rangePreviousSeries : previousTimeseries
  const chartTraffic = wide ? rangeTraffic : traffic
  const calendarSeries = range === '30d' ? rangeSeries : monthSeries

  return useMemo(() => ({
    range, setRange, window24, monthWindow, chartWindow, isLoading, isRefreshing, lastUpdated, errors,
    timeseries, previousTimeseries, chartSeries, chartPrevious, chartTraffic, calendarSeries, activity, traffic, trafficStatus, refetch,
  }), [range, setRange, window24, monthWindow, chartWindow, isLoading, isRefreshing, lastUpdated, errors, timeseries, previousTimeseries, chartSeries, chartPrevious, chartTraffic, calendarSeries, activity, traffic, trafficStatus, refetch])
}
