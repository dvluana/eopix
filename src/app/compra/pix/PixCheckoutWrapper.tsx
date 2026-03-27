"use client"

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import PixCheckout from '@/components/PixCheckout'

export default function PixCheckoutWrapper() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const purchaseId = searchParams.get('purchaseId')

  React.useEffect(() => {
    if (!purchaseId) {
      router.replace('/')
    }
  }, [purchaseId, router])

  if (!purchaseId) {
    return null
  }

  return (
    <>
      <TopBar />
      <main style={{ paddingTop: '48px', paddingBottom: '48px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 16px' }}>
          <PixCheckout purchaseId={purchaseId} />
        </div>
      </main>
    </>
  )
}
