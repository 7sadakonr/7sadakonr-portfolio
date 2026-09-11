import { useState, useRef, useMemo } from 'react'
import { Chip } from '@heroui/react'
import type { RecentSessionItem, SessionDetailData } from '../../hooks/useAnalytics'
import SessionDrawer from './SessionDrawer'
import CountryFlag from './CountryFlag'
import { getUtmSourceInfo } from './utmHelper'
import { ChannelIcon } from './ChannelIcon'

interface RecentSessionsProps {
  sessions: RecentSessionItem[]
  isLoading: boolean
  fetchDetail: (sessionId: string) => Promise<SessionDetailData | null>
  fetchByDate?: (dateStr: string) => Promise<RecentSessionItem[]>
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '< 10s'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function toLocalDateString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateDisplay(dateStr: string): string {
  try {
    const parts = dateStr.split('-').map(Number)
    const year = parts[0]
    const month = parts[1]
    const day = parts[2]
    if (year === undefined || month === undefined || day === undefined || isNaN(year) || isNaN(month) || isNaN(day)) {
      return dateStr
    }
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDayLabel(dateStr: string): string {
  try {
    const parts = dateStr.split('-').map(Number)
    const year = parts[0]
    const month = parts[1]
    const day = parts[2]
    if (year === undefined || month === undefined || day === undefined || isNaN(year) || isNaN(month) || isNaN(day)) {
      return dateStr
    }
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return dateStr
  }
}

function formatSessionTime(isoStr: string): { relative: string; exact: string } {
  try {
    const d = new Date(isoStr)
    const diffMs = Date.now() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    let relative = 'Just now'
    if (diffMins >= 1 && diffMins < 60) relative = `${diffMins}m ago`
    else if (diffMins >= 60 && diffMins < 1440) relative = `${Math.floor(diffMins / 60)}h ago`
    else if (diffMins >= 1440) relative = `${Math.floor(diffMins / 1440)}d ago`

    const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return {
      relative,
      exact: `${dateStr} · ${timeStr}`,
    }
  } catch {
    return { relative: isoStr, exact: isoStr }
  }
}

const RecentSessions = ({ sessions, isLoading, fetchDetail, fetchByDate }: RecentSessionsProps) => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const todayStr = toLocalDateString(new Date())
  const yesterdayStr = toLocalDateString(new Date(Date.now() - 86400000))

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all')
  const [customDate, setCustomDate] = useState<string>('')
  const [fetchedByDate, setFetchedByDate] = useState<RecentSessionItem[] | null>(null)
  const [isDateLoading, setIsDateLoading] = useState<boolean>(false)

  // Other historical active days in currently loaded sessions (e.g. 2-3 days ago)
  const otherActiveDays = useMemo(() => {
    const set = new Set<string>()
    for (const s of sessions) {
      if (s.started_at) {
        const dStr = toLocalDateString(new Date(s.started_at))
        if (dStr !== todayStr && dStr !== yesterdayStr) {
          set.add(dStr)
        }
      }
    }
    return Array.from(set).sort().reverse().slice(0, 3)
  }, [sessions, todayStr, yesterdayStr])

  const openDatePicker = () => {
    const input = dateInputRef.current
    if (!input) return
    try {
      if ('showPicker' in HTMLInputElement.prototype) {
        input.showPicker()
      } else {
        input.focus()
      }
    } catch {
      input.focus()
    }
  }

  const handleFilterChange = async (filter: 'all' | 'today' | 'yesterday' | 'custom', dateVal?: string) => {
    setSelectedFilter(filter)

    if (filter === 'all') {
      setFetchedByDate(null)
      setCustomDate('')
      return
    }

    const targetDate =
      filter === 'today' ? todayStr : filter === 'yesterday' ? yesterdayStr : dateVal || customDate || todayStr

    if (filter === 'custom' && dateVal) {
      setCustomDate(dateVal)
    }

    // 1. Immediately find local matches in memory so UI updates instantly
    const localMatches = sessions.filter((s) => {
      if (!s.started_at) return false
      return toLocalDateString(new Date(s.started_at)) === targetDate
    })
    setFetchedByDate(localMatches)

    // 2. If fetchByDate hook is provided, query on demand to get complete visits from DB
    if (fetchByDate) {
      setIsDateLoading(true)
      try {
        const results = await fetchByDate(targetDate)
        if (results && results.length > 0) {
          const existingIds = new Set(results.map((r) => r.session_id))
          const merged = [...results, ...localMatches.filter((m) => !existingIds.has(m.session_id))]
          setFetchedByDate(merged)
        }
      } catch {
        // Retain localMatches on error
      } finally {
        setIsDateLoading(false)
      }
    }
  }

  const activeTargetDate =
    selectedFilter === 'today'
      ? todayStr
      : selectedFilter === 'yesterday'
        ? yesterdayStr
        : selectedFilter === 'custom'
          ? customDate
          : null

  const displayedSessions =
    selectedFilter === 'all'
      ? sessions
      : fetchedByDate !== null
        ? fetchedByDate
        : sessions.filter((s) => {
            if (!s.started_at || !activeTargetDate) return false
            return toLocalDateString(new Date(s.started_at)) === activeTargetDate
          })

  return (
    <div className="analytics-card-panel">
      {/* Panel Header with Date Selection Controls */}
      <div className="analytics-panel-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="analytics-section-title">Recent Anonymous Visitor Journeys</h2>
            {selectedFilter !== 'all' && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-950/70 border border-violet-700/60 text-violet-300">
                Filtered Day
              </span>
            )}
          </div>
          <p className="analytics-section-subtitle">
            Real visitor trails with referral origin detection. Filter by day or pick any date to inspect historical visits.
          </p>
        </div>

        {/* Date Filter Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="inline-flex items-center bg-[#1c1c24] border border-zinc-800 rounded-xl p-1 gap-1 shadow-inner"
            role="group"
            aria-label="Recent journeys date filter presets"
          >
            <button
              type="button"
              aria-label="Filter all recent"
              onClick={() => void handleFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Recent
            </button>

            <button
              type="button"
              aria-label="Filter today"
              onClick={() => void handleFilterChange('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === 'today'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              aria-label="Filter yesterday"
              onClick={() => void handleFilterChange('yesterday')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === 'yesterday'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Yesterday
            </button>

            {/* Quick buttons for other active days in current dataset */}
            {otherActiveDays.map((dateStr) => {
              const isActive = selectedFilter === 'custom' && customDate === dateStr
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => void handleFilterChange('custom', dateStr)}
                  className={`hidden sm:inline-block px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={`Filter journeys on ${formatDateDisplay(dateStr)}`}
                >
                  {formatDayLabel(dateStr)}
                </button>
              )
            })}
          </div>

          {/* Calendar Date Picker Interactive Wrapper */}
          <div
            role="button"
            tabIndex={0}
            onClick={openDatePicker}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openDatePicker()
              }
            }}
            className={`inline-flex items-center gap-1.5 bg-[#1c1c24] border rounded-xl px-2.5 py-1 transition-all cursor-pointer ${
              selectedFilter === 'custom' && !otherActiveDays.includes(customDate)
                ? 'border-violet-500/80 bg-[#221c2e]'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
            title="Click to pick a specific date"
          >
            <svg
              className="w-3.5 h-3.5 text-zinc-400 shrink-0 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <label htmlFor="analytics-date-picker" className="sr-only">
              Select specific date
            </label>
            <input
              ref={dateInputRef}
              id="analytics-date-picker"
              type="date"
              max={todayStr}
              value={selectedFilter === 'custom' ? customDate : ''}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker()
                } catch {
                  // Fallback
                }
              }}
              onChange={(e) => {
                if (e.target.value) {
                  void handleFilterChange('custom', e.target.value)
                }
              }}
              className="bg-transparent text-xs text-zinc-200 font-mono outline-none cursor-pointer [color-scheme:dark]"
              title="Pick a specific date to view"
            />
            {selectedFilter !== 'all' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  void handleFilterChange('all')
                }}
                className="text-zinc-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors text-xs font-bold leading-none"
                title="Clear date filter and view all recent"
                aria-label="Clear date filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtered State Banner */}
      {selectedFilter !== 'all' && activeTargetDate && (
        <div className="flex items-center justify-between text-xs px-3.5 py-2 mb-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-zinc-300 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span>
              Showing visitor journeys for <strong>{formatDateDisplay(activeTargetDate)}</strong> (
              {isDateLoading ? 'Loading…' : `${displayedSessions.length} journeys`})
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleFilterChange('all')}
            className="text-violet-400 hover:text-violet-300 text-xs font-semibold cursor-pointer underline underline-offset-2"
          >
            Show all recent
          </button>
        </div>
      )}

      {/* Grid or States */}
      <div className="analytics-sessions-grid">
        {(isLoading || isDateLoading) && (
          <div className="col-span-full text-center py-12 text-zinc-400">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-zinc-600 border-t-violet-400 rounded-full animate-spin" />
              <span>
                {isDateLoading && activeTargetDate
                  ? `Loading journeys for ${formatDateDisplay(activeTargetDate)}…`
                  : 'Loading recent sessions…'}
              </span>
            </div>
          </div>
        )}

        {!isLoading && !isDateLoading && displayedSessions.length === 0 && (
          <div className="col-span-full text-center py-12 px-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/80 my-2">
            <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="font-semibold text-white mb-1">
              {selectedFilter !== 'all' && activeTargetDate
                ? `No visitor journeys recorded on ${formatDateDisplay(activeTargetDate)}`
                : 'No recent sessions recorded yet.'}
            </p>
            <p className="text-xs text-zinc-400 mb-4">
              {selectedFilter !== 'all'
                ? 'No visitor activity was logged during this calendar day.'
                : 'New visitor journeys will appear here automatically when visitors browse your portfolio.'}
            </p>
            {selectedFilter !== 'all' && (
              <button
                type="button"
                onClick={() => void handleFilterChange('all')}
                className="text-xs px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 font-medium transition-colors cursor-pointer"
              >
                Return to All Recent Journeys
              </button>
            )}
          </div>
        )}

        {!isLoading &&
          !isDateLoading &&
          displayedSessions.map((sess) => {
            const utm = getUtmSourceInfo(sess.utm_source, sess.utm_campaign, sess.referrer_host)
            const isExternalOrigin = utm.theme.key !== 'direct'
            const originText = isExternalOrigin
              ? `From ${utm.originLabel}`
              : sess.landing_path
                ? `Direct (${sess.landing_path})`
                : 'Direct Visit'
            const timeInfo = formatSessionTime(sess.started_at)

            return (
              <div
                key={sess.session_id}
                className={`analytics-journey-card ${utm.theme.cardClass}`}
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
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md ${utm.theme.badgeClass}`}
                    >
                      <ChannelIcon channel={utm.theme.key} className="w-3.5 h-3.5 shrink-0" />
                      <span>{utm.theme.label}</span>
                    </span>
                    <strong className="analytics-journey-source" title={originText}>
                      {originText}
                    </strong>
                  </div>
                  <span
                    className="analytics-journey-time"
                    title={
                      sess.started_at
                        ? new Date(sess.started_at).toLocaleString(undefined, {
                            dateStyle: 'full',
                            timeStyle: 'medium',
                          })
                        : ''
                    }
                  >
                    <span className="text-zinc-300 font-medium">{timeInfo.exact}</span>
                    <span className="text-zinc-500 text-[11px] ml-1.5">({timeInfo.relative})</span>
                  </span>
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
                    <Chip size="sm" variant="soft" className="analytics-chip-id">
                      Visitor #{sess.visitor_short}
                    </Chip>
                    {sess.device_type && (
                      <Chip size="sm" variant="soft" className="analytics-chip-device">
                        {sess.device_type}
                      </Chip>
                    )}
                    {sess.country && (
                      <span className="analytics-chip-geo">
                        <CountryFlag code={sess.country} size="sm" showCode />
                      </span>
                    )}
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
