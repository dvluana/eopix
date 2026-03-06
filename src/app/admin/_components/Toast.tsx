'use client'

import React from 'react'
import * as RadixToast from '@radix-ui/react-toast'
import { CheckCircle, XCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (opts: { type: ToastType; message: string }) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />,
  error: <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />,
  info: <Info size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />,
}

const bgColors: Record<ToastType, string> = {
  success: 'rgba(34, 197, 94, 0.1)',
  error: 'rgba(239, 68, 68, 0.1)',
  info: 'rgba(59, 130, 246, 0.1)',
}

const borderColors: Record<ToastType, string> = {
  success: 'rgba(34, 197, 94, 0.3)',
  error: 'rgba(239, 68, 68, 0.3)',
  info: 'rgba(59, 130, 246, 0.3)',
}

function ToastItem({ t, onClose }: { t: ToastMessage; onClose: () => void }) {
  return (
    <RadixToast.Root
      duration={t.type === 'error' ? 5000 : 3000}
      onOpenChange={(open) => { if (!open) onClose() }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        background: bgColors[t.type],
        border: `1px solid ${borderColors[t.type]}`,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '14px',
        color: 'var(--color-text-primary)',
      }}
    >
      {icons[t.type]}
      <RadixToast.Description style={{ flex: 1 }}>
        {t.message}
      </RadixToast.Description>
    </RadixToast.Root>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const toast = React.useCallback(({ type, message }: { type: ToastType; message: string }) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} onClose={() => removeToast(t.id)} />
        ))}
        <RadixToast.Viewport
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '380px',
            maxWidth: 'calc(100vw - 48px)',
            zIndex: 9999,
            listStyle: 'none',
            outline: 'none',
          }}
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
