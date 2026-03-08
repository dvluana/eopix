'use client'

import React from 'react'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <div className={`adm-layout${collapsed ? ' adm-layout--collapsed' : ''}`}>
      <AdminSidebar
        open={sidebarOpen}
        collapsed={collapsed}
        onToggle={() => setSidebarOpen((o) => !o)}
        onCollapse={() => setCollapsed((c) => !c)}
      />
      <main className="adm-main">{children}</main>
    </div>
  )
}
