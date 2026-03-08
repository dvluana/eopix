import { ReactNode, FormEvent } from 'react'

interface AdminFilterBarProps {
  children: ReactNode
  onSubmit: () => void
}

export function AdminFilterBar({ children, onSubmit }: AdminFilterBarProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div className="adm-filters">
      <form onSubmit={handleSubmit} className="adm-filters__form">
        {children}
      </form>
    </div>
  )
}
