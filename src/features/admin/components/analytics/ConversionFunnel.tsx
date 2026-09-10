import { useState } from 'react'
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
      accent: 'emerald',
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
      accent: 'purple',
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
      accent: 'blue',
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
      subtitle: 'Email, LinkedIn, or contact form',
      rate: contactRate,
      sessions: contactSessions,
      events: contactEvents,
      badge: 'Recruiter Outreach',
      accent: 'amber',
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
      <div className="analytics-panel-header analytics-intent-header">
        <div>
          <h2 className="analytics-section-title">Recruiter Intent &amp; Goals</h2>
          <p className="analytics-section-subtitle">
            Hiring milestones: resume downloads, project verification, and page retention
          </p>
        </div>

        <div className="analytics-intent-toggle" role="tablist" aria-label="View selection">
          <button
            type="button"
            className={`analytics-intent-tab ${activeView === 'goals' ? 'active' : ''}`}
            onClick={() => setActiveView('goals')}
            role="tab"
            aria-selected={activeView === 'goals'}
          >
            Conversion Goals
          </button>
          <button
            type="button"
            className={`analytics-intent-tab ${activeView === 'retention' ? 'active' : ''}`}
            onClick={() => setActiveView('retention')}
            role="tab"
            aria-selected={activeView === 'retention'}
          >
            Section Retention
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="analytics-intent-loading">
          <div className="analytics-spinner" />
          <span>Calculating intent metrics…</span>
        </div>
      )}

      {!isLoading && activeView === 'goals' && (
        <div className="analytics-intent-grid">
          {goals.map((goal) => (
            <div key={goal.id} className={`analytics-intent-card analytics-intent-card--${goal.accent}`}>
              <div className="analytics-intent-card-top">
                <div className="analytics-intent-icon-wrap">
                  <span className="analytics-intent-icon">{goal.icon}</span>
                  <span className="analytics-intent-card-title">{goal.title}</span>
                </div>
                <span className="analytics-intent-badge">{goal.badge}</span>
              </div>

              <div className="analytics-intent-rate-row">
                <span className="analytics-intent-rate">{goal.rate.toFixed(1)}%</span>
                <span className="analytics-intent-sessions">
                  {goal.sessions.toLocaleString()} {goal.sessions === 1 ? 'visitor' : 'visitors'}
                  {goal.events > goal.sessions && (
                    <small className="analytics-intent-events">({goal.events} total)</small>
                  )}
                </span>
              </div>

              <div className="analytics-intent-meter-track" aria-hidden="true">
                <div
                  className="analytics-intent-meter-fill"
                  style={{ width: `${Math.min(100, Math.max(2, goal.rate))}%` }}
                />
              </div>

              <p className="analytics-intent-subtitle">{goal.subtitle}</p>
            </div>
          ))}
        </div>
      )}

      {!isLoading && activeView === 'retention' && (
        <div className="analytics-retention-pipeline">
          {retentionSteps.map((step, idx) => {
            const prevStep = idx > 0 ? retentionSteps[idx - 1] : null
            const stepDrop = prevStep && prevStep.sessions > 0
              ? Math.max(0, Math.round(((prevStep.sessions - step.sessions) / prevStep.sessions) * 100))
              : 0

            return (
              <div key={step.section} className="analytics-retention-row">
                <div className="analytics-retention-meta">
                  <span className="analytics-retention-index">{idx + 1}</span>
                  <div className="analytics-retention-info">
                    <strong className="analytics-retention-label">{step.label}</strong>
                    <span className="analytics-retention-count">
                      {step.sessions.toLocaleString()} sessions
                    </span>
                  </div>
                </div>

                <div className="analytics-retention-progress">
                  <div className="analytics-retention-track">
                    <div
                      className="analytics-retention-fill"
                      style={{ width: `${Math.min(100, Math.max(3, step.rate))}%` }}
                    />
                  </div>
                </div>

                <div className="analytics-retention-stats">
                  <span className="analytics-retention-rate">{step.rate.toFixed(1)}% reach</span>
                  {idx > 0 && stepDrop > 0 && (
                    <span className="analytics-retention-drop">-{stepDrop}% drop</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ConversionFunnel
