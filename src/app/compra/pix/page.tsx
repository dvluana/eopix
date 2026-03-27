import { Suspense } from 'react'
import type { Metadata } from 'next'
import PixCheckoutWrapper from './PixCheckoutWrapper'

export const metadata: Metadata = {
  title: 'Pague com PIX — EOPIX',
}

export default function PixPage() {
  return (
    <Suspense>
      <PixCheckoutWrapper />
    </Suspense>
  )
}
