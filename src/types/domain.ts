// Domain types — DB entity shapes for frontend/shared code
// Source of truth for Prisma schema: prisma/schema.prisma
// For report-specific types, see report.ts

export type { PurchaseStatus } from '@/lib/purchase-workflow'

export type DocumentType = 'CPF' | 'CNPJ'

export type PaymentProvider = 'stripe' | 'abacatepay'

// Purchase as returned by API endpoints (subset of Prisma model)
export interface Purchase {
  id: string
  code: string
  term: string
  type: DocumentType
  status: string
  amount: number
  processingStep: number
  paymentProvider: PaymentProvider | null
  buyerName: string | null
  buyerCpfCnpj: string | null
  hasReport: boolean
  reportId: string | null
  createdAt: string
  paidAt: string | null
}

// User as returned by /api/auth/me
export interface User {
  id: string
  email: string
}

// Admin Purchase (extended fields for admin panel)
export interface AdminPurchase extends Purchase {
  email: string
  stripePaymentIntentId: string | null
  paymentExternalId: string | null
  failureReason: string | null
  failureDetails: string | null
  refundReason: string | null
  refundDetails: string | null
}

// Processing steps used in confirmacao + minhas-consultas
export const PROCESSING_STEPS = [
  { step: 1, label: 'Dados cadastrais' },
  { step: 2, label: 'Dados financeiros' },
  { step: 3, label: 'Processos judiciais' },
  { step: 4, label: 'Menções na web' },
  { step: 5, label: 'Gerando resumo' },
  { step: 6, label: 'Finalizando' },
] as const

export type ProcessingStep = (typeof PROCESSING_STEPS)[number]
