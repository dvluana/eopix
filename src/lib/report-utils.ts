/**
 * Report utility functions for sorting and formatting
 */

// Types
interface ProcessData {
  tribunal: string
  date: string
  classe: string
  polo: string
  number?: string
  source?: string
}

interface FinancialItem {
  valor: string | number
}

interface MentionItem {
  classification?: 'positive' | 'negative' | 'neutral'
}

// Gravity weights for processes
const POLO_WEIGHT: Record<string, number> = {
  reu: 3,
  réu: 3,
  autor: 2,
  testemunha: 1,
}

const TIPO_WEIGHT: Record<string, number> = {
  trabalhista: 3,
  execucao: 2,
  execução: 2,
  'execução de título extrajudicial': 2,
  'execução fiscal': 2,
  cobranca: 1,
  cobrança: 1,
  civel: 1,
  cível: 1,
}

/**
 * Sort processes by gravity:
 * 1. Polo (Réu > Autor > Testemunha)
 * 2. Tipo (Trabalhista > Execução > Outros)
 * 3. Date (most recent first)
 */
export function sortProcessesByGravity(processes: ProcessData[]): ProcessData[] {
  return [...processes].sort((a, b) => {
    // Compare by polo weight
    const poloA = POLO_WEIGHT[a.polo?.toLowerCase()] || 0
    const poloB = POLO_WEIGHT[b.polo?.toLowerCase()] || 0
    if (poloB !== poloA) return poloB - poloA

    // Compare by tipo weight
    const tipoA = getTipoWeight(a.classe)
    const tipoB = getTipoWeight(b.classe)
    if (tipoB !== tipoA) return tipoB - tipoA

    // Compare by date (most recent first)
    const dateA = parseDate(a.date)
    const dateB = parseDate(b.date)
    return dateB.getTime() - dateA.getTime()
  })
}

/**
 * Get weight for process type based on classe
 */
function getTipoWeight(classe: string): number {
  const normalized = classe?.toLowerCase() || ''
  for (const [key, weight] of Object.entries(TIPO_WEIGHT)) {
    if (normalized.includes(key)) return weight
  }
  return 0
}

/**
 * Parse date from DD/MM/YYYY or ISO format
 */
function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(0)

  // Try DD/MM/YYYY format
  const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) {
    return new Date(parseInt(brMatch[3]), parseInt(brMatch[2]) - 1, parseInt(brMatch[1]))
  }

  // Try ISO format
  return new Date(dateStr)
}

/**
 * Parse currency value to number
 */
function parseCurrency(value: string | number): number {
  if (typeof value === 'number') return value
  // Remove R$, dots, and convert comma to dot
  const normalized = value.replace(/[R$\s.]/g, '').replace(',', '.')
  return parseFloat(normalized) || 0
}

/**
 * Sort financial items by value (highest first)
 */
export function sortFinancialByValue<T extends FinancialItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const valueA = parseCurrency(a.valor)
    const valueB = parseCurrency(b.valor)
    return valueB - valueA
  })
}

/**
 * Sort mentions by classification:
 * negative > neutral > positive
 */
export function sortMentionsByClassification<T extends MentionItem>(mentions: T[]): T[] {
  const classificationWeight: Record<string, number> = {
    negative: 3,
    neutral: 2,
    positive: 1,
  }

  return [...mentions].sort((a, b) => {
    const weightA = classificationWeight[a.classification || 'neutral'] || 2
    const weightB = classificationWeight[b.classification || 'neutral'] || 2
    return weightB - weightA
  })
}

/**
 * Generate summary line for processes
 * Example: "8 como réu, 3 como autor, 1 testemunha"
 */
export function generateProcessSummary(processes: ProcessData[]): string {
  const counts = {
    reu: 0,
    autor: 0,
    testemunha: 0,
  }

  for (const p of processes) {
    const polo = p.polo?.toLowerCase()
    if (polo === 'reu' || polo === 'réu') {
      counts.reu++
    } else if (polo === 'autor') {
      counts.autor++
    } else if (polo === 'testemunha') {
      counts.testemunha++
    }
  }

  const parts: string[] = []
  if (counts.reu > 0) parts.push(`${counts.reu} como réu`)
  if (counts.autor > 0) parts.push(`${counts.autor} como autor`)
  if (counts.testemunha > 0) parts.push(`${counts.testemunha} como testemunha`)

  return parts.join(', ')
}

/**
 * Generate rich detail for process checklist item
 * Example: "Responde como réu em 2 processos, incluindo 1 trabalhista"
 */
export function generateProcessDetail(processes: ProcessData[]): string {
  if (processes.length === 0) return 'Nenhum processo encontrado'

  const counts = {
    reu: 0,
    autor: 0,
    testemunha: 0,
    trabalhista: 0,
    execucao: 0,
  }

  for (const p of processes) {
    const polo = p.polo?.toLowerCase()
    if (polo === 'reu' || polo === 'réu') counts.reu++
    else if (polo === 'autor') counts.autor++
    else if (polo === 'testemunha') counts.testemunha++

    const classe = p.classe?.toLowerCase() || ''
    if (classe.includes('trabalh')) counts.trabalhista++
    else if (classe.includes('execu')) counts.execucao++
  }

  // Build natural language description
  const parts: string[] = []

  if (counts.reu > 0) {
    let detail = `Responde como réu em ${counts.reu} processo${counts.reu > 1 ? 's' : ''}`
    const tipos: string[] = []
    if (counts.trabalhista > 0) tipos.push(`${counts.trabalhista} trabalhista${counts.trabalhista > 1 ? 's' : ''}`)
    if (counts.execucao > 0) tipos.push(`${counts.execucao} de execução`)
    if (tipos.length > 0) detail += `, incluindo ${tipos.join(' e ')}`
    parts.push(detail)
  }

  if (counts.autor > 0) {
    parts.push(`Moveu ${counts.autor} processo${counts.autor > 1 ? 's' : ''} como autor`)
  }

  if (counts.testemunha > 0) {
    parts.push(`Aparece como testemunha em ${counts.testemunha}`)
  }

  return parts.join('. ')
}

/**
 * Generate summary for financial items
 * Example: "3 protestos, 2 dívidas ativas"
 */
export function generateFinancialSummary(
  protestos: number,
  dividas: number,
  cheques: number
): string {
  const parts: string[] = []
  if (protestos > 0) parts.push(`${protestos} protesto${protestos > 1 ? 's' : ''}`)
  if (dividas > 0) parts.push(`${dividas} dívida${dividas > 1 ? 's' : ''} ativa${dividas > 1 ? 's' : ''}`)
  if (cheques > 0) parts.push(`${cheques} cheque${cheques > 1 ? 's' : ''} devolvido${cheques > 1 ? 's' : ''}`)
  return parts.join(', ')
}

/**
 * Format currency value (values are in BRL, not cents)
 */
function formatCurrencyValue(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

/**
 * Generate rich detail for financial checklist item
 * Example: "3 protestos (R$ 12.450,00), 2 dívidas ativas (R$ 8.200,00)"
 */
export function generateFinancialDetail(
  protestos: { count: number; totalAmount?: number },
  dividas: { count: number; totalAmount?: number },
  cheques: number
): string {
  if (protestos.count === 0 && dividas.count === 0 && cheques === 0) {
    return 'Sem pendências financeiras'
  }

  const parts: string[] = []

  if (protestos.count > 0) {
    let detail = `${protestos.count} protesto${protestos.count > 1 ? 's' : ''}`
    if (protestos.totalAmount && protestos.totalAmount > 0) {
      detail += ` (${formatCurrencyValue(protestos.totalAmount)})`
    }
    parts.push(detail)
  }

  if (dividas.count > 0) {
    let detail = `${dividas.count} dívida${dividas.count > 1 ? 's' : ''} ativa${dividas.count > 1 ? 's' : ''}`
    if (dividas.totalAmount && dividas.totalAmount > 0) {
      detail += ` (${formatCurrencyValue(dividas.totalAmount)})`
    }
    parts.push(detail)
  }

  if (cheques > 0) {
    parts.push(`${cheques} cheque${cheques > 1 ? 's' : ''} devolvido${cheques > 1 ? 's' : ''}`)
  }

  return parts.join(', ')
}

/**
 * Calculate years since a date
 */
export function calculateYearsSince(dateStr: string): number {
  if (!dateStr) return 0
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 0
  const now = new Date()
  const years = now.getFullYear() - date.getFullYear()
  const monthDiff = now.getMonth() - date.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    return years - 1
  }
  return years
}

/**
 * Generate natural language description for a partner/socio
 * Example: "João Silva é sócio-administrador há 4 anos"
 */
export function generatePartnerDescription(
  nome: string,
  qualificacao: string,
  dataEntrada?: string
): string {
  // Normalize qualification
  const qualNorm = qualificacao?.toLowerCase() || ''
  let role = 'sócio'

  if (qualNorm.includes('administrador')) {
    role = 'sócio-administrador'
  } else if (qualNorm.includes('diretor')) {
    role = 'diretor'
  } else if (qualNorm.includes('presidente')) {
    role = 'presidente'
  } else if (qualNorm.includes('gerente')) {
    role = 'gerente'
  } else if (qualNorm.includes('procurador')) {
    role = 'procurador'
  }

  let description = `${nome} é ${role}`

  if (dataEntrada) {
    const years = calculateYearsSince(dataEntrada)
    if (years > 0) {
      description += ` há ${years} ano${years > 1 ? 's' : ''}`
    } else {
      description += ' desde este ano'
    }
  }

  return description
}

/**
 * Generate summary for web mentions
 * Example: "3 negativas, 2 neutras"
 */
export function generateMentionsSummary(mentions: MentionItem[]): string {
  const counts = {
    negative: 0,
    neutral: 0,
    positive: 0,
  }

  for (const m of mentions) {
    const classification = m.classification || 'neutral'
    counts[classification]++
  }

  const parts: string[] = []
  if (counts.negative > 0) parts.push(`${counts.negative} negativa${counts.negative > 1 ? 's' : ''}`)
  if (counts.neutral > 0) parts.push(`${counts.neutral} neutra${counts.neutral > 1 ? 's' : ''}`)
  if (counts.positive > 0) parts.push(`${counts.positive} positiva${counts.positive > 1 ? 's' : ''}`)

  return parts.join(', ')
}
