import { describe, it, expect } from 'vitest'
import {
  sortProcessesByGravity,
  sortFinancialByValue,
  sortMentionsByClassification,
  generateProcessSummary,
  generateProcessDetail,
  generateFinancialSummary,
  generateFinancialDetail,
  calculateYearsSince,
  generatePartnerDescription,
  generateMentionsSummary,
} from '@/lib/report-utils'

describe('sortProcessesByGravity', () => {
  it('should sort by polo weight (réu > autor > testemunha)', () => {
    const processes = [
      { tribunal: 'TST', date: '01/01/2024', classe: 'Trabalhista', polo: 'testemunha' },
      { tribunal: 'TST', date: '01/01/2024', classe: 'Trabalhista', polo: 'autor' },
      { tribunal: 'TST', date: '01/01/2024', classe: 'Trabalhista', polo: 'réu' },
    ]
    const sorted = sortProcessesByGravity(processes)
    expect(sorted[0].polo).toBe('réu')
    expect(sorted[1].polo).toBe('autor')
    expect(sorted[2].polo).toBe('testemunha')
  })

  it('should sort by date when polo is equal', () => {
    const processes = [
      { tribunal: 'TST', date: '01/01/2023', classe: 'Trabalhista', polo: 'réu' },
      { tribunal: 'TST', date: '01/01/2024', classe: 'Trabalhista', polo: 'réu' },
    ]
    const sorted = sortProcessesByGravity(processes)
    expect(sorted[0].date).toBe('01/01/2024')
  })
})

describe('sortFinancialByValue', () => {
  it('should sort by value descending', () => {
    const items = [
      { valor: 'R$ 1.000,00' },
      { valor: 'R$ 5.000,00' },
      { valor: 'R$ 500,00' },
    ]
    const sorted = sortFinancialByValue(items)
    expect(sorted[0].valor).toBe('R$ 5.000,00')
    expect(sorted[2].valor).toBe('R$ 500,00')
  })

  it('should handle numeric values', () => {
    const items = [
      { valor: 1000 },
      { valor: 5000 },
    ]
    const sorted = sortFinancialByValue(items)
    expect(sorted[0].valor).toBe(5000)
  })
})

describe('sortMentionsByClassification', () => {
  it('should sort by classification (negative > neutral > positive)', () => {
    const mentions = [
      { classification: 'positive' as const },
      { classification: 'negative' as const },
      { classification: 'neutral' as const },
    ]
    const sorted = sortMentionsByClassification(mentions)
    expect(sorted[0].classification).toBe('negative')
    expect(sorted[1].classification).toBe('neutral')
    expect(sorted[2].classification).toBe('positive')
  })
})

describe('generateProcessSummary', () => {
  it('should generate summary with all types', () => {
    const processes = [
      { tribunal: 'TST', date: '01/01/2024', classe: 'Trabalhista', polo: 'réu' },
      { tribunal: 'TST', date: '01/01/2024', classe: 'Trabalhista', polo: 'réu' },
      { tribunal: 'TST', date: '01/01/2024', classe: 'Trabalhista', polo: 'autor' },
      { tribunal: 'TST', date: '01/01/2024', classe: 'Trabalhista', polo: 'testemunha' },
    ]
    const summary = generateProcessSummary(processes)
    expect(summary).toBe('2 como réu, 1 como autor, 1 como testemunha')
  })

  it('should handle empty processes', () => {
    const summary = generateProcessSummary([])
    expect(summary).toBe('')
  })
})

describe('generateProcessDetail', () => {
  it('should generate rich detail', () => {
    const processes = [
      { tribunal: 'TST', date: '01/01/2024', classe: 'Trabalhista', polo: 'réu' },
      { tribunal: 'TST', date: '01/01/2024', classe: 'Trabalhista', polo: 'réu' },
    ]
    const detail = generateProcessDetail(processes)
    expect(detail).toContain('Responde como réu em 2 processos')
    expect(detail).toContain('2 trabalhistas')
  })

  it('should handle empty processes', () => {
    const detail = generateProcessDetail([])
    expect(detail).toBe('Nenhum processo encontrado')
  })
})

describe('generateFinancialSummary', () => {
  it('should generate summary for all types', () => {
    const summary = generateFinancialSummary(3, 2, 1)
    expect(summary).toBe('3 protestos, 2 dívidas ativas, 1 cheque devolvido')
  })

  it('should use plural correctly', () => {
    const summary = generateFinancialSummary(1, 1, 1)
    expect(summary).toBe('1 protesto, 1 dívida ativa, 1 cheque devolvido')
  })

  it('should handle zeros', () => {
    const summary = generateFinancialSummary(1, 0, 0)
    expect(summary).toBe('1 protesto')
  })
})

describe('generateFinancialDetail', () => {
  it('should generate detail with amounts', () => {
    const detail = generateFinancialDetail(
      { count: 3, totalAmount: 12450 },
      { count: 2, totalAmount: 8200 },
      1
    )
    expect(detail).toContain('3 protestos')
    expect(detail).toContain('R$')
    expect(detail).toContain('12.450,00')
  })

  it('should handle no financial issues', () => {
    const detail = generateFinancialDetail(
      { count: 0 },
      { count: 0 },
      0
    )
    expect(detail).toBe('Sem pendências financeiras')
  })
})

describe('calculateYearsSince', () => {
  it('should calculate years correctly', () => {
    const fiveYearsAgo = new Date()
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
    const years = calculateYearsSince(fiveYearsAgo.toISOString())
    expect(years).toBe(5)
  })

  it('should handle empty date', () => {
    expect(calculateYearsSince('')).toBe(0)
  })

  it('should handle invalid date', () => {
    expect(calculateYearsSince('invalid')).toBe(0)
  })
})

describe('generatePartnerDescription', () => {
  it('should generate description with years', () => {
    const fourYearsAgo = new Date()
    fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4)
    const description = generatePartnerDescription(
      'João Silva',
      'Sócio-Administrador',
      fourYearsAgo.toISOString()
    )
    expect(description).toContain('João Silva')
    expect(description).toContain('sócio-administrador')
    expect(description).toContain('há 4 anos')
  })

  it('should handle recent entry', () => {
    const thisYear = new Date().toISOString()
    const description = generatePartnerDescription(
      'João Silva',
      'Sócio',
      thisYear
    )
    expect(description).toContain('desde este ano')
  })

  it('should detect different roles', () => {
    expect(generatePartnerDescription('A', 'Diretor')).toContain('diretor')
    expect(generatePartnerDescription('B', 'Presidente')).toContain('presidente')
    expect(generatePartnerDescription('C', 'Gerente')).toContain('gerente')
  })
})

describe('generateMentionsSummary', () => {
  it('should generate summary with all classifications', () => {
    const mentions = [
      { classification: 'negative' as const },
      { classification: 'negative' as const },
      { classification: 'neutral' as const },
      { classification: 'positive' as const },
    ]
    const summary = generateMentionsSummary(mentions)
    expect(summary).toBe('2 negativas, 1 neutra, 1 positiva')
  })

  it('should handle empty mentions', () => {
    const summary = generateMentionsSummary([])
    expect(summary).toBe('')
  })

  it('should default to neutral when classification is missing', () => {
    const mentions = [{ }]
    const summary = generateMentionsSummary(mentions)
    expect(summary).toBe('1 neutra')
  })
})
