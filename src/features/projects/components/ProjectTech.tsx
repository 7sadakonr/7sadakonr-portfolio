import { getTechIcon } from '../data/projectTech'

interface ProjectTechProps {
  tech: readonly string[]
}

const ProjectTech = ({ tech }: ProjectTechProps) => (
  <div className="project-tech">
    <span className="tech-label">Tech Stack</span>
    <div className="tech-badges">
      {tech.map((technology, index) => {
        const iconId = getTechIcon(technology)
        return (
          <div key={index} className="tech-pill" title={technology}>
            {iconId && <img src={`/tech-icons/${iconId}.svg`} alt={technology} loading="lazy" decoding="async" style={{ width: '16px', height: '16px' }} />}
            <span>{technology}</span>
          </div>
        )
      })}
    </div>
  </div>
)

export default ProjectTech
