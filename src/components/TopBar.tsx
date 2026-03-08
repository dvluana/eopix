"use client"

import React from 'react'
import Link from 'next/link'
import LogoFundoPreto from '@/components/LogoFundoPreto'
import UserNav from '@/components/UserNav'

interface TopBarProps {
  /** User email — shows auth state when provided */
  email?: string
  /** Show admin panel button */
  isAdmin?: boolean
  /** Show logout button + handler */
  showLogout?: boolean
  onLogout?: () => void
  /** Open login modal instead of navigating to /minhas-consultas */
  onLoginClick?: () => void
}

export default function TopBar({
  email,
  isAdmin,
  showLogout,
  onLogout,
  onLoginClick,
}: TopBarProps) {
  return (
    <nav className="nav" aria-label="Menu principal">
      <div className="nav__inner">
        <Link href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
          <LogoFundoPreto />
        </Link>
        {(email || onLoginClick) && (
          <UserNav
            email={email || ''}
            isAdmin={isAdmin}
            showLogout={showLogout}
            onLogout={onLogout}
            onLoginClick={onLoginClick}
          />
        )}
      </div>
    </nav>
  )
}
