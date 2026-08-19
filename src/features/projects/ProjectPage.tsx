import { useMemo } from 'react'
import AnimatedContent from '../../components/Animation/AnimatedContent'
import TextReveal from '../../components/Animation/TextReveal'
import { PROJECTS } from './data/projects'
import { createProjectSidebarItems } from './data/projectSidebarItems'
import ProjectCard from './components/ProjectCard'
import ProjectSidebar from './components/ProjectSidebar'
import { useActiveProject } from './hooks/useActiveProject'
import './ProjectPage.css'
const ProjectSection = () => {
  const { activeProjectIndex, setActiveProjectIndex, setProjectRef, scrollToProject } = useActiveProject()
  const sidebarItems = useMemo(() => createProjectSidebarItems(PROJECTS), [])

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

        <div className="projects-layout">
          <section className="projects-list">
            {PROJECTS.map((project, index) => (
              <AnimatedContent key={project.id} direction="up" distance={60} delay={index * 0.1} triggerOnce>
                <ProjectCard
                  project={project}
                  index={index}
                  projectRef={setProjectRef(index)}
                  onMouseProjectEnter={setActiveProjectIndex}
                />
              </AnimatedContent>
            ))}
          </section>
          <aside className="projects-sidebar">
            <ProjectSidebar items={sidebarItems} activeIndex={activeProjectIndex} onItemClick={scrollToProject} />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default ProjectSection
