import { useMemo } from 'react'
import '../../pages/LandingPage.css'
import AnimatedContent from '../../components/Animation/AnimatedContent'
import TextReveal from '../../components/Animation/TextReveal'
import { createProjectSidebarItems } from './data/projectSidebarItems'
import ProjectCard from './components/ProjectCard'
import ProjectSidebar from './components/ProjectSidebar'
import ProjectCardSkeleton from './components/ProjectCardSkeleton'
import ProjectSidebarSkeleton from './components/ProjectSidebarSkeleton'
import { useActiveProject } from './hooks/useActiveProject'
import { useProjects } from './hooks/useProjects'
import { useDelayedLoading } from '../../hooks/useDelayedLoading'

const ProjectSection = () => {
  const { projects, isLoading, error, retry } = useProjects()
  const showSkeleton = useDelayedLoading(isLoading, 180, 200)
  
  const { activeProjectIndex, setActiveProjectIndex, setProjectRef, scrollToProject } = useActiveProject(projects.length)
  const sidebarItems = useMemo(() => createProjectSidebarItems(projects), [projects])

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
            text="Explore my latest work showcasing creativity, technical skills, and passion for building meaningful digital experiences."
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

            <div className={`projects-list-skeleton-wrapper ${!showSkeleton ? 'fade-out' : ''}`}>
              {showSkeleton && !error && (
                <>
                  <ProjectCardSkeleton />
                  <ProjectCardSkeleton />
                  <ProjectCardSkeleton />
                </>
              )}
            </div>

            <div className={`projects-list-content-wrapper ${!showSkeleton && !isLoading && !error && projects.length > 0 ? 'fade-in' : 'pre-fade-in'}`}>
              {!showSkeleton && !error && projects.map((project, index) => (
                <AnimatedContent key={project.id} direction="up" distance={60} delay={index * 0.1} triggerOnce>
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
            <div className={`sidebar-fade-wrapper ${!showSkeleton ? 'fade-out' : ''}`}>
              {showSkeleton && !error && <ProjectSidebarSkeleton />}
            </div>
            
            <div className={`sidebar-fade-wrapper ${!showSkeleton && !isLoading && !error && projects.length > 0 ? 'fade-in' : 'pre-fade-in'}`}>
              {!showSkeleton && !error && projects.length > 0 && (
                <ProjectSidebar items={sidebarItems} activeIndex={activeProjectIndex} onItemClick={scrollToProject} />
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default ProjectSection
