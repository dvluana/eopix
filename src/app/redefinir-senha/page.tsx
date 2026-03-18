"use client"

import React, { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LogoFundoPreto from '@/components/LogoFundoPreto'
import EopixLoader from '@/components/EopixLoader'

const EyeIcon = ({ open: isOpen }: { open: boolean }) => isOpen ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

type PageState = 'idle' | 'loading' | 'success' | 'error_token' | 'error_generic'

function RedefinirSenhaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [state, setState] = useState<PageState>('idle')
  const [error, setError] = useState('')

  const validate = (): string | null => {
    if (!token) return 'Link inválido ou expirado.'
    if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
    if (password !== confirmPassword) return 'As senhas não conferem.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setState('loading')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (res.ok) {
        setState('success')
      } else {
        const data = await res.json().catch(() => ({}))
        if (res.status === 400 || res.status === 410) {
          setState('error_token')
          setError(data.error || 'Link inválido ou expirado.')
        } else {
          setState('error_generic')
          setError(data.error || 'Erro ao redefinir senha. Tente novamente.')
        }
      }
    } catch {
      setState('error_generic')
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    }
  }

  return (
    <div className="rs-page">

      {/* ── Card ── */}
      <div className="rs-card">

        {/* Dark header — same pattern as RegisterModal */}
        <div className="rs-header">
          <LogoFundoPreto />
        </div>

        {/* Form area */}
        <div className="rs-body">
          <div className="rs-drag-indicator" />
          <div className="rs-inner">

            {state === 'success' ? (
              /* ── Success state ── */
              <div className="rs-success">
                <div className="rs-success__icon">✓</div>
                <div className="rs-badge">SENHA ATUALIZADA</div>
                <h1 className="rs-title">Pronto!</h1>
                <p className="rs-subtitle">
                  Sua senha foi redefinida com sucesso. Faça login para continuar.
                </p>
                <div className="rs-divider" />
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="btn btn--cta btn--full"
                >
                  IR PARA O LOGIN
                </button>
              </div>
            ) : state === 'error_token' ? (
              /* ── Invalid / expired token ── */
              <div className="rs-token-error">
                <div className="rs-token-error__icon">!</div>
                <div className="rs-badge rs-badge--red">LINK INVÁLIDO</div>
                <h1 className="rs-title">Link expirado</h1>
                <p className="rs-subtitle">
                  Este link de redefinição é inválido ou já expirou (validade de 1 hora). Solicite um novo link.
                </p>
                <div className="rs-divider" />
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="btn btn--cta btn--full"
                >
                  SOLICITAR NOVO LINK
                </button>
              </div>
            ) : (
              /* ── Form ── */
              <>
                <div className="rs-form-header">
                  <div className="rs-badge">REDEFINIR SENHA</div>
                  <h1 className="rs-title">Nova senha</h1>
                  <p className="rs-subtitle">Escolha uma senha com pelo menos 8 caracteres.</p>
                </div>

                <form onSubmit={handleSubmit} className="rs-form">
                  {error && <div className="rs-error">{error}</div>}

                  <div className="rs-field">
                    <label htmlFor="rs-password" className="rs-label">Nova senha</label>
                    <div className="rs-input-wrap">
                      <input
                        id="rs-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        autoFocus
                        className="rs-input rs-input--icon"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className="rs-eye"
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                  </div>

                  <div className="rs-field">
                    <label htmlFor="rs-confirm" className="rs-label">Confirmar nova senha</label>
                    <div className="rs-input-wrap">
                      <input
                        id="rs-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Repita a senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="rs-input rs-input--icon"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                        className="rs-eye"
                      >
                        <EyeIcon open={showConfirm} />
                      </button>
                    </div>
                  </div>

                  <div className="rs-divider" />

                  <button
                    type="submit"
                    disabled={state === 'loading'}
                    className="btn btn--cta btn--full"
                  >
                    {state === 'loading'
                      ? <span className="epl-inline"><EopixLoader size="sm" />Salvando...</span>
                      : 'SALVAR NOVA SENHA'}
                  </button>

                  <p className="rs-back">
                    <button
                      type="button"
                      onClick={() => router.push('/')}
                      className="rs-back-btn"
                    >
                      ← Voltar ao início
                    </button>
                  </p>
                </form>
              </>
            )}

          </div>
        </div>
      </div>

      <style jsx global>{`
        /* ── Page ── */
        .rs-page {
          min-height: 100vh;
          background:
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 7px,
              rgba(255, 214, 0, 0.04) 7px,
              rgba(255, 214, 0, 0.04) 8px
            ),
            var(--primitive-black-900);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }

        /* ── Card ── */
        .rs-card {
          width: 100%;
          max-width: 460px;
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid rgba(255, 214, 0, 0.15);
          box-shadow: 6px 6px 0 rgba(255, 214, 0, 0.08);
          animation: rs-scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ── Dark header ── */
        .rs-header {
          background:
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 7px,
              rgba(255, 214, 0, 0.06) 7px,
              rgba(255, 214, 0, 0.06) 8px
            ),
            var(--primitive-black-900);
          padding: 28px 32px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 3px solid var(--primitive-yellow-500);
        }

        /* ── Form area (light) ── */
        .rs-body {
          background: var(--color-bg-primary);
          padding: 0 24px 32px;
        }
        @media (min-width: 480px) {
          .rs-body {
            padding: 0 32px 36px;
          }
        }

        /* ── Drag indicator (decorative) ── */
        .rs-drag-indicator {
          width: 40px;
          height: 4px;
          background: var(--color-border-default);
          border-radius: 2px;
          margin: 16px auto 20px;
        }

        /* ── Inner ── */
        .rs-inner {
          max-width: 380px;
          margin: 0 auto;
        }

        /* ── Badges ── */
        .rs-badge {
          display: inline-block;
          font-family: var(--font-family-body);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: var(--primitive-black-900);
          background: var(--primitive-yellow-500);
          padding: 3px 10px;
          border-radius: 2px;
          margin-bottom: 10px;
        }
        .rs-badge--red {
          background: #CC3333;
          color: #FFFFFF;
        }

        /* ── Form header ── */
        .rs-form-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .rs-title {
          font-family: var(--font-family-heading);
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text-primary);
          line-height: 1.2;
          margin: 0 0 6px;
        }
        .rs-subtitle {
          font-family: var(--font-family-body);
          font-size: 12px;
          color: var(--color-text-secondary);
          margin: 0;
        }

        /* ── Form ── */
        .rs-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rs-field {
          display: flex;
          flex-direction: column;
        }
        .rs-label {
          font-family: var(--font-family-body);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          color: var(--color-text-primary);
          margin-bottom: 4px;
        }
        .rs-input-wrap {
          position: relative;
        }
        .rs-input {
          width: 100%;
          padding: 10px 12px;
          background: var(--color-bg-secondary);
          border: 1.5px solid var(--color-border-default);
          border-radius: 6px;
          color: var(--color-text-primary);
          font-family: var(--font-family-body);
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .rs-input:focus {
          border-color: var(--primitive-yellow-500);
          box-shadow: 0 0 0 3px rgba(255, 214, 0, 0.15);
        }
        .rs-input::placeholder {
          color: var(--color-text-muted);
        }
        .rs-input--icon {
          padding-right: 38px;
        }
        .rs-eye {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
        }
        .rs-eye:hover {
          color: var(--color-text-primary);
        }

        /* ── Error ── */
        .rs-error {
          color: var(--primitive-red-500);
          font-size: 12px;
          text-align: center;
          font-family: var(--font-family-body);
          padding: 8px 12px;
          background: rgba(204, 51, 51, 0.1);
          border: 1px solid rgba(204, 51, 51, 0.2);
          border-radius: 6px;
        }

        /* ── Divider ── */
        .rs-divider {
          height: 1px;
          background: var(--color-border-default);
          margin: 2px 0;
        }

        /* ── Back link ── */
        .rs-back {
          text-align: center;
          margin: 0;
        }
        .rs-back-btn {
          background: none;
          border: none;
          font-family: var(--font-family-body);
          font-size: 12px;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: 0;
        }
        .rs-back-btn:hover {
          color: var(--color-text-primary);
        }

        /* ── Success state ── */
        .rs-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          padding: 8px 0 4px;
        }
        .rs-success__icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--primitive-yellow-500);
          border: 2px solid var(--primitive-black-900);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          color: var(--primitive-black-900);
          box-shadow: 3px 3px 0 var(--primitive-black-900);
        }

        /* ── Token error state ── */
        .rs-token-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          padding: 8px 0 4px;
        }
        .rs-token-error__icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #CC3333;
          border: 2px solid var(--primitive-black-900);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 700;
          color: #FFFFFF;
          box-shadow: 3px 3px 0 var(--primitive-black-900);
        }

        /* ── Animation ── */
        @keyframes rs-scale-in {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EopixLoader size="md" />
      </div>
    }>
      <RedefinirSenhaContent />
    </Suspense>
  )
}
