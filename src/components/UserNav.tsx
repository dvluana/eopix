"use client"

import React from 'react'
import Link from 'next/link'

interface UserNavProps {
  email: string
  isAdmin?: boolean
  showLogout?: boolean
  onLogout?: () => void
  onLoginClick?: () => void
}

export default function UserNav({ email, isAdmin, showLogout, onLogout, onLoginClick }: UserNavProps) {
  if (!email && onLoginClick) {
    return (
      <button
        type="button"
        onClick={onLoginClick}
        className="btn btn--outline btn--sm btn--on-dark"
      >
        Entrar
      </button>
    )
  }

  if (!email) {
    return (
      <Link href="/minhas-consultas" className="btn btn--outline btn--sm btn--on-dark">
        Entrar
      </Link>
    )
  }

  return (
    <div className="nav__auth-logged">
      <span className="nav__user-email">{email}</span>
      {isAdmin && (
        <Link href="/admin" className="btn btn--primary btn--sm">
          Painel Admin
        </Link>
      )}
      {showLogout && onLogout ? (
        <button type="button" onClick={onLogout} className="btn btn--outline btn--sm btn--on-dark">
          Sair
        </button>
      ) : (
        <Link href="/minhas-consultas" className="btn btn--outline btn--sm btn--on-dark">
          Minhas Consultas
        </Link>
      )}
    </div>
  )
}
