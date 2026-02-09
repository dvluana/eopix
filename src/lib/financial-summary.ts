import type {
  FinancialSummary,
  SrsPremiumCpfResponse,
  SrsPremiumCnpjResponse,
} from '@/types/report'

/**
 * Calcula resumo financeiro a partir dos dados do srs-premium (CPF)
 * NAO usa IA - apenas calcula totais.
 * Score e buscado mas NAO exibido ao usuario.
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

  return {
    totalProtestos: data.totalProtestos,
    valorTotalProtestos: data.valorTotalProtestos,
    totalDividas: data.totalPendencias,
    valorTotalDividas: data.valorTotalPendencias,
    chequesSemFundo: data.chequesSemFundo,
    // Score buscado mas NAO exibido ao usuario
    _scoreInterno: data._scoreInterno,
  }
}

/**
 * Calcula resumo financeiro a partir dos dados do srs-premium (CNPJ)
 * NAO usa IA - apenas calcula totais.
 * Score e buscado mas NAO exibido ao usuario.
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

  return {
    totalProtestos: data.totalProtestos,
    valorTotalProtestos: data.valorTotalProtestos,
    totalDividas: data.totalPendencias,
    valorTotalDividas: data.valorTotalPendencias,
    chequesSemFundo: data.chequesSemFundo,
    // Score buscado mas NAO exibido ao usuario
    _scoreInterno: data._scoreInterno,
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
