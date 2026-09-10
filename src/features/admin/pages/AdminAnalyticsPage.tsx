import { useAnalytics } from '../hooks/useAnalytics'
import DateRangeSelector from '../components/analytics/DateRangeSelector'
import OverviewCards from '../components/analytics/OverviewCards'
import InteractionChart from '../components/analytics/InteractionChart'
import UtmTable from '../components/analytics/UtmTable'
import ProjectPerformanceTable from '../components/analytics/ProjectPerformanceTable'
import TopInteractions from '../components/analytics/TopInteractions'
import ConversionFunnel from '../components/analytics/ConversionFunnel'
import RecentSessions from '../components/analytics/RecentSessions'

const AdminAnalyticsPage = () => {
  const {
    days,
    setDays,
    metric,
    setMetric,
    isLoading,
    error,
    overview,
    timeseries,
    trafficInsights,
    lastUpdated,
    utmCampaigns,
    projectPerformance,
    topInteractions,
    funnel,
    recentSessions,
    isVercelSynced,
    isVisitorDataAvailable,
    refetch,
    fetchSessionDetail,
  } = useAnalytics()

  const metricTotal = overview
    ? {
        visitors: overview.visitors,
        interactions: overview.interactions,
        project_opens: overview.project_opens,
        external_clicks: overview.external_clicks,
        resume_downloads: overview.resume_downloads,
      }[metric]
    : undefined

  return (
    <div className="admin-page analytics-page">
      {/* Page Header */}
      <header className="analytics-header">
        <div>
          <div className="analytics-eyebrow-row">
            <span className="admin-eyebrow">Behavioral &amp; Conversion Analytics</span>
            <div className="analytics-live-status-pill" title={`Auto-refreshes every 15 seconds. Last updated: ${lastUpdated.toLocaleTimeString()}`}>
              <span className="analytics-live-pulse-dot" />
              <span>Live Sync</span>
            </div>
            {isVercelSynced && (
              <span className="analytics-sync-indicator" title="Vercel Web Analytics is actively merged into all overview cards and the activity graph">
                <span className="analytics-sync-dot"></span>
                Unified with Vercel Web Analytics
              </span>
            )}
          </div>
          <h1 className="analytics-page-title">Portfolio Analytics</h1>
          <p className="analytics-page-description">
            Unified audience &amp; engagement: Vercel past traffic, custom project clicks, resume downloads, and visitor journeys.
          </p>
        </div>

        <div className="analytics-header-controls">
          <DateRangeSelector days={days} onChange={setDays} />
          <button
            type="button"
            className="analytics-action-refresh"
            onClick={() => void refetch()}
            disabled={isLoading}
            aria-label="Refresh analytics data"
          >
            <svg
              className={`analytics-refresh-icon ${isLoading ? 'spinning' : ''}`}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{isLoading ? 'Updating…' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="admin-form-error analytics-error-banner" role="alert">
          <p>⚠️ Unable to load analytics: {error}</p>
          <button type="button" className="admin-button" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      )}

      {/* 1. Key Performance Cards */}
      <section className="analytics-block" aria-label="Key behavioral metrics">
        <OverviewCards
          data={overview}
          days={days}
          isLoading={isLoading}
          activeMetric={metric}
          onSelectMetric={setMetric}
        />
      </section>

      {/* 2. Interactive Activity Chart */}
      <section className="analytics-block" aria-label="Activity timeline">
        <InteractionChart
          data={timeseries}
          metric={metric}
          onMetricChange={setMetric}
          isLoading={isLoading}
          isVisitorDataAvailable={isVisitorDataAvailable}
          metricTotal={metricTotal}
          days={days}
          insights={trafficInsights}
        />
      </section>

      {/* 3. Grid: UTM Attribution & Conversion Funnel */}
      <div className="analytics-grid-row">
        <section className="analytics-block" aria-label="Campaign performance">
          <UtmTable data={utmCampaigns} isLoading={isLoading} />
        </section>

        <section className="analytics-block" aria-label="Conversion funnel">
          <ConversionFunnel data={funnel} isLoading={isLoading} />
        </section>
      </div>

      {/* 4. Grid: Project Performance & Top Interactions */}
      <div className="analytics-grid-row">
        <section className="analytics-block" aria-label="Project engagement">
          <ProjectPerformanceTable data={projectPerformance} isLoading={isLoading} />
        </section>

        <section className="analytics-block" aria-label="Top interactions">
          <TopInteractions data={topInteractions} isLoading={isLoading} />
        </section>
      </div>

      {/* 5. Recent Visitor Journeys */}
      <section className="analytics-block" aria-label="Recent visitor journeys">
        <RecentSessions
          sessions={recentSessions}
          isLoading={isLoading}
          fetchDetail={fetchSessionDetail}
        />
      </section>
    </div>
  )
}

export default AdminAnalyticsPage
