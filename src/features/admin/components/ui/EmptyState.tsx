import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  compact?: boolean
}

const EmptyState = ({ title, description, action, compact = false }: EmptyStateProps) => (
  <div className={`ad-empty${compact ? ' ad-empty--compact' : ''}`}>
    <p className="ad-empty__title">{title}</p>
    {description && <p className="ad-empty__text">{description}</p>}
    {action}
  </div>
)

export default EmptyState
