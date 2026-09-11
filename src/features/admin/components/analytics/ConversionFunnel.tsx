import { useState } from 'react'
import { Chip, Tabs } from '@heroui/react'
import type { FunnelData } from '../../hooks/useAnalytics'

interface ConversionFunnelProps {
  data: FunnelData | null
  isLoading: boolean
}

type ActiveView = 'goals' | 'retention'

const ConversionFunnel = ({ data, isLoading }: ConversionFunnelProps) => {
  const [activeView, setActiveView] = useState<ActiveView>('goals')

  const toSafeNum = (v: unknown, fallback = 0): number =>
    typeof v === 'number' && !isNaN(v) && isFinite(v) ? v : fallback

  const totalSessions = toSafeNum(data?.sessions, 0)

  // 1. Recruiter Intent Goals
  const resumeSessions = toSafeNum(data?.goals?.resume_downloads?.sessions, toSafeNum(data?.converted, 0))
  const resumeEvents = toSafeNum(data?.goals?.resume_downloads?.events, resumeSessions)
  const resumeRate = toSafeNum(data?.goals?.resume_downloads?.rate, totalSessions > 0 ? (resumeSessions / totalSessions) * 100 : 0)

  const projectSessions = toSafeNum(data?.goals?.project_engagement?.sessions, toSafeNum(data?.opened_project, 0))
  const projectEvents = toSafeNum(data?.goals?.project_engagement?.events, projectSessions)
  const projectRate = toSafeNum(data?.goals?.project_engagement?.rate, totalSessions > 0 ? (projectSessions / totalSessions) * 100 : 0)

  const demoSessions = toSafeNum(data?.goals?.demo_views?.sessions, 0)
  const githubSessions = toSafeNum(data?.goals?.github_inspects?.sessions, 0)
  const codeSessions = (demoSessions || githubSessions) ? demoSessions + githubSessions : toSafeNum(data?.clicked_link, 0)
  const codeRate = (data?.goals?.demo_views?.rate !== undefined && data?.goals?.github_inspects?.rate !== undefined)
    ? Math.min(100, toSafeNum(data.goals.demo_views.rate) + toSafeNum(data.goals.github_inspects.rate))
    : (totalSessions > 0 ? (codeSessions / totalSessions) * 100 : 0)

  const contactSessions = toSafeNum(data?.goals?.contact_intents?.sessions, Math.max(0, toSafeNum(data?.converted, 0) - resumeSessions))
  const contactEvents = toSafeNum(data?.goals?.contact_intents?.events, contactSessions)
  const contactRate = toSafeNum(data?.goals?.contact_intents?.rate, totalSessions > 0 ? (contactSessions / totalSessions) * 100 : 0)

  const goals = [
    {
      id: 'resume',
      title: 'Resume Downloads',
      subtitle: 'Thai & English PDF downloads',
      rate: resumeRate,
      sessions: resumeSessions,
      events: resumeEvents,
      badge: 'High Intent',
      color: '#34d399',
      borderLeft: 'border-l-emerald-500',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
    },
    {
      id: 'projects',
      title: 'Project Deep Dives',
      subtitle: 'Cards opened & details explored',
      rate: projectRate,
      sessions: projectSessions,
      events: projectEvents,
      badge: 'Work Engagement',
      color: '#a78bfa',
      borderLeft: 'border-l-purple-500',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: 'code',
      title: 'Live Demos & GitHub',
      subtitle: 'Tested live app or inspected code',
      rate: codeRate,
      sessions: codeSessions,
      events: (data?.goals?.demo_views?.events ?? 0) + (data?.goals?.github_inspects?.events ?? 0) || codeSessions,
      badge: 'Proof of Work',
      color: '#60a5fa',
      borderLeft: 'border-l-blue-500',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      id: 'contact',
      title: 'Direct Inquiries',
      subtitle: 'Email, LinkedIn, or contact click',
      rate: contactRate,
      sessions: contactSessions,
      events: contactEvents,
      badge: 'Recruiter Outreach',
      color: '#fbbf24',
      borderLeft: 'border-l-amber-500',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
    },
  ]

  // 2. Section Retention Flow
  const retentionSteps = data?.section_retention && data.section_retention.length > 0
    ? data.section_retention.map((s) => ({
        ...s,
        sessions: toSafeNum(s.sessions, 0),
        rate: toSafeNum(s.rate, 0),
      }))
    : [
        { section: 'home', label: 'Hero / Landing', sessions: totalSessions, rate: 100 },
        { section: 'about', label: 'About & Skills', sessions: Math.round(totalSessions * 0.78), rate: totalSessions > 0 ? 78 : 0 },
        { section: 'projects', label: 'Projects Showcase', sessions: toSafeNum(data?.viewed_projects, 0), rate: totalSessions > 0 ? Math.round((toSafeNum(data?.viewed_projects, 0) / totalSessions) * 100) : 0 },
        { section: 'contact', label: 'Contact & Footer', sessions: toSafeNum(data?.converted, 0), rate: totalSessions > 0 ? Math.round((toSafeNum(data?.converted, 0) / totalSessions) * 100) : 0 },
      ]

  return (
    <div className="analytics-card-panel">
      <div className="analytics-panel-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="analytics-section-title">Recruiter Intent &amp; Conversion Goals</h2>
          <p className="analytics-section-subtitle">
            Hiring milestones: resume downloads, code proof, and section engagement
          </p>
        </div>

        {/* HeroUI Tabs for View Toggle */}
        <Tabs
          selectedKey={activeView}
          onSelectionChange={(key) => setActiveView(key as ActiveView)}
          aria-label="Conversion view"
        >
          <Tabs.List className="bg-[#1c1c24] border border-zinc-800 rounded-xl p-1 gap-1 flex items-center shadow-inner">
            <Tabs.Tab
              id="goals"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white transition-all cursor-pointer"
            >
              Conversion Goals
            </Tabs.Tab>
            <Tabs.Tab
              id="retention"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white transition-all cursor-pointer"
            >
              Section Retention
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-12 text-zinc-400 text-xs">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-violet-400 rounded-full animate-spin" />
          <span>Calculating intent metrics…</span>
        </div>
      )}

      {!isLoading && activeView === 'goals' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className={`p-4 rounded-xl bg-[#1c1c24] border border-zinc-800 border-l-4 ${goal.borderLeft} flex flex-col gap-2.5 transition-all hover:border-zinc-700/80`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                    style={{ backgroundColor: `${goal.color}18`, color: goal.color }}
                  >
                    {goal.icon}
                  </div>
                  <span className="text-xs font-bold text-white">{goal.title}</span>
                </div>
                <Chip size="sm" variant="soft" color="default" className="text-[10px] font-semibold text-zinc-400">
                  {goal.badge}
                </Chip>
              </div>

              <div className="flex items-baseline justify-between gap-2 mt-1">
                <span className="text-2xl font-extrabold text-white tracking-tight">{goal.rate.toFixed(1)}%</span>
                <span className="text-xs text-zinc-400 font-semibold">
                  {goal.sessions.toLocaleString()} <span className="font-normal text-zinc-500">sessions</span>
                </span>
              </div>

              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, goal.rate)}%`, backgroundColor: goal.color }}
                />
              </div>

              <p className="text-[11px] text-zinc-400 m-0">{goal.subtitle}</p>
            </div>
          ))}
        </div>
      )}

      {!isLoading && activeView === 'retention' && (
        <div className="flex flex-col gap-2.5">
          {retentionSteps.map((step, idx) => (
            <div
              key={step.section}
              className="p-3.5 rounded-xl bg-[#1c1c24] border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-[180px]">
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{step.label}</div>
                  <div className="text-[11px] text-zinc-400">{step.sessions.toLocaleString()} visitors reached</div>
                </div>
              </div>

              <div className="flex-1 w-full sm:mx-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, step.rate)}%` }}
                />
              </div>

              <div className="text-right min-w-[70px] self-end sm:self-auto">
                <span className="text-xs font-extrabold text-white">{step.rate.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ConversionFunnel
