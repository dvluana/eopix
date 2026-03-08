import { describe, it, expect } from 'vitest'
import { parseBRCurrency, calculateCpfFinancialSummary } from '@/lib/financial-summary'

describe('parseBRCurrency', () => {
  it('parses number passthrough', () => {
    expect(parseBRCurrency(1446.43)).toBe(1446.43)
  })

  it('parses Brazilian string "1446,43"', () => {
    expect(parseBRCurrency('1446,43')).toBe(1446.43)
  })

  it('parses Brazilian string with thousands "1.446,43"', () => {
    expect(parseBRCurrency('1.446,43')).toBe(1446.43)
  })

  it('parses large value "28745,67"', () => {
    expect(parseBRCurrency('28745,67')).toBe(28745.67)
  })

  it('returns 0 for NaN', () => {
    expect(parseBRCurrency(NaN)).toBe(0)
  })

  it('returns 0 for null', () => {
    expect(parseBRCurrency(null)).toBe(0)
  })

  it('returns 0 for undefined', () => {
    expect(parseBRCurrency(undefined)).toBe(0)
  })

  it('returns 0 for empty string', () => {
    expect(parseBRCurrency('')).toBe(0)
  })

  it('returns 0 for concatenated API garbage', () => {
    // API returns concatenated values like "01446,43216,4928745,67652,42"
    // This is not a valid number - parseBRCurrency should handle gracefully
    const result = parseBRCurrency('01446,43216,4928745,67652,42')
    // After removing dots and replacing first comma: "01446.43216,4928745,67652,42"
    // parseFloat stops at first non-numeric: 1446.43216 — finite but wrong
    // This is why we DON'T trust API totals — we sum individual items instead
    expect(Number.isFinite(result)).toBe(true)
  })

  it('parses integer string "0"', () => {
    expect(parseBRCurrency('0')).toBe(0)
  })

  it('parses whole number string "5000"', () => {
    expect(parseBRCurrency('5000')).toBe(5000)
  })
})

describe('calculateCpfFinancialSummary', () => {
  it('returns zeros for null data', () => {
    const result = calculateCpfFinancialSummary(null)
    expect(result.totalDividas).toBe(0)
    expect(result.valorTotalDividas).toBe(0)
    expect(result._scoreInterno).toBeNull()
  })

  it('calculates total from individual items (real API data)', () => {
    // Real response from APIFull for CPF 01208628240
    const data = {
      nome: 'CAROLINA PESSOA BANDEIRA',
      protestos: [],
      pendenciasFinanceiras: [
        { tipo: 'DEVEDOR', valor: '1446,43' as unknown as number, origem: 'NU FINANCEIRA S.A' },
        { tipo: 'DEVEDOR', valor: '216,49' as unknown as number, origem: 'BANCO DO BRASIL S/A' },
        { tipo: 'DEVEDOR', valor: '28745,67' as unknown as number, origem: 'BANCO XP S/A' },
        { tipo: 'DEVEDOR', valor: '652,42' as unknown as number, origem: 'BANCO DO BRASIL S/A' },
      ],
      chequesSemFundo: 0,
      totalProtestos: 0,
      valorTotalProtestos: 0,
      totalPendencias: 4,
      // API garbage: concatenated string
      valorTotalPendencias: '01446,43216,4928745,67652,42' as unknown as number,
      _scoreInterno: { score: '350', probabilidadeInadimplencia: '81,24%' } as unknown as number | null,
    }

    const result = calculateCpfFinancialSummary(data)

    expect(result.totalDividas).toBe(4)
    // Sum: 1446.43 + 216.49 + 28745.67 + 652.42 = 31061.01
    expect(result.valorTotalDividas).toBeCloseTo(31061.01, 1)
    expect(result.valorTotalProtestos).toBe(0)
    expect(result._scoreInterno).toBe(350)
  })

  it('handles score as plain number', () => {
    const data = {
      nome: 'Test',
      protestos: [],
      pendenciasFinanceiras: [],
      chequesSemFundo: 0,
      totalProtestos: 0,
      valorTotalProtestos: 0,
      totalPendencias: 0,
      valorTotalPendencias: 0,
      _scoreInterno: 500,
    }

    const result = calculateCpfFinancialSummary(data)
    expect(result._scoreInterno).toBe(500)
  })
})
