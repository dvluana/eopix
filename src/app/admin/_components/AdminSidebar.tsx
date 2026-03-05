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
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/compras', label: 'Compras', icon: ShoppingCart },
  { href: '/admin/blocklist', label: 'Blocklist', icon: ShieldBan },
  { href: '/admin/health', label: 'Health', icon: Activity },
  { href: '/admin/leads', label: 'Leads', icon: Users },
]

export function AdminSidebar() {
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

  return (
    <aside
      style={{
        width: '240px',
        background: 'var(--primitive-black)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Link href="/admin">
          <LogoFundoPreto />
        </Link>
        <div
          style={{
            marginTop: '8px',
            fontSize: '10px',
            fontFamily: 'var(--font-family-body)',
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Admin Panel
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer actions */}
      <div
        style={{
          padding: '16px 12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <Link href="/minhas-consultas" className="admin-logout-btn">
          <FileSearch size={18} />
          Minhas Consultas
        </Link>
        <button onClick={handleLogout} className="admin-logout-btn">
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}
