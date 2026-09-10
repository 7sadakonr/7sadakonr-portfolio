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
    utmCampaigns,
    projectPerformance,
    topInteractions,
    funnel,
    recentSessions,
    refetch,
    fetchSessionDetail,
  } = useAnalytics()

  return (
    <div className="admin-page analytics-page">
      {/* Vercel Web Analytics Banner */}
      <div className="analytics-vercel-banner">
        <div className="analytics-vercel-left">
          <span className="analytics-vercel-triangle" aria-hidden="true">
            ▲
          </span>
          <div className="analytics-vercel-copy">
            <strong>Vercel Web Analytics Active</strong>
            <span>Global traffic, pageviews, top referrers, and country distributions are hosted on Vercel.</span>
          </div>
        </div>
        <a
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="analytics-vercel-btn"
        >
          View Traffic in Vercel ↗
        </a>
      </div>

      {/* Page Header */}
      <header className="analytics-header">
        <div>
          <span className="admin-eyebrow">Behavioral &amp; Conversion Analytics</span>
          <h1 className="analytics-page-title">Portfolio Analytics</h1>
          <p className="analytics-page-description">
            Custom engagement tracking: project clicks, resume downloads, UTM attribution, and visitor journeys.
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
        <OverviewCards data={overview} isLoading={isLoading} />
      </section>

      {/* 2. Interactive Activity Chart */}
      <section className="analytics-block" aria-label="Activity timeline">
        <InteractionChart
          data={timeseries}
          metric={metric}
          onMetricChange={setMetric}
          isLoading={isLoading}
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
