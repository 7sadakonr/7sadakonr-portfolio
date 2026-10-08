import type { SkeletonPhase } from '../../hooks/useDelayedLoading'

export const GithubActivitySkeleton = ({ phase }: { phase: SkeletonPhase }) => (
    <div
        className="github-calendar-activity-skeleton"
        data-phase={phase}
        aria-label="Loading GitHub contributions"
        role="status"
    >
        <div className="github-calendar-skeleton-header">
            <span className="github-calendar-skeleton-line github-calendar-skeleton-line--heading skeleton-ghost" aria-hidden="true" />
            <span className="github-calendar-skeleton-chip skeleton-ghost" aria-hidden="true" />
        </div>
        <div className="github-calendar-skeleton-heatmap skeleton-ghost" aria-hidden="true" />
        <span className="github-calendar-skeleton-line github-calendar-skeleton-line--panel skeleton-ghost" aria-hidden="true" />
    </div>
)
