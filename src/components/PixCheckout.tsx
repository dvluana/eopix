/* eslint-disable @next/next/no-img-element */
"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import EopixLoader from '@/components/EopixLoader'

type PixState = 'loading' | 'waiting' | 'expired' | 'paid' | 'error'

interface PixData {
  pixId: string
  brCode: string
  brCodeBase64: string
  expiresAt: string
}

export default function PixCheckout({ purchaseId }: { purchaseId: string }) {
  const router = useRouter()
  const [pixState, setPixState] = React.useState<PixState>('loading')
  const [pixData, setPixData] = React.useState<PixData | null>(null)
  const [secondsLeft, setSecondsLeft] = React.useState(0)
  const [copyLabel, setCopyLabel] = React.useState('COPIAR CODIGO PIX')
  const [copyDisabled, setCopyDisabled] = React.useState(false)
  const [renewKey, setRenewKey] = React.useState(0)

  // Init: create or retrieve PIX charge
  React.useEffect(() => {
    let cancelled = false

    const initPix = async () => {
      setPixState('loading')
      try {
        const res = await fetch('/api/purchases/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purchaseId }),
        })

        if (cancelled) return

        if (!res.ok) {
          setPixState('error')
          return
        }

        const data: PixData = await res.json()

        if (cancelled) return

        // Check if already expired
        const isExpired = new Date(data.expiresAt).getTime() <= Date.now()
        if (isExpired) {
          setPixData(data)
          setPixState('expired')
        } else {
          setPixData(data)
          setPixState('waiting')
        }
      } catch {
        if (!cancelled) setPixState('error')
      }
    }

    initPix()
    return () => { cancelled = true }
  }, [purchaseId, renewKey])

  // Countdown timer (1-second interval)
  React.useEffect(() => {
    if (pixState !== 'waiting' || !pixData) return

    const updateCountdown = () => {
      const left = Math.max(0, Math.floor((new Date(pixData.expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left <= 0) {
        setPixState('expired')
      }
    }

    updateCountdown()
    const timerId = setInterval(updateCountdown, 1000)
    return () => clearInterval(timerId)
  }, [pixState, pixData])

  // Status polling (3-second interval)
  React.useEffect(() => {
    if (pixState !== 'waiting') return

    const poll = async () => {
      try {
        const res = await fetch(`/api/purchases/pix/status?purchaseId=${purchaseId}`)
        if (!res.ok) return

        const data: { status: string; expiresAt: string | null } = await res.json()

        if (data.status === 'PAID' || data.status === 'COMPLETED') {
          setPixState('paid')
          router.push('/minhas-consultas')
        } else if (data.status === 'EXPIRED' || data.status === 'FAILED') {
          setPixState('expired')
        }
      } catch {
        // Silent catch — network errors don't interrupt user experience
      }
    }

    const intervalId = setInterval(poll, 3000)
    return () => clearInterval(intervalId)
  }, [pixState, purchaseId, router])

  const handleCopy = async () => {
    if (!pixData) return
    setCopyDisabled(true)
    try {
      await navigator.clipboard.writeText(pixData.brCode)
      setCopyLabel('COPIADO!')
    } catch {
      setCopyLabel('ERRO AO COPIAR')
    }
    setTimeout(() => {
      setCopyLabel('COPIAR CODIGO PIX')
      setCopyDisabled(false)
    }, 2000)
  }

  const handleRenew = () => {
    setRenewKey(k => k + 1)
  }

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const isMockQr = pixData?.brCodeBase64?.includes('BYPASS') || pixData?.brCodeBase64?.startsWith('data:text')

  if (pixState === 'loading') {
    return (
      <div className="pix-page">
        <EopixLoader text="Gerando seu codigo PIX..." />
      </div>
    )
  }

  if (pixState === 'paid') {
    return (
      <div className="pix-page">
        <p className="pix-paid-msg">Pagamento confirmado! Redirecionando...</p>
      </div>
    )
  }

  if (pixState === 'error') {
    return (
      <div className="pix-page">
        <div className="pix-error-callout">
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Nao foi possivel gerar o PIX</h3>
          <p style={{ marginBottom: '16px', fontSize: '0.875rem' }}>
            Verifique sua conexao e tente novamente.
          </p>
          <button
            className="btn btn--cta btn--full"
            onClick={handleRenew}
          >
            TENTAR NOVAMENTE
          </button>
        </div>
      </div>
    )
  }

  if (pixState === 'expired') {
    return (
      <div className="pix-page">
        <span className="pix-badge pix-badge--expired">PIX EXPIRADO</span>
        <div className="pix-expired-callout">
          <h3>Codigo PIX expirado</h3>
          <p>Este codigo PIX expirou. Gere um novo para continuar o pagamento.</p>
        </div>
        <button
          className="btn btn--cta btn--full"
          onClick={handleRenew}
        >
          GERAR NOVO QR CODE
        </button>
        <p className="pix-trust">Pagamento 100% seguro · Dados criptografados · PIX via AbacatePay</p>
      </div>
    )
  }

  // waiting state
  return (
    <div className="pix-page">
      <span className="pix-badge pix-badge--waiting">AGUARDANDO PAGAMENTO</span>

      <h2 className="pix-heading">Pague com PIX</h2>
      <p className="pix-subhead">
        Escaneie o QR Code ou copie o codigo PIX abaixo para pagar.
        Seu relatorio sera liberado automaticamente apos a confirmacao.
      </p>

      <div className="pix-qr-card">
        {isMockQr ? (
          <div className="pix-qr-card__mock">QR Code (Mock)</div>
        ) : (
          <img
            src={pixData!.brCodeBase64}
            alt="QR Code PIX"
            width={200}
            height={200}
            className="pix-qr-card__img"
          />
        )}

        <div
          className={`pix-countdown${secondsLeft <= 60 ? ' pix-countdown--urgent' : ''}`}
          aria-live="polite"
        >
          {formatCountdown(secondsLeft)}
        </div>
      </div>

      <div className="pix-code-block">{pixData!.brCode}</div>

      <button
        className="btn btn--cta btn--full"
        onClick={handleCopy}
        disabled={copyDisabled}
      >
        <span aria-live="polite">{copyLabel}</span>
      </button>

      <p className="pix-trust">Pagamento 100% seguro · Dados criptografados · PIX via AbacatePay</p>
    </div>
  )
}
