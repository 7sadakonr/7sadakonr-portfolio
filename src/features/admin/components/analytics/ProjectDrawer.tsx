import { Drawer } from '@heroui/react'
import type { ProjectRow } from '../../hooks/useAnalytics'

interface ProjectDrawerProps {
  project: ProjectRow | null
  onClose: () => void
}

const ProjectDrawer = ({ project, onClose }: ProjectDrawerProps) => {
  if (!project) return null

  const clicks = project.github_clicks + project.demo_clicks
  const rate = project.opens > 0 ? ((clicks / project.opens) * 100).toFixed(1) : '0.0'
  const stats: Array<[string, number]> = [
    ['Opens', project.opens],
    ['Outbound clicks', clicks],
    ['GitHub clicks', project.github_clicks],
    ['Demo clicks', project.demo_clicks],
  ]

  return (
    <Drawer.Root isOpen onOpenChange={(open) => !open && onClose()}>
      <Drawer.Backdrop className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs" />
      <Drawer.Content placement="right" className="fixed inset-0 z-50 flex justify-end pointer-events-none bg-transparent border-0">
        <Drawer.Dialog className="dark adm-drawer pointer-events-auto" data-theme="dark">
          <Drawer.CloseTrigger className="adm-drawer__close" onClick={onClose} aria-label="Close project details">✕</Drawer.CloseTrigger>

          <Drawer.Header className="adm-drawer__header">
            <span className="admin-eyebrow">Project performance</span>
            <h2 className="adm-drawer__title">{project.title || project.slug}</h2>
          </Drawer.Header>

          <Drawer.Body className="adm-drawer__body">
            <dl className="adm-drawer__stats">
              {stats.map(([label, value]) => (
                <div key={label} className="adm-drawer__stat">
                  <dt>{label}</dt>
                  <dd>{value.toLocaleString()}</dd>
                </div>
              ))}
            </dl>
            <p className="adm-drawer__rate">
              <span>Click-through rate</span>
              <strong>{rate}%</strong>
            </p>
            <p className="adm-drawer__note">Click-through rate is GitHub plus demo clicks divided by opens in the selected period.</p>
          </Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Root>
  )
}

export default ProjectDrawer
