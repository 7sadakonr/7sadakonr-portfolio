import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}

const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => (
  <header className="adm-page-header">
    <div className="adm-page-header__text">
      {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
      <h1 className="adm-page-title">{title}</h1>
      {description && <p className="adm-page-description">{description}</p>}
    </div>
    {actions && <div className="adm-page-header__actions">{actions}</div>}
  </header>
)

export default PageHeader
