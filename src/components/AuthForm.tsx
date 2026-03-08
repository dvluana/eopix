'use client'

import React from 'react'
import EopixLoader from '@/components/EopixLoader'

interface AuthFormProps {
  mode: 'register' | 'login'
  onSuccess: () => void
  /** If true, hides the toggle link between register/login */
  hideToggle?: boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  marginBottom: 'var(--primitive-space-3)',
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border-default)',
  borderRadius: 'var(--primitive-radius-md)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-family-body)',
  fontSize: '16px',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  textAlign: 'left',
  marginBottom: 'var(--primitive-space-1)',
  color: 'var(--color-text-secondary)',
  fontWeight: 600,
  fontFamily: 'var(--font-family-body)',
  fontSize: '13px',
}

const eyeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function AuthForm({ mode: initialMode, onSuccess, hideToggle }: AuthFormProps) {
  const [mode, setMode] = React.useState(initialMode)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    setIsLoading(true)

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const body = { email, password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao processar')
        return
      }

      onSuccess()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setError('')
    setMode(mode === 'register' ? 'login' : 'register')
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      {error && (
        <div style={{
          color: '#CC3333',
          fontSize: '13px',
          marginBottom: 'var(--primitive-space-3)',
          textAlign: 'center',
          fontFamily: 'var(--font-family-body)',
        }}>
          {error}
        </div>
      )}

      <div>
        <label htmlFor="auth-email" style={labelStyle}>E-mail</label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="auth-password" style={labelStyle}>Senha</label>
        <div style={{ position: 'relative' }}>
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : 'Sua senha'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === 'register' ? 8 : 1}
            style={{ ...inputStyle, paddingRight: '44px' }}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeButtonStyle} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
            <EyeIcon open={showPassword} />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn--cta btn--lg btn--full"
        style={{ marginTop: 'var(--primitive-space-2)' }}
      >
        {isLoading
          ? <span className="epl-inline"><EopixLoader size="sm" />Processando...</span>
          : mode === 'register'
            ? 'Criar conta'
            : 'Entrar'
        }
      </button>

      {!hideToggle && (
        <p style={{
          textAlign: 'center',
          marginTop: 'var(--primitive-space-4)',
          fontFamily: 'var(--font-family-body)',
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
        }}>
          {mode === 'register' ? (
            <>
              Já possui conta?{' '}
              <button
                type="button"
                onClick={toggleMode}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-accent)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  padding: 0,
                }}
              >
                Faça login aqui
              </button>
            </>
          ) : (
            <>
              Não possui conta?{' '}
              <button
                type="button"
                onClick={toggleMode}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-accent)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  padding: 0,
                }}
              >
                Cadastre-se
              </button>
            </>
          )}
        </p>
      )}
    </form>
  )
}
