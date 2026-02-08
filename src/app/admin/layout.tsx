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
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/compras', label: 'Compras', icon: ShoppingCart },
  { href: '/admin/blocklist', label: 'Blocklist', icon: ShieldBan },
  { href: '/admin/health', label: 'Health', icon: Activity },
  { href: '/admin/leads', label: 'Leads', icon: Users },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore error
    }
    router.push('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--color-bg-secondary)' }}>
      {/* Sidebar */}
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
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '4px',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--primitive-white)' : 'rgba(255, 255, 255, 0.7)',
                  background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              width: '100%',
              fontFamily: 'var(--font-family-body)',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          marginLeft: '240px',
          padding: '32px',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
    </div>
  )
}
