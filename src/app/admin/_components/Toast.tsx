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

function ToastItem({ t, onClose }: { t: ToastMessage; onClose: () => void }) {
  return (
    <RadixToast.Root
      className={`adm-toast adm-toast--${t.type}`}
      duration={t.type === 'error' ? 5000 : 3000}
      onOpenChange={(open) => { if (!open) onClose() }}
    >
      {t.type === 'success' && <CheckCircle size={16} className="adm-toast__icon adm-toast__icon--success" />}
      {t.type === 'error' && <XCircle size={16} className="adm-toast__icon adm-toast__icon--error" />}
      {t.type === 'info' && <Info size={16} className="adm-toast__icon adm-toast__icon--info" />}
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
        <RadixToast.Viewport className="adm-toast__viewport" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
