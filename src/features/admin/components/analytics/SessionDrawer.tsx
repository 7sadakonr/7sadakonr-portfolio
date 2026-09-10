import { useEffect, useState } from 'react'
import type { SessionDetailData } from '../../hooks/useAnalytics'
import CountryFlag from './CountryFlag'

interface SessionDrawerProps {
  sessionId: string | null
  fetchDetail: (sessionId: string) => Promise<SessionDetailData | null>
  onClose: () => void
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function formatTime(isoStr: string): string {
  try {
    const d = new Date(isoStr)
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return isoStr
  }
}

const SessionDrawer = ({ sessionId, fetchDetail, onClose }: SessionDrawerProps) => {
  const [data, setData] = useState<SessionDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!sessionId) {
      setData(null)
      return
    }
    let isMounted = true
    setIsLoading(true)
    void fetchDetail(sessionId).then((res) => {
      if (isMounted) {
        setData(res)
        setIsLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [sessionId, fetchDetail])

  if (!sessionId) return null

  const s = data?.session
  const duration = s ? Math.max(0, Math.floor((new Date(s.last_seen_at).getTime() - new Date(s.started_at).getTime()) / 1000)) : 0

  return (
    <div className="analytics-drawer-backdrop" onClick={onClose}>
      <aside
        className="analytics-drawer analytics-drawer--wide"
        role="dialog"
        aria-modal="true"
        aria-label="Session Journey Details"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="analytics-drawer-header">
          <div>
            <span className="admin-eyebrow">Anonymous Visitor Journey</span>
            <h2 className="analytics-drawer-title">
              Visitor <code className="analytics-slug-badge">{s?.visitor_short || '...'}</code>
            </h2>
            <p className="analytics-drawer-subtitle text-muted">
              Session ID: {sessionId.slice(0, 18)}…
            </p>
          </div>
          <button type="button" className="analytics-drawer-close" onClick={onClose} aria-label="Close drawer">
            ✕
          </button>
        </div>

        <div className="analytics-drawer-content">
          {isLoading && <div className="text-center py-10 text-muted">Loading session journey…</div>}

          {!isLoading && s && (
            <>
              <div className="analytics-stat-tiles">
                <div className="analytics-tile">
                  <span className="analytics-tile-label">Duration</span>
                  <span className="analytics-tile-value">{formatDuration(duration)}</span>
                </div>
                <div className="analytics-tile">
                  <span className="analytics-tile-label">Events</span>
                  <span className="analytics-tile-value">{data.events.length}</span>
                </div>
                <div className="analytics-tile">
                  <span className="analytics-tile-label">Source</span>
                  <span className="analytics-tile-value">{s.utm_source || s.referrer_host || '(direct)'}</span>
                </div>
                <div className="analytics-tile">
                  <span className="analytics-tile-label">Device / Geo</span>
                  <div className="analytics-tile-geo">
                    {s.country && <CountryFlag code={s.country} size="md" />}
                    <span className="analytics-tile-geo-text">
                      {[
                        s.device_type ? s.device_type.charAt(0).toUpperCase() + s.device_type.slice(1) : null,
                        s.city,
                        s.country,
                      ]
                        .filter(Boolean)
                        .join(' • ') || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {s.utm_campaign && (
                <div className="analytics-drawer-section">
                  <h3>UTM Campaign Details</h3>
                  <div className="analytics-breakdown-row">
                    <span>Campaign</span>
                    <strong>{s.utm_campaign}</strong>
                  </div>
                  {s.utm_medium && (
                    <div className="analytics-breakdown-row">
                      <span>Medium</span>
                      <strong>{s.utm_medium}</strong>
                    </div>
                  )}
                  {s.landing_path && (
                    <div className="analytics-breakdown-row">
                      <span>Landing Path</span>
                      <strong>{s.landing_path}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="analytics-drawer-section">
                <h3>Event Timeline</h3>
                <div className="analytics-timeline">
                  {data.events.map((evt, idx) => (
                    <div key={`${evt.event_name}-${evt.created_at}-${idx}`} className="analytics-timeline-item">
                      <div className="analytics-timeline-dot" />
                      <div className="analytics-timeline-content">
                        <div className="analytics-timeline-top">
                          <span className="analytics-timeline-badge">{evt.event_name}</span>
                          <span className="analytics-timeline-time">{formatTime(evt.created_at)}</span>
                        </div>
                        <div className="analytics-timeline-label">
                          {evt.target_label || evt.project_slug || evt.section || evt.page || 'Action'}
                        </div>
                        {evt.destination_host && (
                          <small className="analytics-timeline-dest text-muted">
                            Outbound: {evt.destination_host}
                          </small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

export default SessionDrawer
