import LineSidebar from '../../../components/LineSidebar/LineSidebar'
import type { ProjectSidebarItem } from '../data/projectSidebarItems'

interface ProjectSidebarProps {
  items: ProjectSidebarItem[]
  activeIndex: number
  onItemClick: (index: number) => void
}

const ProjectSidebar = ({ items, activeIndex, onItemClick }: ProjectSidebarProps) => (
  <LineSidebar
    items={items}
    activeIndex={activeIndex}
    onItemClick={onItemClick}
    accentColor="#a855f7"
    fontSize={2.2}
  />
)

export default ProjectSidebar
