import type { SkeletonPhase } from '../../hooks/useDelayedLoading'

// Kept apart from GithubCalendar so the section placeholder can use it without loading the calendar.
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

export const GithubStatsSkeleton = () => (
    <div className="github-calendar-stats" aria-hidden="true">
        {[0, 1, 2].map((index) => <div className="github-calendar-stat github-calendar-stat-skeleton" key={index} />)}
    </div>
)
