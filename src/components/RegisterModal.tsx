"use client"

import React, { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cleanDocument, isValidCPF, isValidCNPJ, isValidEmail } from '@/lib/validators'
import LogoFundoPreto from '@/components/LogoFundoPreto'
import EopixLoader from '@/components/EopixLoader'

interface RegisterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RegisterData) => Promise<void>
  isLoading: boolean
  initialMode?: 'register' | 'login'
  hideToggle?: boolean
}

export interface RegisterData {
  name: string
  email: string
  cellphone: string
  taxId: string
  password: string
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function maskTaxId(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  if (digits.length <= 11) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export default function RegisterModal({ open, onOpenChange, onSubmit, isLoading, initialMode, hideToggle }: RegisterModalProps) {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode ?? 'register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cellphone, setCellphone] = useState('')
  const [taxId, setTaxId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  const validate = (): string | null => {
    if (mode === 'login') {
      if (!email) return 'E-mail obrigatório'
      if (!isValidEmail(email)) return 'E-mail inválido'
      if (!password) return 'Senha obrigatória'
      return null
    }

    if (!name || name.trim().length < 2) return 'Nome completo obrigatório'
    if (!email) return 'E-mail obrigatório'
    if (!isValidEmail(email)) return 'E-mail inválido'

    const phoneDigits = cellphone.replace(/\D/g, '')
    if (phoneDigits.length < 10 || phoneDigits.length > 11) return 'Celular inválido'

    const taxDigits = cleanDocument(taxId)
    if (taxDigits.length === 11 && !isValidCPF(taxDigits)) return 'CPF inválido'
    else if (taxDigits.length === 14 && !isValidCNPJ(taxDigits)) return 'CNPJ inválido'
    else if (taxDigits.length !== 11 && taxDigits.length !== 14) return 'CPF ou CNPJ inválido'

    if (password.length < 8) return 'Senha deve ter pelo menos 8 caracteres'
    if (password !== confirmPassword) return 'Senhas não conferem'

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

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        cellphone: cellphone.replace(/\D/g, ''),
        taxId: cleanDocument(taxId),
        password,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar')
    }
  }

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

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="rm-overlay" />
        <DialogPrimitive.Content
          className="rm-content"
          aria-describedby="register-modal-desc"
        >
          {/* Branded header (dark + diagonal lines) */}
          <div className="rm-yellow-header">
            <DialogPrimitive.Close className="rm-close" aria-label="Fechar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </DialogPrimitive.Close>
            <LogoFundoPreto />
          </div>

          {/* Light form area */}
          <div className="rm-form-area">
            <div className="rm-drag-indicator" />
            <div className="rm-inner">
              {/* Header */}
              <div className="rm-header">
                <div className="rm-badge">
                  {mode === 'register' ? 'CRIAR CONTA' : 'LOGIN'}
                </div>
                <DialogPrimitive.Title className="rm-title">
                  {mode === 'register' ? 'Crie sua conta em 30 segundos' : 'Bem-vindo de volta'}
                </DialogPrimitive.Title>
                <p id="register-modal-desc" className="rm-subtitle">
                  {mode === 'register'
                    ? 'Seus dados ficam salvos para próximas consultas'
                    : 'Entre com seu e-mail e senha'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="rm-form">
                {error && <div className="rm-error">{error}</div>}

                {mode === 'register' && (
                  <div className="rm-field">
                    <label htmlFor="reg-name" className="rm-label">Nome completo</label>
                    <input
                      id="reg-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Joao da Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="rm-input"
                    />
                  </div>
                )}

                <div className="rm-field">
                  <label htmlFor="reg-email" className="rm-label">E-mail</label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rm-input"
                  />
                </div>

                {mode === 'register' && (
                  <>
                    <div className="rm-row">
                      <div className="rm-field">
                        <label htmlFor="reg-cellphone" className="rm-label">Celular</label>
                        <input
                          id="reg-cellphone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="(11) 99999-9999"
                          value={cellphone}
                          onChange={(e) => setCellphone(maskPhone(e.target.value))}
                          required
                          className="rm-input"
                        />
                      </div>
                      <div className="rm-field">
                        <label htmlFor="reg-taxId" className="rm-label">CPF/CNPJ</label>
                        <input
                          id="reg-taxId"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="000.000.000-00"
                          value={taxId}
                          onChange={(e) => setTaxId(maskTaxId(e.target.value))}
                          required
                          className="rm-input"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="rm-field">
                  <label htmlFor="reg-password" className="rm-label">Senha</label>
                  <div className="rm-input-wrap">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : 'Sua senha'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={mode === 'register' ? 8 : 1}
                      className="rm-input rm-input--has-icon"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="rm-eye"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="rm-field">
                    <label htmlFor="reg-confirm-password" className="rm-label">Confirmar senha</label>
                    <div className="rm-input-wrap">
                      <input
                        id="reg-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Repita a senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="rm-input rm-input--has-icon"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className="rm-eye"
                      >
                        <EyeIcon open={showConfirmPassword} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="rm-divider" />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rm-submit btn btn--cta btn--full"
                >
                  {isLoading
                    ? <span className="epl-inline"><EopixLoader size="sm" />Processando...</span>
                    : mode === 'register'
                      ? 'CONTINUAR PARA PAGAMENTO \u00B7 R$ 39,90'
                      : hideToggle
                        ? 'ENTRAR'
                        : 'ENTRAR E PAGAR \u00B7 R$ 39,90'}
                </button>

                {/* Toggle */}
                {!hideToggle && (
                  <p className="rm-toggle">
                    {mode === 'register' ? (
                      <>Já possui conta?{' '}
                        <button type="button" onClick={() => { setMode('login'); setError('') }} className="rm-toggle-btn">Faça login</button>
                      </>
                    ) : (
                      <>Não possui conta?{' '}
                        <button type="button" onClick={() => { setMode('register'); setError('') }} className="rm-toggle-btn">Cadastre-se</button>
                      </>
                    )}
                  </p>
                )}

                {/* Legal */}
                <p className="rm-legal">
                  Ao continuar, você aceita os{' '}
                  <a href="#termos">Termos de Uso</a>
                </p>
              </form>
            </div>
          </div>

          <style jsx global>{`
            /* ── Overlay ── */
            .rm-overlay {
              position: fixed;
              inset: 0;
              z-index: 200;
              background: rgba(26, 26, 26, 0.7);
              backdrop-filter: blur(6px);
              -webkit-backdrop-filter: blur(6px);
              animation: rm-fade-in 0.2s ease;
            }

            /* ── Mobile: fullscreen layout ── */
            .rm-content {
              position: fixed;
              inset: 0;
              z-index: 201;
              background: var(--primitive-black-900);
              display: flex;
              flex-direction: column;
              animation: rm-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* ── Desktop: centered card ── */
            @media (min-width: 640px) {
              .rm-content {
                inset: unset;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 460px;
                max-height: 92vh;
                border-radius: 16px;
                overflow: hidden;
                animation: rm-scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
              }
            }

            /* ── Branded header area (dark + diagonal lines) ── */
            .rm-yellow-header {
              position: relative;
              min-height: 20vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background:
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 7px,
                  rgba(255, 214, 0, 0.06) 7px,
                  rgba(255, 214, 0, 0.06) 8px
                ),
                var(--primitive-black-900);
              flex-shrink: 0;
            }
            @media (min-width: 640px) {
              .rm-yellow-header {
                min-height: 80px;
              }
            }

            /* ── Close button (on dark header) ── */
            .rm-close {
              position: absolute;
              top: 12px;
              right: 12px;
              z-index: 2;
              background: none;
              border: none;
              cursor: pointer;
              color: rgba(255, 255, 255, 0.7);
              padding: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 4px;
              transition: all 0.15s ease;
            }
            .rm-close:hover {
              color: #FFFFFF;
              background: rgba(255, 255, 255, 0.1);
            }

            /* ── Form area (light) ── */
            .rm-form-area {
              flex: 1;
              background: var(--color-bg-primary);
              border-radius: 24px 24px 0 0;
              overflow-y: auto;
              padding: 0 20px 40px;
              scrollbar-width: thin;
              scrollbar-color: var(--color-border-default) transparent;
            }
            .rm-form-area::-webkit-scrollbar {
              width: 5px;
            }
            .rm-form-area::-webkit-scrollbar-track {
              background: transparent;
            }
            .rm-form-area::-webkit-scrollbar-thumb {
              background: var(--color-border-default);
              border-radius: 10px;
            }
            .rm-form-area::-webkit-scrollbar-thumb:hover {
              background: var(--primitive-gray-400);
            }
            @media (min-width: 640px) {
              .rm-form-area {
                border-radius: 0;
                padding: 0 32px 32px;
              }
            }

            /* ── Drag indicator (mobile only) ── */
            .rm-drag-indicator {
              width: 40px;
              height: 4px;
              background: var(--color-border-default);
              border-radius: 2px;
              margin: 16px auto 20px;
            }
            @media (min-width: 640px) {
              .rm-drag-indicator {
                display: none;
              }
            }

            /* ── Inner container ── */
            .rm-inner {
              max-width: 380px;
              margin: 0 auto;
              padding: 0;
            }

            /* ── Header ── */
            .rm-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .rm-badge {
              display: inline-block;
              font-family: var(--font-family-body);
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 1.5px;
              color: var(--primitive-black-900);
              background: var(--primitive-yellow-500);
              padding: 3px 10px;
              border-radius: 2px;
              margin-bottom: 12px;
            }
            .rm-title {
              font-family: var(--font-family-heading);
              font-size: 22px;
              font-weight: 700;
              color: var(--color-text-primary);
              line-height: 1.2;
              margin-bottom: 6px;
            }
            .rm-subtitle {
              font-family: var(--font-family-body);
              font-size: 12px;
              color: var(--color-text-secondary);
            }

            /* ── Form ── */
            .rm-form {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }
            .rm-field {
              flex: 1;
            }
            .rm-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            @media (max-width: 400px) {
              .rm-row {
                grid-template-columns: 1fr;
              }
            }
            .rm-label {
              display: block;
              text-align: left;
              margin-bottom: 4px;
              color: var(--color-text-primary);
              font-weight: 600;
              font-family: var(--font-family-body);
              font-size: 10px;
              letter-spacing: 0.3px;
              text-transform: uppercase;
            }
            .rm-input {
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
            .rm-input:focus {
              border-color: var(--primitive-yellow-500);
              box-shadow: 0 0 0 3px rgba(255, 214, 0, 0.15);
            }
            .rm-input::placeholder {
              color: var(--color-text-muted);
            }
            .rm-input--has-icon {
              padding-right: 38px;
            }
            .rm-input-wrap {
              position: relative;
            }
            .rm-eye {
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
            .rm-eye:hover {
              color: var(--color-text-primary);
            }

            /* ── Error ── */
            .rm-error {
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
            .rm-divider {
              height: 1px;
              background: var(--color-border-default);
              margin: 2px 0;
            }

            /* ── Toggle link ── */
            .rm-toggle {
              text-align: center;
              font-family: var(--font-family-body);
              font-size: 12px;
              color: var(--color-text-secondary);
              margin: 0;
            }
            .rm-toggle-btn {
              background: none;
              border: none;
              color: var(--color-text-primary);
              font-weight: 700;
              text-decoration: none;
              cursor: pointer;
              font-family: inherit;
              font-size: inherit;
              padding: 0;
              border-bottom: 1.5px solid var(--color-text-primary);
            }
            .rm-toggle-btn:hover {
              color: var(--primitive-yellow-500);
              border-color: var(--primitive-yellow-500);
            }

            /* ── Legal text ── */
            .rm-legal {
              text-align: center;
              font-family: var(--font-family-body);
              font-size: 10px;
              color: var(--color-text-tertiary);
              line-height: 1.5;
              margin: 0;
              padding-bottom: 4px;
            }
            .rm-legal a {
              color: var(--color-text-secondary);
              text-decoration: underline;
            }

            /* ── Animations ── */
            @keyframes rm-fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes rm-slide-up {
              from { transform: translateY(40px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes rm-scale-in {
              from { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
              to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
          `}</style>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
