import { Drawer } from '@heroui/react'
import type { ProjectPerformanceRow } from '../../hooks/useAnalytics'

interface ProjectDrawerProps {
  project: ProjectPerformanceRow | null
  onClose: () => void
}

const ProjectDrawer = ({ project, onClose }: ProjectDrawerProps) => {
  if (!project) return null

  const totalClicks = project.github_clicks + project.demo_clicks
  const conversionRate = project.opens > 0 ? ((totalClicks / project.opens) * 100).toFixed(1) : '0.0'

  return (
    <Drawer.Root isOpen={project !== null} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Backdrop className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs" />
      <Drawer.Content
        placement="right"
        className="fixed inset-0 z-50 flex justify-end pointer-events-none bg-transparent border-0"
      >
        <Drawer.Dialog
          className="dark pointer-events-auto h-full w-full max-w-md sm:max-w-lg bg-[#16161b] text-white border-l border-zinc-800 shadow-2xl flex flex-col overflow-y-auto p-6 sm:p-7 relative ml-auto"
          data-theme="dark"
        >
          <Drawer.CloseTrigger
            className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ✕
          </Drawer.CloseTrigger>

          <Drawer.Header className="flex flex-col gap-1 border-b border-zinc-800/80 pb-5 pr-10">
            <span className="admin-eyebrow">Project Performance</span>
            <h2 className="text-xl font-extrabold text-white m-0 mt-1">
              {project.title || project.slug}
            </h2>
            <code className="inline-block mt-2 font-mono text-xs text-violet-300 bg-violet-950/40 border border-violet-800/50 px-2 py-0.5 rounded-md self-start">
              {project.slug}
            </code>
          </Drawer.Header>

          <Drawer.Body className="flex-1 flex flex-col gap-6 py-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-[#1c1c24] border border-zinc-800 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Project Opens</span>
                <span className="text-2xl font-extrabold text-white tracking-tight">{project.opens.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#1c1c24] border border-zinc-800 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Unique Visitors</span>
                <span className="text-2xl font-extrabold text-white tracking-tight">{project.visitors.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#1c1c24] border border-zinc-800 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">GitHub Clicks</span>
                <span className="text-2xl font-extrabold text-white tracking-tight">{project.github_clicks.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#1c1c24] border border-zinc-800 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Demo Clicks</span>
                <span className="text-2xl font-extrabold text-white tracking-tight">{project.demo_clicks.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#1c1c24] border border-zinc-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider m-0">Conversion Breakdown</h3>
              <div className="flex items-center justify-between text-xs py-2 border-b border-zinc-800/80">
                <span className="text-zinc-400">Click-Through Rate (Clicks / Opens)</span>
                <strong className="text-emerald-400 font-bold">{conversionRate}%</strong>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-zinc-800/80">
                <span className="text-zinc-400">Opens per Unique Visitor</span>
                <strong className="text-white font-bold">
                  {project.visitors > 0 ? (project.opens / project.visitors).toFixed(2) : '1.00'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-zinc-400">Total Outbound Link Clicks</span>
                <strong className="text-violet-400 font-bold">{totalClicks.toLocaleString()}</strong>
              </div>
            </div>
          </Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Root>
  )
}

export default ProjectDrawer
