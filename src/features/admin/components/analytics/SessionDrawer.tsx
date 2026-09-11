import { useEffect, useState } from 'react'
import { Drawer } from '@heroui/react'
import type { SessionDetailData } from '../../hooks/useAnalytics'
import CountryFlag from './CountryFlag'
import { getUtmSourceInfo, getEventNarrative } from './utmHelper'
import { ChannelIcon } from './ChannelIcon'

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
    <Drawer.Root isOpen={sessionId !== null} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Backdrop className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs" />
      <Drawer.Content
        placement="right"
        className="fixed inset-0 z-50 flex justify-end pointer-events-none bg-transparent border-0"
      >
        <Drawer.Dialog
          className="dark pointer-events-auto h-full w-full max-w-md sm:max-w-xl bg-[#16161b] text-white border-l border-zinc-800 shadow-2xl flex flex-col overflow-y-auto p-6 sm:p-7 relative ml-auto"
          data-theme="dark"
        >
          <Drawer.CloseTrigger
            className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ✕
          </Drawer.CloseTrigger>

          <Drawer.Header className="flex flex-col gap-1 border-b border-zinc-800/80 pb-5 pr-10">
            <span className="admin-eyebrow">Visitor Journey Inspection</span>
            <h2 className="text-xl font-extrabold text-white m-0 mt-1">
              Visitor <code className="font-mono text-sm text-violet-300 bg-violet-950/40 border border-violet-800/50 px-2 py-0.5 rounded-md">{s?.visitor_short || '...'}</code>
            </h2>
            <p className="text-xs text-zinc-500 m-0 mt-1 font-mono">
              Session: {sessionId.slice(0, 20)}…
            </p>
          </Drawer.Header>

          <Drawer.Body className="flex-1 flex flex-col gap-6 py-6">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-16 text-zinc-400 text-xs">
                <div className="w-5 h-5 border-2 border-zinc-600 border-t-violet-400 rounded-full animate-spin" />
                <span>Loading visitor journey…</span>
              </div>
            )}

            {!isLoading && s && (
              <>
                {/* Traffic Origin & Inbound Channel Banner */}
                {(() => {
                  const utm = getUtmSourceInfo(s.utm_source, s.utm_campaign, s.referrer_host)
                  return (
                    <div className={`p-4 rounded-xl flex items-center justify-between gap-3 flex-wrap ${utm.theme.bannerClass}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${utm.theme.iconBoxClass}`}>
                          <ChannelIcon channel={utm.theme.key} className="w-5 h-5 shrink-0" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                              Traffic Origin
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${utm.theme.badgeClass}`}>
                              {utm.theme.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <h4 className="text-sm font-extrabold text-white m-0">
                              {utm.originHeading}
                            </h4>
                            {s.utm_campaign && (
                              <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-900/90 border border-zinc-700/80 text-zinc-200">
                                campaign: <strong>{s.utm_campaign}</strong>
                              </span>
                            )}
                            {s.utm_medium && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-900/60 border border-zinc-800 text-zinc-400">
                                medium: {s.utm_medium}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {s.landing_path && (
                        <div className="text-xs text-zinc-400">
                          <span className="text-zinc-500 mr-1.5">Landed on:</span>
                          <code className="text-white font-mono bg-zinc-900/90 border border-zinc-800 px-2 py-0.5 rounded">
                            {s.landing_path}
                          </code>
                        </div>
                      )}
                    </div>
                  )
                })()}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#1c1c24] border border-zinc-800 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Device</span>
                    <span className="text-sm font-bold text-white capitalize">{s.device_type || 'Unknown'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1c1c24] border border-zinc-800 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Location</span>
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <CountryFlag code={s.country} showName size="sm" />
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1c1c24] border border-zinc-800 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Duration</span>
                    <span className="text-sm font-bold text-white">{formatDuration(duration)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1c1c24] border border-zinc-800 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Events</span>
                    <span className="text-sm font-bold text-violet-400">{data.events.length} actions</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider m-0">Step-by-Step Activity Timeline</h3>
                    <span className="text-[11px] font-medium text-zinc-400">
                      {data.events.length} {data.events.length === 1 ? 'action' : 'actions'}
                    </span>
                  </div>

                  <div className="flex flex-col pt-1">
                    {data.events.map((evt, idx) => {
                      const isLast = idx === data.events.length - 1
                      const narrative = getEventNarrative(evt)

                      return (
                        <div key={`${evt.event_name}-${evt.created_at}-${idx}`} className="flex items-start gap-3.5 pb-4 last:pb-1">
                          {/* Timeline Dot & Line */}
                          <div className="flex flex-col items-center self-stretch shrink-0 pt-1">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ring-4 ring-[#16161b] shrink-0 ${narrative.dotColor}`}
                            />
                            {!isLast && <span className="w-0.5 bg-zinc-800 flex-1 my-1" />}
                          </div>

                          {/* Timeline Content */}
                          <div className="flex-1 bg-[#1c1c24]/80 border border-zinc-800/90 hover:border-zinc-700/80 rounded-xl p-3.5 -mt-0.5 flex flex-col gap-1.5 transition-colors">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${narrative.badgeClass}`}>
                                  {narrative.badge}
                                </span>
                              </div>
                              <span className="text-[11px] text-zinc-400 font-mono">
                                {formatTime(evt.created_at)}
                              </span>
                            </div>

                            {/* Headline describing what the visitor did */}
                            <div>
                              <p className="text-xs font-bold text-white m-0 leading-snug">
                                {narrative.headline}
                              </p>
                              {narrative.subtext && (
                                <p className="text-[11px] text-zinc-400 m-0 mt-0.5 leading-normal">
                                  {narrative.subtext}
                                </p>
                              )}
                            </div>

                            {(evt.target_label || evt.project_slug) && (
                              <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-zinc-800/60 mt-0.5">
                                {evt.target_label && (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700/70 text-zinc-300 text-[11px] font-medium">
                                    <span className="text-zinc-500 text-[10px] uppercase font-semibold">Target</span>
                                    <strong className="text-white font-semibold">{evt.target_label}</strong>
                                  </span>
                                )}
                                {evt.project_slug && (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-violet-950/40 border border-violet-800/50 text-violet-300 text-[11px] font-mono">
                                    <span className="text-violet-400/70 text-[10px] uppercase font-semibold">Project</span>
                                    <strong className="text-violet-200">{evt.project_slug}</strong>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Root>
  )
}

export default SessionDrawer
