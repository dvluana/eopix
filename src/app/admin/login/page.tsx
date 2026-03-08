'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import LogoFundoPreto from '@/components/LogoFundoPreto'

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao fazer login')
      }

      router.push('/admin')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="adm-login">
        <div className="adm-login__logo">
          <LogoFundoPreto />
        </div>

        <div className="adm-login__card">
          <div className="adm-login__badge">ADMIN</div>
          <h1 className="adm-login__title">Painel Administrativo</h1>
          <p className="adm-login__sub">Acesso restrito a administradores</p>

          <form onSubmit={handleSubmit} className="adm-login__form">
            {error && <div className="adm-login__error">{error}</div>}

            <div className="adm-login__field">
              <label htmlFor="adm-email" className="adm-login__label">E-mail</label>
              <input
                id="adm-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@eopix.com"
                className="adm-login__input"
              />
            </div>

            <div className="adm-login__field">
              <label htmlFor="adm-password" className="adm-login__label">Senha</label>
              <div className="adm-login__input-wrap">
                <input
                  id="adm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimo 8 caracteres"
                  className="adm-login__input adm-login__input--has-icon"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="adm-login__eye"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="adm-login__submit"
            >
              {loading ? 'Entrando...' : 'ENTRAR'}
            </button>
          </form>
        </div>
    </div>
  )
}
