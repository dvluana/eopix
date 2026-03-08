import type {
  FinancialSummary,
  SrsPremiumCpfResponse,
  SrsPremiumCnpjResponse,
} from '@/types/report'

/**
 * Parse Brazilian currency string to number.
 * Handles: "1.446,43" → 1446.43, "1446,43" → 1446.43, 1446.43 → 1446.43
 * Returns 0 for non-parseable values.
 */
export function parseBRCurrency(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return 0
  }
  // Remove thousand separators (dots), then replace comma decimal with dot
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return Number.isFinite(num) ? num : 0
}

/**
 * Extract score as number from various API formats.
 * API may return: number, string "350", or object { score: "350", ... }
 */
function parseScore(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const n = parseInt(value, 10)
    return Number.isFinite(n) ? n : null
  }
  if (typeof value === 'object' && 'score' in (value as Record<string, unknown>)) {
    const score = (value as Record<string, unknown>).score
    if (typeof score === 'string') {
      const n = parseInt(score, 10)
      return Number.isFinite(n) ? n : null
    }
    if (typeof score === 'number') return Number.isFinite(score) ? score : null
  }
  return null
}

/**
 * Calcula resumo financeiro a partir dos dados do srs-premium (CPF).
 * NAO usa IA — apenas calcula totais.
 *
 * IMPORTANTE: A API retorna valores como strings BR ("1446,43") e
 * valorTotalPendencias como concatenação inútil. Calculamos o total
 * somando os itens individuais.
 */
export function calculateCpfFinancialSummary(
  data: SrsPremiumCpfResponse | null
): FinancialSummary {
  if (!data) {
    return {
      totalProtestos: 0,
      valorTotalProtestos: 0,
      totalDividas: 0,
      valorTotalDividas: 0,
      chequesSemFundo: 0,
      _scoreInterno: null,
    }
  }

  // Sum individual items instead of trusting API totals (API concatenates strings)
  const valorProtestos = (data.protestos || []).reduce(
    (sum, p) => sum + parseBRCurrency(p.valor), 0
  )
  const valorDividas = (data.pendenciasFinanceiras || []).reduce(
    (sum, p) => sum + parseBRCurrency(p.valor), 0
  )

  return {
    totalProtestos: typeof data.totalProtestos === 'number' ? data.totalProtestos : (data.protestos || []).length,
    valorTotalProtestos: valorProtestos,
    totalDividas: typeof data.totalPendencias === 'number' ? data.totalPendencias : (data.pendenciasFinanceiras || []).length,
    valorTotalDividas: valorDividas,
    chequesSemFundo: typeof data.chequesSemFundo === 'number' ? data.chequesSemFundo : 0,
    _scoreInterno: parseScore(data._scoreInterno),
  }
}

/**
 * Calcula resumo financeiro a partir dos dados do srs-premium (CNPJ).
 * Mesma lógica do CPF.
 */
export function calculateCnpjFinancialSummary(
  data: SrsPremiumCnpjResponse | null
): FinancialSummary {
  if (!data) {
    return {
      totalProtestos: 0,
      valorTotalProtestos: 0,
      totalDividas: 0,
      valorTotalDividas: 0,
      chequesSemFundo: 0,
      _scoreInterno: null,
    }
  }

  const valorProtestos = (data.protestos || []).reduce(
    (sum, p) => sum + parseBRCurrency(p.valor), 0
  )
  const valorDividas = (data.pendenciasFinanceiras || []).reduce(
    (sum, p) => sum + parseBRCurrency(p.valor), 0
  )

  return {
    totalProtestos: typeof data.totalProtestos === 'number' ? data.totalProtestos : (data.protestos || []).length,
    valorTotalProtestos: valorProtestos,
    totalDividas: typeof data.totalPendencias === 'number' ? data.totalPendencias : (data.pendenciasFinanceiras || []).length,
    valorTotalDividas: valorDividas,
    chequesSemFundo: typeof data.chequesSemFundo === 'number' ? data.chequesSemFundo : 0,
    _scoreInterno: parseScore(data._scoreInterno),
  }
}

/**
 * Formata o resumo financeiro para exibicao ao usuario.
 * NAO inclui score.
 */
export function formatFinancialSummary(summary: FinancialSummary): string {
  const parts: string[] = []

  if (summary.totalProtestos > 0) {
    parts.push(
      `${summary.totalProtestos} protesto${summary.totalProtestos > 1 ? 's' : ''} ` +
      `totalizando R$ ${summary.valorTotalProtestos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    )
  }

  if (summary.totalDividas > 0) {
    parts.push(
      `${summary.totalDividas} pendencia${summary.totalDividas > 1 ? 's' : ''} financeira${summary.totalDividas > 1 ? 's' : ''} ` +
      `totalizando R$ ${summary.valorTotalDividas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    )
  }

  if (summary.chequesSemFundo > 0) {
    parts.push(`${summary.chequesSemFundo} cheque${summary.chequesSemFundo > 1 ? 's' : ''} sem fundo`)
  }

  if (parts.length === 0) {
    return 'Nenhuma pendencia financeira encontrada.'
  }

  return parts.join(', ') + '.'
}

/**
 * Verifica se ha pendencias financeiras.
 */
export function hasFinancialIssues(summary: FinancialSummary): boolean {
  return (
    summary.totalProtestos > 0 ||
    summary.totalDividas > 0 ||
    summary.chequesSemFundo > 0
  )
}
