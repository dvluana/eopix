export type PurchaseStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'REFUND_FAILED'

interface ValidationResult {
  ok: boolean
  status: number
  error?: string
}

function error(status: number, message: string): ValidationResult {
  return { ok: false, status, error: message }
}

export function validateCanMarkPaid(
  status: string,
  hasReport: boolean
): ValidationResult {
  if (hasReport) {
    return error(400, 'Esta compra ja possui relatorio')
  }

  if (status !== 'PENDING') {
    if (status === 'PAID') return error(409, 'Compra ja marcada como paga')
    if (status === 'PROCESSING') return error(409, 'Compra ja esta em processamento')
    if (status === 'COMPLETED') return error(409, 'Compra ja foi concluida')
    if (status === 'REFUNDED' || status === 'REFUND_FAILED') {
      return error(400, 'Compra reembolsada nao pode ser marcada como paga')
    }
    return error(400, `Transicao invalida: ${status} -> PAID`)
  }

  return { ok: true, status: 200 }
}

export function validateCanProcess(
  status: string,
  hasReport: boolean
): ValidationResult {
  if (hasReport) {
    return error(400, 'Esta compra ja possui relatorio')
  }

  // Allow PAID, PROCESSING (stuck retry), and FAILED (reprocess after failure)
  if (status !== 'PAID' && status !== 'PROCESSING' && status !== 'FAILED') {
    if (status === 'PENDING') return error(400, 'Compra ainda nao foi marcada como paga')
    if (status === 'COMPLETED') return error(409, 'Compra ja foi concluida')
    if (status === 'REFUNDED' || status === 'REFUND_FAILED') {
      return error(400, 'Compra reembolsada nao pode ser processada')
    }
    return error(400, `Transicao invalida: ${status} -> PROCESSING`)
  }

  return { ok: true, status: 200 }
}

export function validateCanMarkPaidAndProcess(
  status: string,
  hasReport: boolean
): ValidationResult {
  if (hasReport) {
    return error(400, 'Esta compra ja possui relatorio')
  }

  if (status !== 'PENDING') {
    if (status === 'PAID') return error(409, 'Compra ja esta paga; use o botao Processar')
    if (status === 'PROCESSING') return error(409, 'Compra ja esta em processamento')
    if (status === 'COMPLETED') return error(409, 'Compra ja foi concluida')
    if (status === 'REFUNDED' || status === 'REFUND_FAILED') {
      return error(400, 'Compra reembolsada nao pode ser processada')
    }
    return error(400, `Transicao invalida: ${status} -> PAID -> PROCESSING`)
  }

  return { ok: true, status: 200 }
}
