import { useEffect, useState } from 'react'
import type { DateRangeDays } from '../../hooks/useAnalytics'

interface VercelTrafficData {
  configured: boolean
  message?: string
  totalPageviews?: number
  totalVisitors?: number
  topReferrers?: Array<{ referrer: string; count: number }>
  topCountries?: Array<{ country: string; count: number }>
  periodDays?: number
}

interface VercelTrafficBridgeProps {
  days: DateRangeDays
}

const VercelTrafficBridge = ({ days }: VercelTrafficBridgeProps) => {
  const [traffic, setTraffic] = useState<VercelTrafficData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)

    fetch(`/api/vercel-traffic?days=${days}`)
      .then(async (res) => {
        if (!res.ok) return { configured: false }
        return (await res.json()) as VercelTrafficData
      })
      .then((json) => {
        if (!isCancelled) {
          setTraffic(json)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setTraffic({ configured: false })
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [days])

  if (traffic?.configured) {
    return (
      <div className="analytics-vercel-connected-panel">
        <div className="analytics-vercel-top">
          <div className="analytics-vercel-identity">
            <span className="analytics-vercel-triangle">▲</span>
            <div>
              <div className="analytics-vercel-header-row">
                <strong>Vercel Web Analytics (Live Synced)</strong>
                <span className="analytics-badge-synced">● API Connected</span>
              </div>
              <span className="analytics-vercel-sub">
                Historical traffic, global page views, and inbound referrers pulled directly from Vercel API.
              </span>
            </div>
          </div>

          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="analytics-vercel-btn"
          >
            Open Vercel Dashboard ↗
          </a>
        </div>

        <div className="analytics-vercel-metrics-grid">
          <div className="analytics-vercel-metric-card">
            <span className="analytics-vercel-metric-label">Vercel Total Visitors</span>
            <div className="analytics-vercel-metric-val">
              {isLoading ? '--' : (traffic.totalVisitors ?? 0).toLocaleString()}
            </div>
            <small className="analytics-vercel-metric-hint">Across last {days} days from Vercel</small>
          </div>

          <div className="analytics-vercel-metric-card">
            <span className="analytics-vercel-metric-label">Vercel Total Pageviews</span>
            <div className="analytics-vercel-metric-val">
              {isLoading ? '--' : (traffic.totalPageviews ?? 0).toLocaleString()}
            </div>
            <small className="analytics-vercel-metric-hint">Raw page impressions</small>
          </div>

          <div className="analytics-vercel-metric-card analytics-vercel-metric-card--wide">
            <span className="analytics-vercel-metric-label">Top Referrers (Vercel)</span>
            <div className="analytics-vercel-chips">
              {isLoading && <span className="text-muted">Loading referrers…</span>}
              {!isLoading && (!traffic.topReferrers || traffic.topReferrers.length === 0) && (
                <span className="text-muted">Direct or not specified</span>
              )}
              {!isLoading &&
                traffic.topReferrers?.map((ref) => (
                  <span key={ref.referrer} className="analytics-vercel-pill">
                    <strong>{ref.referrer}</strong>
                    <small>{ref.count.toLocaleString()}</small>
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-vercel-banner">
      <div className="analytics-vercel-left">
        <span className="analytics-vercel-triangle" aria-hidden="true">
          ▲
        </span>
        <div className="analytics-vercel-copy">
          <div className="analytics-vercel-banner-title">
            <strong>Vercel Web Analytics Bridge</strong>
            <span className="analytics-badge-optional">Optional Historical Sync</span>
          </div>
          <span>
            {showSetup
              ? 'Follow the 2 steps below to display past visitors and pageviews directly on this dashboard:'
              : 'Global traffic & pageviews from before today are stored on Vercel. Connect Vercel API to view past visitors here.'}
          </span>
        </div>
      </div>

      <div className="analytics-vercel-actions">
        <button
          type="button"
          className="analytics-vercel-toggle-btn"
          onClick={() => setShowSetup(!showSetup)}
        >
          {showSetup ? 'Hide Setup Guide ✕' : 'Connect Past Vercel Data ⚡'}
        </button>
        <a
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="analytics-vercel-btn"
        >
          View in Vercel ↗
        </a>
      </div>

      {showSetup && (
        <div className="analytics-vercel-setup-card">
          <h4 className="analytics-setup-title">How to pull past Vercel visitors into this dashboard:</h4>
          <ol className="analytics-setup-list">
            <li>
              Go to{' '}
              <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer">
                vercel.com/account/tokens ↗
              </a>{' '}
              and click <strong>Create Token</strong> (Name: <code>portfolio-analytics</code>).
            </li>
            <li>
              In your <strong>Vercel Project Settings ➔ Environment Variables</strong>, add 2 separate variables:
              <div className="analytics-setup-env-box">
                <div><strong>Variable 1:</strong> Key: <code>VERCEL_TOKEN</code> | Value: <i>(Your Personal Access Token)</i></div>
                <div><strong>Variable 2:</strong> Key: <code>VERCEL_PROJECT_ID</code> | Value: <i>(Project ID from Project Settings ➔ General)</i></div>
              </div>
              <small>⚠️ In the <strong>Key</strong> box, enter ONLY <code>VERCEL_TOKEN</code> or <code>VERCEL_PROJECT_ID</code> (do not include spaces or "=").</small>
              <br />
              <small>Make sure to check <strong>Preview</strong> and <strong>Production</strong>.</small>
            </li>
            <li>
              Click <strong>Redeploy</strong> on Vercel. Once deployed, all historical visitors from Vercel will appear right here automatically!
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}

export default VercelTrafficBridge
