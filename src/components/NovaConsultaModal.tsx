"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { maskDocument, cleanDocument, isValidCPF, isValidCNPJ, formatDocument } from '@/lib/validators'

interface NovaConsultaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'input' | 'confirm'

export default function NovaConsultaModal({ open, onOpenChange }: NovaConsultaModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [document, setDocument] = useState('')
  const [cleanedTerm, setCleanedTerm] = useState('')
  const [docType, setDocType] = useState<'CPF' | 'CNPJ'>('CPF')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const reset = () => {
    setStep('input')
    setDocument('')
    setCleanedTerm('')
    setError('')
    setIsLoading(false)
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) reset()
    onOpenChange(value)
  }

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleaned = cleanDocument(document)
    if (cleaned.length === 11 && !isValidCPF(cleaned)) {
      setError('CPF inválido')
      return
    }
    if (cleaned.length === 14 && !isValidCNPJ(cleaned)) {
      setError('CNPJ inválido')
      return
    }
    if (cleaned.length !== 11 && cleaned.length !== 14) {
      setError('Digite um CPF ou CNPJ válido')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/search/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: cleaned }),
      })
      const data = await res.json()

      if (res.status === 403 && data.blocked) {
        setError(data.message || 'Este documento não pode ser consultado.')
        return
      }
      if (!res.ok) {
        setError(data.error || 'Erro ao validar documento')
        return
      }

      setCleanedTerm(data.term)
      setDocType(data.type)
      setStep('confirm')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async () => {
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: cleanedTerm, termsAccepted: true }),
      })
      const data = await res.json()

      if (res.status === 409 && data.existingReportId) {
        onOpenChange(false)
        router.push(`/relatorio/${data.existingReportId}`)
        return
      }
      if (!res.ok) {
        setError(data.error || 'Erro ao criar compra')
        return
      }

      onOpenChange(false)
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        router.push(`/compra/confirmacao?code=${data.code}`)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="nc-overlay" />
        <DialogPrimitive.Content
          className="nc-content"
          aria-describedby="nc-modal-desc"
        >
          {/* Dark branded header */}
          <div className="nc-header-bar">
            <DialogPrimitive.Close className="nc-close" aria-label="Fechar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </DialogPrimitive.Close>
          </div>

          {/* Form area */}
          <div className="nc-body">
            <div className="nc-drag-indicator" />
            <div className="nc-inner">
              {/* Header */}
              <div className="nc-header">
                <div className="nc-badge">NOVA CONSULTA</div>
                <DialogPrimitive.Title className="nc-title">
                  {step === 'input' ? 'Consultar CPF ou CNPJ' : 'Confirmar consulta'}
                </DialogPrimitive.Title>
                <p id="nc-modal-desc" className="nc-subtitle">
                  {step === 'input'
                    ? 'Digite o documento que deseja consultar'
                    : 'Confira os dados antes de prosseguir'}
                </p>
              </div>

              {error && <div className="nc-error">{error}</div>}

              {/* Step 1: Input */}
              {step === 'input' && (
                <form onSubmit={handleValidate} className="nc-form">
                  <div className="nc-field">
                    <label htmlFor="nc-document" className="nc-label">CPF ou CNPJ</label>
                    <input
                      id="nc-document"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      autoFocus
                      placeholder="000.000.000-00"
                      value={document}
                      onChange={(e) => setDocument(maskDocument(e.target.value))}
                      className="nc-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || cleanDocument(document).length < 11}
                    className="btn btn--cta btn--full"
                  >
                    {isLoading ? 'Validando...' : 'CONSULTAR'}
                  </button>
                </form>
              )}

              {/* Step 2: Confirm */}
              {step === 'confirm' && (
                <div className="nc-form">
                  <div className="nc-confirm-box">
                    <div className="nc-confirm-type">{docType}</div>
                    <div className="nc-confirm-doc">{formatDocument(cleanedTerm)}</div>
                  </div>

                  <div className="nc-price-row">
                    <span className="nc-price-label">Relatório completo</span>
                    <span className="nc-price-value">R$ 29,90</span>
                  </div>

                  <button
                    type="button"
                    onClick={handlePurchase}
                    disabled={isLoading}
                    className="btn btn--cta btn--full"
                  >
                    {isLoading ? 'Processando...' : 'DESBLOQUEAR RELAT\u00D3RIO \u00B7 R$ 29,90'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep('input'); setError('') }}
                    className="btn btn--ghost"
                  >
                    Alterar documento
                  </button>
                </div>
              )}

              {/* Legal */}
              <p className="nc-legal">
                Ao continuar, você aceita os{' '}
                <a href="#termos">Termos de Uso</a>
              </p>
            </div>
          </div>

          <style jsx global>{`
            /* ── Overlay ── */
            .nc-overlay {
              position: fixed;
              inset: 0;
              z-index: 200;
              background: rgba(26, 26, 26, 0.7);
              backdrop-filter: blur(6px);
              -webkit-backdrop-filter: blur(6px);
              animation: nc-fade-in 0.2s ease;
            }

            /* ── Mobile: fullscreen ── */
            .nc-content {
              position: fixed;
              inset: 0;
              z-index: 201;
              background: var(--primitive-black-900);
              display: flex;
              flex-direction: column;
              animation: nc-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* ── Desktop: centered card ── */
            @media (min-width: 640px) {
              .nc-content {
                inset: unset;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 400px;
                max-height: 80vh;
                border-radius: 16px;
                overflow: hidden;
                animation: nc-scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
              }
            }

            /* ── Header bar (dark + diagonal) ── */
            .nc-header-bar {
              position: relative;
              min-height: 48px;
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

            /* ── Close button ── */
            .nc-close {
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
            .nc-close:hover {
              color: #FFFFFF;
              background: rgba(255, 255, 255, 0.1);
            }

            /* ── Body (light) ── */
            .nc-body {
              flex: 1;
              background: var(--color-bg-primary);
              border-radius: 24px 24px 0 0;
              overflow-y: auto;
              padding: 0 20px 32px;
            }
            @media (min-width: 640px) {
              .nc-body {
                border-radius: 0;
                padding: 0 32px 32px;
              }
            }

            /* ── Drag indicator (mobile) ── */
            .nc-drag-indicator {
              width: 40px;
              height: 4px;
              background: var(--color-border-default);
              border-radius: 2px;
              margin: 16px auto 20px;
            }
            @media (min-width: 640px) {
              .nc-drag-indicator { display: none; }
            }

            /* ── Inner ── */
            .nc-inner {
              max-width: 340px;
              margin: 0 auto;
            }

            /* ── Header ── */
            .nc-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .nc-badge {
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
            .nc-title {
              font-family: var(--font-family-heading);
              font-size: 22px;
              font-weight: 700;
              color: var(--color-text-primary);
              line-height: 1.2;
              margin-bottom: 6px;
            }
            .nc-subtitle {
              font-family: var(--font-family-body);
              font-size: 12px;
              color: var(--color-text-secondary);
            }

            /* ── Error ── */
            .nc-error {
              color: var(--primitive-red-500);
              font-size: 12px;
              text-align: center;
              font-family: var(--font-family-body);
              padding: 8px 12px;
              background: rgba(204, 51, 51, 0.1);
              border: 1px solid rgba(204, 51, 51, 0.2);
              border-radius: 6px;
              margin-bottom: 12px;
            }

            /* ── Form ── */
            .nc-form {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .nc-field {
              flex: 1;
            }
            .nc-label {
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
            .nc-input {
              width: 100%;
              padding: 12px 14px;
              background: var(--color-bg-secondary);
              border: 1.5px solid var(--color-border-default);
              border-radius: 6px;
              color: var(--color-text-primary);
              font-family: var(--font-family-body);
              font-size: 18px;
              letter-spacing: 1px;
              outline: none;
              box-sizing: border-box;
              text-align: center;
              transition: border-color 0.15s ease, box-shadow 0.15s ease;
            }
            .nc-input:focus {
              border-color: var(--primitive-yellow-500);
              box-shadow: 0 0 0 3px rgba(255, 214, 0, 0.15);
            }
            .nc-input::placeholder {
              color: var(--color-text-muted);
              font-size: 16px;
            }

            /* ── Confirm box ── */
            .nc-confirm-box {
              text-align: center;
              padding: 20px 16px;
              background: var(--color-bg-secondary);
              border: 1.5px solid var(--color-border-default);
              border-radius: 8px;
            }
            .nc-confirm-type {
              font-family: var(--font-family-body);
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 1.5px;
              color: var(--color-text-secondary);
              margin-bottom: 6px;
            }
            .nc-confirm-doc {
              font-family: var(--font-family-heading);
              font-size: 24px;
              font-weight: 700;
              color: var(--color-text-primary);
              letter-spacing: 2px;
            }

            /* ── Price row ── */
            .nc-price-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px 16px;
              background: var(--primitive-black-900);
              border-radius: 8px;
            }
            .nc-price-label {
              font-family: var(--font-family-body);
              font-size: 13px;
              color: rgba(255, 255, 255, 0.7);
            }
            .nc-price-value {
              font-family: var(--font-family-heading);
              font-size: 18px;
              font-weight: 700;
              color: var(--primitive-yellow-500);
            }

            /* ── Legal ── */
            .nc-legal {
              text-align: center;
              font-family: var(--font-family-body);
              font-size: 10px;
              color: var(--color-text-tertiary);
              line-height: 1.5;
              margin: 12px 0 0;
            }
            .nc-legal a {
              color: var(--color-text-secondary);
              text-decoration: underline;
            }

            /* ── Mobile adjustments ── */
            @media (max-width: 400px) {
              .nc-confirm-doc {
                font-size: 18px;
                letter-spacing: 1px;
              }
              .nc-input {
                font-size: 16px;
              }
            }

            /* ── Animations ── */
            @keyframes nc-fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes nc-slide-up {
              from { transform: translateY(40px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes nc-scale-in {
              from { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
              to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
          `}</style>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
