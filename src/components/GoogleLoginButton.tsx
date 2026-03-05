'use client'

import React from 'react'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'

interface GoogleLoginButtonProps {
  onSuccess: () => void
  onError?: (msg: string) => void
}

export default function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSuccess = async (response: { credential?: string }) => {
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = data.error || 'Erro ao autenticar com Google'
        setError(msg)
        onError?.(msg)
        return
      }

      onSuccess()
    } catch {
      const msg = 'Erro ao autenticar com Google. Tente novamente.'
      setError(msg)
      onError?.(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleError = () => {
    const msg = 'Erro ao autenticar com Google. Tente novamente.'
    setError(msg)
    onError?.(msg)
  }

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      {error && (
        <div style={{
          color: '#CC3333',
          fontSize: '13px',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{
          textAlign: 'center',
          fontFamily: 'var(--font-family-body)',
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          padding: '16px 0',
        }}>
          Entrando...
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            size="large"
            width="360"
            text="signin_with"
            shape="rectangular"
          />
        </div>
      )}
    </GoogleOAuthProvider>
  )
}
