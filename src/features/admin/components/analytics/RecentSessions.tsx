import { useState } from 'react'
import type { RecentSessionItem, SessionDetailData } from '../../hooks/useAnalytics'
import SessionDrawer from './SessionDrawer'

interface RecentSessionsProps {
  sessions: RecentSessionItem[]
  isLoading: boolean
  fetchDetail: (sessionId: string) => Promise<SessionDetailData | null>
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '< 10s'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function formatRelativeTime(isoStr: string): string {
  try {
    const diffMs = Date.now() - new Date(isoStr).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  } catch {
    return isoStr
  }
}

const RecentSessions = ({ sessions, isLoading, fetchDetail }: RecentSessionsProps) => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  return (
    <div className="analytics-card-panel">
      <div className="analytics-panel-header">
        <div>
          <h2 className="analytics-section-title">Recent Anonymous Visitor Journeys</h2>
          <p className="analytics-section-subtitle">
            Real visitor trails. Click any card to inspect their complete step-by-step event timeline.
          </p>
        </div>
      </div>

      <div className="analytics-sessions-grid">
        {isLoading && <div className="text-center py-8 text-muted">Loading recent sessions…</div>}
        {!isLoading && sessions.length === 0 && (
          <div className="text-center py-8 text-muted">No recent sessions recorded yet.</div>
        )}
        {!isLoading &&
          sessions.map((sess) => {
            const hasUtm = Boolean(sess.utm_source)
            const channel = sess.utm_source
              ? `${sess.utm_source}${sess.utm_campaign ? ` (${sess.utm_campaign})` : ''}`
              : sess.landing_path || 'Direct Visit'

            return (
              <div
                key={sess.session_id}
                className={`analytics-journey-card ${hasUtm ? 'has-utm' : ''}`}
                tabIndex={0}
                role="button"
                onClick={() => setActiveSessionId(sess.session_id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setActiveSessionId(sess.session_id)
                  }
                }}
              >
                <div className="analytics-journey-top">
                  <div className="analytics-journey-source-wrap">
                    <span className={`analytics-journey-badge ${hasUtm ? 'utm' : 'direct'}`}>
                      {hasUtm ? 'Campaign' : 'Direct'}
                    </span>
                    <strong className="analytics-journey-source" title={channel}>
                      {channel}
                    </strong>
                  </div>
                  <span className="analytics-journey-time">{formatRelativeTime(sess.started_at)}</span>
                </div>

                <div className="analytics-journey-metrics">
                  <div className="analytics-journey-stat">
                    <span className="analytics-stat-lbl">Duration</span>
                    <strong className="analytics-stat-val">{formatDuration(sess.duration_seconds)}</strong>
                  </div>
                  <div className="analytics-journey-stat">
                    <span className="analytics-stat-lbl">Activity</span>
                    <strong className="analytics-stat-val text-accent">{sess.event_count} events</strong>
                  </div>
                </div>

                <div className="analytics-journey-bottom">
                  <div className="analytics-chips">
                    <span className="analytics-chip-id">Visitor #{sess.visitor_short}</span>
                    {sess.device_type && <span className="analytics-chip-device">{sess.device_type}</span>}
                    {sess.country && <span className="analytics-chip-geo">📍 {sess.country}</span>}
                  </div>
                  <span className="analytics-inspect-link">View Trail →</span>
                </div>
              </div>
            )
          })}
      </div>

      {activeSessionId && (
        <SessionDrawer
          sessionId={activeSessionId}
          fetchDetail={fetchDetail}
          onClose={() => setActiveSessionId(null)}
        />
      )}
    </div>
  )
}

export default RecentSessions
