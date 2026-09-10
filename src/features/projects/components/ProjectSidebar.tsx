import LineSidebar, { type LineSidebarItem } from '../../../components/LineSidebar/LineSidebar'
import type { ProjectSidebarItem } from '../data/projectSidebarItems'

interface ProjectSidebarProps {
  items: ProjectSidebarItem[]
  activeIndex: number
  onItemClick: (index: number) => void
  onLiveClick?: (index: number, item: LineSidebarItem) => void
  onGithubClick?: (index: number, item: LineSidebarItem) => void
}

const ProjectSidebar = ({
  items,
  activeIndex,
  onItemClick,
  onLiveClick,
  onGithubClick,
}: ProjectSidebarProps) => (
  <LineSidebar
    items={items}
    activeIndex={activeIndex}
    onItemClick={onItemClick}
    onLiveClick={onLiveClick}
    onGithubClick={onGithubClick}
    accentColor="#a855f7"
    fontSize={2.2}
  />
)

export default ProjectSidebar
