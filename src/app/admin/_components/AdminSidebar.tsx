'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import LogoFundoPreto from '@/components/LogoFundoPreto'
import {
  LayoutDashboard,
  ShieldBan,
  Activity,
  ShoppingCart,
  Users,
  LogOut,
  FileSearch,
  Menu,
  X,
  ChevronsLeft,
  Radio,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/compras', label: 'Compras', icon: ShoppingCart },
  { href: '/admin/blocklist', label: 'Blocklist', icon: ShieldBan },
  { href: '/admin/health', label: 'Health', icon: Activity },
  { href: '/admin/monitor', label: 'Monitor', icon: Radio },
  { href: '/admin/leads', label: 'Leads', icon: Users },
]

interface AdminSidebarProps {
  open: boolean
  collapsed: boolean
  onToggle: () => void
  onCollapse: () => void
}

export function AdminSidebar({ open, collapsed, onToggle, onCollapse }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore error
    }
    router.push('/admin/login')
  }

  const sidebarClass = [
    'adm-sidebar',
    open && 'adm-sidebar--open',
    collapsed && 'adm-sidebar--collapsed',
  ].filter(Boolean).join(' ')

  return (
    <>
      {/* Mobile toggle */}
      <button className="adm-sidebar-toggle" onClick={onToggle} aria-label="Menu">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="adm-sidebar-overlay adm-sidebar-overlay--visible"
          onClick={onToggle}
        />
      )}

      <aside className={sidebarClass}>
        <div className="adm-sidebar__logo">
          <Link href="/admin" className="adm-sidebar__logo-img">
            <LogoFundoPreto />
          </Link>
          <div className="adm-sidebar__label">Admin Panel</div>
        </div>

        <nav className="adm-sidebar__nav">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`adm-sidebar__link${isActive ? ' adm-sidebar__link--active' : ''}`}
                onClick={onToggle}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} />
                <span className="adm-sidebar__link-text">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="adm-sidebar__footer">
          <Link href="/minhas-consultas" className="adm-sidebar__action" title={collapsed ? 'Minhas Consultas' : undefined}>
            <FileSearch size={18} />
            <span className="adm-sidebar__action-text">Minhas Consultas</span>
          </Link>
          <button onClick={handleLogout} className="adm-sidebar__action" title={collapsed ? 'Sair' : undefined}>
            <LogOut size={18} />
            <span className="adm-sidebar__action-text">Sair</span>
          </button>
        </div>

        <button
          className="adm-sidebar__collapse-btn"
          onClick={onCollapse}
          title={collapsed ? 'Expandir menu' : 'Encolher menu'}
        >
          <ChevronsLeft size={16} className="adm-sidebar__collapse-icon" />
          <span className="adm-sidebar__collapse-text">Encolher</span>
        </button>
      </aside>
    </>
  )
}
