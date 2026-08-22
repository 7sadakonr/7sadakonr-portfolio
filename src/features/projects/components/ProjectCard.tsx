import type { RefCallback } from 'react'
import type { PublicProjectItem } from '../types'
import ImageMagnifier from './ImageMagnifier'
import ProjectTech from './ProjectTech'

interface ProjectCardProps {
  project: PublicProjectItem
  index: number
  projectRef: RefCallback<HTMLDivElement>
  onMouseProjectEnter: (index: number) => void
}

const ProjectCard = ({ project, index, projectRef, onMouseProjectEnter }: ProjectCardProps) => (
  <div
    className="project-card-wrapper"
    ref={projectRef}
    id={`project-${index}`}
    onPointerEnter={(event) => { if (event.pointerType === 'mouse') onMouseProjectEnter(index) }}
  >
    <div className="project-card">
      <div className="project-preview">
        <div className={`project-preview-inner${project.image ? '' : ' project-preview-inner--mockup'}`}>
          {project.image && <ImageMagnifier src={project.image} alt={project.title} />}
          {!project.image && (
            <div className="project-image-mockup" role="img" aria-label={`${project.title} project preview`}>
              <svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="8" y="11" width="48" height="42" rx="6" stroke="currentColor" strokeWidth="3" /><circle cx="23" cy="25" r="5" fill="currentColor" /><path d="m13 47 14-14 9 8 7-7 8 13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>PROJECT COVER</span>
            </div>
          )}
          {project.isInProgress && <span className="project-status-badge">In Progress</span>}
        </div>
      </div>
      <div className="project-info mobile-only-info">
        <p className="project-description">{project.description}</p>
        <ProjectTech tech={project.tech} />
        <div className="project-actions">
          {project.liveUrl && (
            <a href={project.liveUrl} className="project-btn primary" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
              Live Demo
            </a>
          )}
          {project.githubUrl && (
            <a href={project.githubUrl} className="project-btn secondary" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  </div>
)

export default ProjectCard
