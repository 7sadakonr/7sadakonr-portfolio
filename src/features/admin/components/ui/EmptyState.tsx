import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  compact?: boolean
}

const EmptyState = ({ title, description, action, compact = false }: EmptyStateProps) => (
  <div className={`adm-empty${compact ? ' adm-empty--compact' : ''}`}>
    <p className="adm-empty__title">{title}</p>
    {description && <p className="adm-empty__text">{description}</p>}
    {action}
  </div>
)

export default EmptyState
