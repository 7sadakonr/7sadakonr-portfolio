import { useEffect, useMemo, useState } from 'react'
import { Button } from '@heroui/react'
import { useActivity } from '../hooks/useActivity'
import { buildHourLog, currentHourStats } from '../hooks/analyticsActivity'
import { ANALYTICS_TIME_ZONE_LABEL, formatRelativeTime, RANGE_OPTIONS } from '../hooks/analyticsTime'
import PageHeader from '../components/ui/PageHeader'
import RangeSelector from '../components/analytics/RangeSelector'
import TrafficChart from '../components/analytics/TrafficChart'
import ThisHourRow from '../components/activity/ThisHourRow'
import HourLog from '../components/activity/HourLog'
import ActivityHeatmap from '../components/activity/ActivityHeatmap'

const useNow = (intervalMs: number) => {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}

const AdminActivityPage = () => {
  const {
    range, setRange, window24, monthWindow, chartWindow, isLoading, isRefreshing, lastUpdated, errors,
    timeseries, previousTimeseries, chartSeries, chartPrevious, chartTraffic, calendarSeries, activity, traffic, trafficStatus, refetch,
  } = useActivity()
  const now = useNow(15_000)

  const stats = useMemo(
    () => currentHourStats(window24, timeseries, previousTimeseries, traffic),
    [window24, timeseries, previousTimeseries, traffic],
  )
  const hourLog = useMemo(() => buildHourLog(activity), [activity])

  return (
    <div className="admin-page adm-analytics">
      <PageHeader
        eyebrow="Activity"
        title="What's happening, hour by hour"
        description={`Live traffic and when people open projects or download your resume. All times are in ${ANALYTICS_TIME_ZONE_LABEL}.`}
        actions={
          <>
            <RangeSelector value={range} onChange={setRange} />
              <Button size="sm" variant="outline" isPending={isRefreshing} onClick={() => void refetch()} aria-label="Refresh activity">
              Refresh
            </Button>
          </>
        }
      />

      <p className="adm-updated" role="status">
        {lastUpdated ? `Updated ${formatRelativeTime(lastUpdated, now)} · refreshes every minute` : 'Loading…'}
      </p>

      <ThisHourRow stats={stats} trafficStatus={trafficStatus} isLoading={isLoading} failed={Boolean(errors.timeseries)} />

      <TrafficChart
        title={RANGE_OPTIONS.find((option) => option.key === range)?.long}
        markCurrent={range === '24h'}
        window={chartWindow}
        timeseries={chartSeries}
        previousTimeseries={chartPrevious}
        traffic={chartTraffic}
        trafficStatus={trafficStatus}
        isLoading={isLoading}
        error={errors.timeseries}
      />

      <HourLog entries={hourLog} isLoading={isLoading} error={errors.activity} />

      <ActivityHeatmap window={monthWindow} timeseries={calendarSeries} isLoading={isLoading} error={errors.heatmap} />
    </div>
  )
}

export default AdminActivityPage
