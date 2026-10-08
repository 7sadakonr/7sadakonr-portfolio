import { useEffect, useState } from 'react'
import { GithubActivitySkeleton, GithubStatsSkeleton } from '../GithubCalendar/GithubCalendarSkeleton'
import ProjectCardSkeleton from '../../features/projects/components/ProjectCardSkeleton'
import ProjectSidebarSkeleton from '../../features/projects/components/ProjectSidebarSkeleton'
import { PROJECT_HERO_SUBTITLE } from '../../features/projects/data/projectHeroCopy'
import { useSiteSettings } from '../../features/siteSettings/hooks/useSiteSettings'
import { firstVisibleContact, githubUsernameFromLink } from '../../features/siteSettings/validation/contactLinks'
import type { SkeletonPhase } from '../../hooks/useDelayedLoading'
import type { LazySectionId } from './sectionLoader'

interface SectionSkeletonProps {
  id: LazySectionId
  phase: SkeletonPhase
}

const SECTION_LABELS: Record<LazySectionId, string> = { about: 'About', projects: 'Projects', contact: 'Contact' }

// The real layout CSS ships with each lazy page chunk. Load it first so the skeleton is built from the
// same classes and lands exactly where the section will render.
const useLayoutCss = () => {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    void Promise.all([
      import('../../pages/LandingPage.css'),
      import('../GithubCalendar/GithubCalendar.css'),
    ]).then(() => { if (active) setReady(true) }, () => undefined)
    return () => { active = false }
  }, [])
  return ready
}

// Invisible copy of the real heading: reserves its exact height without repeating the reveal animation.
const HiddenHero = ({ prefix, title, subtitle, children }: { prefix: string; title: string; subtitle: string; children?: React.ReactNode }) => (
  <section className={`${prefix}-hero`} style={{ visibility: 'hidden' }} aria-hidden="true">
    <h1 className={`${prefix}-hero-title`}>{title}</h1>
    <p className={`${prefix}-hero-subtitle`}>{subtitle}</p>
    {children}
  </section>
)

// Real card contents rendered invisibly so each ghost card gets the real card's height.
const GhostCard = ({ name, title, children }: { name: string; title: string; children?: React.ReactNode }) => (
  <div className={`bento-card ${name} skeleton-ghost`} aria-hidden="true">
    <div style={{ visibility: 'hidden' }}>
      <div className="bento-header"><span className="bento-icon" /><h3 className="bento-title">{title}</h3></div>
      {children}
    </div>
  </div>
)

const SectionSkeleton = ({ id, phase }: SectionSkeletonProps) => {
  const cssReady = useLayoutCss()
  const settings = useSiteSettings()
  const githubUsername = githubUsernameFromLink(firstVisibleContact(settings.contactLinks, 'github'))
  const label = `Loading ${SECTION_LABELS[id]} section`

  return (
    <div className="lazy-section-placeholder lazy-section-skeleton" data-phase={phase} role="status" aria-label={label}>
      {cssReady && id === 'about' && (
        <div className="about-page-wrapper landing-section" style={{ minHeight: 0 }}>
          <div className="about-content" style={{ minHeight: 0 }}>
            <HiddenHero prefix="about" title={`Hi, I'm ${settings.displayName}`} subtitle={settings.heroSubtitle}>
              <span className="skeleton-ghost" style={{ display: 'block', width: 220, height: 52, borderRadius: 999 }} />
            </HiddenHero>
            <section className="about-bento-container">
              <div className="about-bento-layout">
                <div className="about-bento-grid">
                  <GhostCard name="bento-main" title="Biography">
                    <div className="about-me-text"><p>{settings.bioParagraph1}</p><p>{settings.bioParagraph2}</p></div>
                  </GhostCard>
                  <GhostCard name="bento-focus" title="Current Focus">
                    <div className="about-me-text"><p>{settings.currentFocus}</p></div>
                  </GhostCard>
                  <GhostCard name="bento-skills" title="Core Stack">
                    <div style={{ height: 110 }} />
                  </GhostCard>
                </div>
                {githubUsername && (
                  <div className="bento-card bento-github">
                    <div className="github-calendar">
                      <div className="github-calendar-content-shell"><GithubActivitySkeleton phase="visible" /></div>
                      <GithubStatsSkeleton />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
      {cssReady && id === 'projects' && (
        <div className="project-page-wrapper landing-section" style={{ minHeight: 0 }}>
          <div className="project-content" style={{ minHeight: 0 }}>
            <HiddenHero prefix="project" title="My Projects" subtitle={PROJECT_HERO_SUBTITLE} />
            <div className="projects-layout">
              <section className="projects-list">
                {Array.from({ length: 3 }, (_, index) => <ProjectCardSkeleton key={index} />)}
              </section>
              <aside className="projects-sidebar"><div className="sidebar-stack"><ProjectSidebarSkeleton phase="visible" /></div></aside>
            </div>
          </div>
        </div>
      )}
      {cssReady && id === 'contact' && (
        <div className="contact-page-wrapper landing-section" style={{ minHeight: 0 }}>
          <div className="contact-content" style={{ minHeight: 0 }}>
            <HiddenHero prefix="contact" title={settings.contactHeading} subtitle={settings.contactDescription} />
            <section className="contact-section">
              <div className="contact-grid">
                <div className="skeleton-ghost" style={{ minHeight: 522, borderRadius: 24 }} aria-hidden="true" />
                <div className="skeleton-ghost" style={{ minHeight: 480, borderRadius: 24 }} aria-hidden="true" />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

export default SectionSkeleton
