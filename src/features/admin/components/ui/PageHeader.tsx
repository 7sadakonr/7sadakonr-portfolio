import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}

const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => (
  <header className="ad-page-header">
    <div className="ad-page-header__text">
      {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
      <h1 className="ad-page-title">{title}</h1>
      {description && <p className="ad-page-description">{description}</p>}
    </div>
    {actions && <div className="ad-page-header__actions">{actions}</div>}
  </header>
)

export default PageHeader
