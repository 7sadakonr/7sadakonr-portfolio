import { Button } from '@heroui/react'
import PageHeader from './PageHeader'
import EmptyState from './EmptyState'

interface PageLoadStateProps {
  eyebrow: string
  title: string
  error: string | null
  onRetry?: () => void
}

// First-load placeholder (skeleton) or load failure (message + retry) for admin pages that fetch on mount.
const PageLoadState = ({ eyebrow, title, error, onRetry }: PageLoadStateProps) => (
  <section className="admin-page ad-narrow">
    <PageHeader eyebrow={eyebrow} title={title} />
    {error ? (
      <div className="ad-panel">
        <EmptyState
          title="Couldn't load this page"
          description={error}
          action={onRetry && <Button size="sm" variant="outline" onClick={onRetry}>Try again</Button>}
        />
      </div>
    ) : (
      <div className="ad-panel ad-form-stack" role="status" aria-label={`Loading ${title}`}>
        <div className="ad-skeleton" style={{ height: 24, width: '40%' }} />
        <div className="ad-skeleton" style={{ height: 40 }} />
        <div className="ad-skeleton" style={{ height: 112 }} />
      </div>
    )}
  </section>
)

export default PageLoadState
