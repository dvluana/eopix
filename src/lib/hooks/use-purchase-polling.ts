"use client"

import { useEffect, useCallback } from 'react'
import type { Purchase } from '@/types/domain'

interface UsePurchasePollingOptions {
  enabled: boolean
  purchases: Purchase[]
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>
}

/**
 * SSE polling hook for real-time purchase status updates.
 * Falls back to HTTP polling every 2s if SSE connection fails.
 * Only active when `enabled` is true and there are PROCESSING/PAID purchases.
 */
export function usePurchasePolling({ enabled, purchases, setPurchases }: UsePurchasePollingOptions) {
  const hasProcessing = purchases.some(
    p => p.status === 'PROCESSING' || p.status === 'PAID'
  )

  const fetchPurchases = useCallback(async () => {
    try {
      const res = await fetch('/api/purchases')
      if (res.ok) {
        const data = await res.json()
        setPurchases(data.purchases || [])
      }
    } catch {
      // Ignore errors during polling
    }
  }, [setPurchases])

  useEffect(() => {
    if (!enabled || !hasProcessing) return

    let fallbackInterval: ReturnType<typeof setInterval> | null = null

    const eventSource = new EventSource('/api/purchases/stream')

    eventSource.onmessage = (event) => {
      try {
        const updatedPurchases = JSON.parse(event.data)

        setPurchases((prev) => {
          const updated = [...prev]

          updatedPurchases.forEach((newP: Purchase) => {
            const idx = updated.findIndex((p) => p.id === newP.id)
            if (idx >= 0) {
              updated[idx] = { ...updated[idx], ...newP }
            }
          })

          return updated
        })
      } catch (err) {
        console.error('Error parsing SSE message:', err)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()

      fallbackInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/purchases')
          if (res.ok) {
            const data = await res.json()
            setPurchases(data.purchases || [])
          }
        } catch {
          // Ignore errors during polling
        }
      }, 2000)
    }

    return () => {
      eventSource.close()
      if (fallbackInterval) clearInterval(fallbackInterval)
    }
  }, [enabled, hasProcessing, setPurchases])

  return { hasProcessing, fetchPurchases }
}
