import { useEffect, useMemo, useState } from 'react'
import { Button } from '@heroui/react'
import { useActivity } from '../hooks/useActivity'
import { buildHourLog, currentHourStats } from '../hooks/analyticsActivity'
import { ANALYTICS_TIME_ZONE_LABEL, formatRelativeTime } from '../hooks/analyticsTime'
import PageHeader from '../components/ui/PageHeader'
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
    window24, window7, isLoading, isRefreshing, lastUpdated, errors,
    timeseries, previousTimeseries, weekSeries, activity, traffic, trafficStatus, refetch,
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
          <Button size="sm" variant="outline" isPending={isRefreshing} onClick={() => void refetch()} aria-label="Refresh activity">
            Refresh
          </Button>
        }
      />

      <p className="adm-updated" role="status">
        {lastUpdated ? `Updated ${formatRelativeTime(lastUpdated, now)} · refreshes every minute` : 'Loading…'}
      </p>

      <ThisHourRow stats={stats} trafficStatus={trafficStatus} isLoading={isLoading} failed={Boolean(errors.timeseries)} />

      <TrafficChart
        title="Last 24 hours"
        markCurrent
        window={window24}
        timeseries={timeseries}
        previousTimeseries={previousTimeseries}
        traffic={traffic}
        trafficStatus={trafficStatus}
        isLoading={isLoading}
        error={errors.timeseries}
      />

      <HourLog entries={hourLog} isLoading={isLoading} error={errors.activity} />

      <ActivityHeatmap window={window7} timeseries={weekSeries} isLoading={isLoading} error={errors.heatmap} />
    </div>
  )
}

export default AdminActivityPage
