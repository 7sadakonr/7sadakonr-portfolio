import { useMemo, useRef } from 'react'
import '../../pages/LandingPage.css'
import AnimatedContent from '../../components/Animation/AnimatedContent'
import TextReveal from '../../components/Animation/TextReveal'
import { createProjectSidebarItems } from './data/projectSidebarItems'
import { PROJECT_HERO_SUBTITLE } from './data/projectHeroCopy'
import ProjectCard from './components/ProjectCard'
import ProjectSidebar from './components/ProjectSidebar'
import ProjectCardSkeleton from './components/ProjectCardSkeleton'
import ProjectSidebarSkeleton from './components/ProjectSidebarSkeleton'
import { useActiveProject } from './hooks/useActiveProject'
import { useProjects } from './hooks/useProjects'
import { useSkeletonPresence } from '../../hooks/useDelayedLoading'
import { trackEvent } from '../../lib/analytics/trackEvent'

const PROJECT_SKELETON_COUNT = 3

const ProjectSection = () => {
  const { projects, isLoading, error, retry } = useProjects()
  const skeletonPhase = useSkeletonPresence(isLoading, { delayMs: 120 })
  const showSkeleton = skeletonPhase !== 'idle'

  const { activeProjectIndex, setActiveProjectIndex, setProjectRef, scrollToProject } = useActiveProject(projects.length)
  const sidebarItems = useMemo(() => createProjectSidebarItems(projects), [projects])
  const contentIsReady = !isLoading && !error && projects.length > 0
  // Latched on first ready render: cards replacing a visible skeleton fade in place instead of rising 16px.
  const replacedSkeleton = useRef<boolean | null>(null)
  if (contentIsReady && replacedSkeleton.current === null) replacedSkeleton.current = showSkeleton

  const handleSidebarItemClick = (index: number) => {
    scrollToProject(index)
    const project = projects[index]
    if (project) {
      trackEvent('project_open', {
        project_slug: project.id,
      })
    }
  }

  return (
    <div className="project-page-wrapper landing-section">
      <div className="project-content">
        <section className="project-hero">
          <TextReveal as="h1" className="project-hero-title" delay={0.1} stagger={0.07}>
            <span>My</span>
            <span className="gradient-text">
              <span className="gradient-text-glow">Projects</span>
              <span className="gradient-text-content">Projects</span>
            </span>
          </TextReveal>
          <TextReveal
            as="p"
            className="project-hero-subtitle"
            text={PROJECT_HERO_SUBTITLE}
            delay={0.25}
            stagger={0.025}
          />
        </section>

        <div className="projects-layout" aria-busy={isLoading || showSkeleton}>
          <section className="projects-list projects-list-transition-wrapper">
            {error && (
              <div className="projects-state projects-state--error" role="alert">
                <p>Unable to load projects.</p>
                <button type="button" onClick={retry}>Try again</button>
              </div>
            )}

            {!isLoading && !showSkeleton && !error && projects.length === 0 && (
              <div className="projects-state">No projects available.</div>
            )}

            {showSkeleton && !error && (
              <div className="projects-list-skeleton-wrapper" data-phase={skeletonPhase}>
                {Array.from({ length: PROJECT_SKELETON_COUNT }, (_, index) => (
                  <ProjectCardSkeleton key={index} />
                ))}
              </div>
            )}

            <div className={`projects-list-content-wrapper${contentIsReady ? ' skeleton-content-enter' : ''}`}>
              {contentIsReady && projects.map((project, index) => (
                <AnimatedContent key={project.id} direction="up" distance={replacedSkeleton.current ? 0 : 16} delay={index * 0.1} triggerOnce>
                  <ProjectCard
                    project={project}
                    index={index}
                    projectRef={setProjectRef(index)}
                    onMouseProjectEnter={setActiveProjectIndex}
                  />
                </AnimatedContent>
              ))}
            </div>
          </section>

          <aside className="projects-sidebar">
            <div className="sidebar-stack">
              {showSkeleton && !error && <ProjectSidebarSkeleton phase={skeletonPhase} />}

              <div className={contentIsReady ? 'skeleton-content-enter' : undefined}>
                {contentIsReady && (
                  <ProjectSidebar
                    items={sidebarItems}
                    activeIndex={activeProjectIndex}
                    onItemClick={handleSidebarItemClick}
                  />
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default ProjectSection
