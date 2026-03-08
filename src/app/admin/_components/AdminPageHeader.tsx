import { ReactNode } from 'react'

interface AdminPageHeaderProps {
  title: string
  subtitle: string
  children?: ReactNode
}

export function AdminPageHeader({ title, subtitle, children }: AdminPageHeaderProps) {
  return (
    <div className="adm-header">
      <div>
        <h1 className="adm-header__title">{title}</h1>
        <p className="adm-header__subtitle">{subtitle}</p>
      </div>
      {children && <div className="adm-header__actions">{children}</div>}
    </div>
  )
}
