'use client'

import React from 'react'

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

export default function AuthForm({ mode: initialMode, onSuccess, hideToggle }: AuthFormProps) {
  const [mode, setMode] = React.useState(initialMode)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'register' && password !== confirmPassword) {
      setError('As senhas nao coincidem')
      return
    }

    setIsLoading(true)

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const body = mode === 'register'
        ? { name, email, password }
        : { email, password }

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
      setError('Erro de conexao. Tente novamente.')
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

      {mode === 'register' && (
        <div>
          <label htmlFor="auth-name" style={labelStyle}>Nome</label>
          <input
            id="auth-name"
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            style={inputStyle}
          />
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
        <input
          id="auth-password"
          type="password"
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          placeholder={mode === 'register' ? 'Minimo 8 caracteres' : 'Sua senha'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={mode === 'register' ? 8 : 1}
          style={inputStyle}
        />
      </div>

      {mode === 'register' && (
        <div>
          <label htmlFor="auth-confirm-password" style={labelStyle}>Confirmar Senha</label>
          <input
            id="auth-confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            style={inputStyle}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn--primary btn--lg"
        style={{
          width: '100%',
          fontSize: '16px',
          padding: '16px 32px',
          marginTop: 'var(--primitive-space-2)',
          opacity: isLoading ? 0.5 : 1,
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading
          ? 'Processando...'
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
              Ja possui conta?{' '}
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
                Faca login aqui
              </button>
            </>
          ) : (
            <>
              Nao possui conta?{' '}
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
