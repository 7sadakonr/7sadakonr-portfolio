import type { ReactNode } from 'react'
import EmptyState from './EmptyState'

interface PanelProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
  /** Shows a skeleton block instead of the body (first load only). */
  isLoading?: boolean
  /** Per-panel failure; the rest of the page keeps working. */
  error?: string | null
  /** When set, the body is replaced by an empty state. */
  empty?: { title: string; description?: ReactNode } | null
  className?: string
  bodyClassName?: string
  children?: ReactNode
}

const Panel = ({ title, description, actions, isLoading, error, empty, className = '', bodyClassName = '', children }: PanelProps) => {
  let body: ReactNode = children
  if (isLoading) body = <div className="ad-skeleton ad-skeleton--block" role="status" aria-label={`Loading ${title}`} />
  else if (error) body = <EmptyState compact title={`Couldn't load ${title.toLowerCase()}`} description={error} />
  else if (empty) body = <EmptyState compact title={empty.title} description={empty.description} />

  return (
    <section className={`ad-panel ${className}`.trim()} aria-label={title}>
      <header className="ad-panel__header">
        <div>
          <h2 className="ad-panel__title">{title}</h2>
          {description && <p className="ad-panel__description">{description}</p>}
        </div>
        {actions && <div className="ad-panel__actions">{actions}</div>}
      </header>
      <div className={`ad-panel__body ${bodyClassName}`.trim()}>{body}</div>
    </section>
  )
}

export default Panel
