import { Skeleton } from '@heroui/react'
import '../../projects/components/ProjectLoadingSkeletons.css'

const AdminProjectRowSkeleton = () => {
  return (
    <div className="admin-project-row-skeleton admin-project-row border border-zinc-800 bg-[#16161b] p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4" aria-hidden="true">
      <Skeleton className="rounded-lg w-full sm:w-32 aspect-video shrink-0 bg-zinc-800/80" />
      <div className="flex-1 w-full flex flex-col gap-2">
        <Skeleton className="h-4 w-40 rounded-md bg-zinc-800" />
        <Skeleton className="h-3 w-64 rounded-md bg-zinc-800/60" />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-14 rounded-lg bg-zinc-800" />
        ))}
      </div>
    </div>
  )
}

export default AdminProjectRowSkeleton

