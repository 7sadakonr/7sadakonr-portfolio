import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'
import { useAnalytics } from '../hooks/useAnalytics'
import { ANALYTICS_TIME_ZONE_LABEL, formatRelativeTime } from '../hooks/analyticsTime'
import PageHeader from '../components/ui/PageHeader'
import RangeSelector from '../components/analytics/RangeSelector'
import KpiRow from '../components/analytics/KpiRow'
import TrafficChart from '../components/analytics/TrafficChart'
import ProjectsPanel from '../components/analytics/ProjectsPanel'
import ReferrersPanel from '../components/analytics/ReferrersPanel'
import CampaignsPanel from '../components/analytics/CampaignsPanel'
import CountriesPanel from '../components/analytics/CountriesPanel'

// Re-renders the "Updated … ago" label without refetching.
const useNow = (intervalMs: number) => {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}

const AdminAnalyticsPage = () => {
  const {
    range, setRange, window, isLoading, isRefreshing, lastUpdated, errors, overview,
    timeseries, previousTimeseries, traffic, trafficStatus, campaigns, projects, refetch,
  } = useAnalytics()
  const now = useNow(15_000)

  return (
    <div className="admin-page ad-analytics">
      <PageHeader
        eyebrow="Analytics"
        title="Audience & engagement"
        description={`How people find and use your portfolio. All times are in ${ANALYTICS_TIME_ZONE_LABEL}.`}
        actions={
          <>
            <RangeSelector value={range} onChange={setRange} />
            <Button size="sm" variant="outline" isPending={isRefreshing} onClick={() => void refetch()} aria-label="Refresh analytics">
              Refresh
            </Button>
          </>
        }
      />

      <p className="ad-updated" role="status">
        {lastUpdated ? `Updated ${formatRelativeTime(lastUpdated, now)}` : 'Loading…'}
        {isRefreshing && ' · refreshing'}
      </p>

      <KpiRow
        range={range}
        overview={overview}
        timeseries={timeseries}
        traffic={traffic}
        trafficStatus={trafficStatus}
        isLoading={isLoading}
        overviewFailed={Boolean(errors.overview)}
      />
      {errors.overview && <p className="ad-inline-error" role="alert">Couldn&apos;t load totals: {errors.overview}</p>}

      <TrafficChart
        window={window}
        timeseries={timeseries}
        previousTimeseries={previousTimeseries}
        traffic={traffic}
        trafficStatus={trafficStatus}
        isLoading={isLoading}
        error={errors.timeseries}
      />

      <ProjectsPanel rows={projects} isLoading={isLoading} error={errors.projects} />

      <div className="ad-two-col">
        <ReferrersPanel traffic={traffic} status={trafficStatus} isLoading={isLoading} />
        <CountriesPanel traffic={traffic} status={trafficStatus} isLoading={isLoading} />
      </div>

      <CampaignsPanel rows={campaigns} isLoading={isLoading} error={errors.campaigns} />
    </div>
  )
}

export default AdminAnalyticsPage
