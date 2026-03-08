import { describe, it, expect } from 'vitest'
import { simplifyCompanyName } from '@/lib/google-search'

describe('simplifyCompanyName', () => {
  it('removes S/A suffix', () => {
    expect(simplifyCompanyName('BANCO MASTER S/A')).toBe('Banco Master')
  })

  it('removes S.A. suffix', () => {
    expect(simplifyCompanyName('PETROBRAS S.A.')).toBe('Petrobras')
  })

  it('removes LTDA suffix', () => {
    expect(simplifyCompanyName('COMERCIO SILVA LTDA')).toBe('Comercio Silva')
  })

  it('removes EM LIQUIDACAO EXTRAJUDICIAL', () => {
    expect(simplifyCompanyName('BANCO MASTER S/A - EM LIQUIDACAO EXTRAJUDICIAL')).toBe('Banco Master')
  })

  it('removes EM RECUPERACAO JUDICIAL', () => {
    expect(simplifyCompanyName('EMPRESA XYZ LTDA - EM RECUPERACAO JUDICIAL')).toBe('Empresa Xyz')
  })

  it('removes ME, MEI, EIRELI, EPP', () => {
    expect(simplifyCompanyName('JOAO SILVA ME')).toBe('Joao Silva')
    expect(simplifyCompanyName('MARIA SANTOS MEI')).toBe('Maria Santos')
    expect(simplifyCompanyName('TECH CORP EIRELI')).toBe('Tech Corp')
    expect(simplifyCompanyName('LOJA LEGAL EPP')).toBe('Loja Legal')
  })

  it('removes trailing dash and spaces', () => {
    expect(simplifyCompanyName('EMPRESA ABC - ')).toBe('Empresa Abc')
  })

  it('converts to title case', () => {
    expect(simplifyCompanyName('BANCO DO BRASIL S.A.')).toBe('Banco Do Brasil')
  })

  it('handles already clean names', () => {
    expect(simplifyCompanyName('GOOGLE')).toBe('Google')
  })
})
