import { describe, it, expect } from 'vitest'
import {
  isValidCPF,
  isValidCNPJ,
  detectDocumentType,
  formatCPF,
  formatCNPJ,
  formatDocument,
  isValidEmail,
  maskDocument,
  cleanDocument,
} from '@/lib/validators'

describe('CPF Validation', () => {
  it('should validate correct CPF', () => {
    expect(isValidCPF('12345678909')).toBe(true)
    expect(isValidCPF('123.456.789-09')).toBe(true)
  })

  it('should reject CPF with all same digits', () => {
    expect(isValidCPF('11111111111')).toBe(false)
    expect(isValidCPF('000.000.000-00')).toBe(false)
  })

  it('should reject CPF with invalid length', () => {
    expect(isValidCPF('123')).toBe(false)
    expect(isValidCPF('123456789012345')).toBe(false)
  })

  it('should reject CPF with invalid check digits', () => {
    expect(isValidCPF('12345678900')).toBe(false)
  })
})

describe('CNPJ Validation', () => {
  it('should validate correct CNPJ', () => {
    expect(isValidCNPJ('11222333000181')).toBe(true)
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true)
  })

  it('should reject CNPJ with all same digits', () => {
    expect(isValidCNPJ('11111111111111')).toBe(false)
    expect(isValidCNPJ('00.000.000/0000-00')).toBe(false)
  })

  it('should reject CNPJ with invalid length', () => {
    expect(isValidCNPJ('123')).toBe(false)
    expect(isValidCNPJ('123456789012345')).toBe(false)
  })

  it('should reject CNPJ with invalid check digits', () => {
    expect(isValidCNPJ('11222333000180')).toBe(false)
  })
})

describe('Document Type Detection', () => {
  it('should detect CPF', () => {
    expect(detectDocumentType('12345678909')).toBe('cpf')
    expect(detectDocumentType('123.456.789-09')).toBe('cpf')
  })

  it('should detect CNPJ', () => {
    expect(detectDocumentType('11222333000181')).toBe('cnpj')
    expect(detectDocumentType('11.222.333/0001-81')).toBe('cnpj')
  })

  it('should detect invalid documents', () => {
    expect(detectDocumentType('123')).toBe('invalid')
    expect(detectDocumentType('11111111111')).toBe('invalid')
  })
})

describe('Document Formatting', () => {
  it('should format CPF', () => {
    expect(formatCPF('12345678909')).toBe('123.456.789-09')
  })

  it('should format CNPJ', () => {
    expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('should auto-format CPF', () => {
    expect(formatDocument('12345678909')).toBe('123.456.789-09')
  })

  it('should auto-format CNPJ', () => {
    expect(formatDocument('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('should return original value for invalid document', () => {
    expect(formatDocument('123')).toBe('123')
  })
})

describe('Email Validation', () => {
  it('should validate correct email', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user+tag@domain.co.uk')).toBe(true)
  })

  it('should reject invalid email', () => {
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('test@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('test @example.com')).toBe(false)
  })
})

describe('Document Masking', () => {
  it('should mask CPF during typing', () => {
    expect(maskDocument('123')).toBe('123')
    expect(maskDocument('123456')).toBe('123.456')
    expect(maskDocument('123456789')).toBe('123.456.789')
    expect(maskDocument('12345678909')).toBe('123.456.789-09')
  })

  it('should mask CNPJ during typing', () => {
    expect(maskDocument('112223330001')).toBe('11.222.333/0001')
    expect(maskDocument('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('should truncate at 14 digits', () => {
    expect(maskDocument('112223330001819999')).toBe('11.222.333/0001-81')
  })
})

describe('Document Cleaning', () => {
  it('should remove all non-digit characters', () => {
    expect(cleanDocument('123.456.789-09')).toBe('12345678909')
    expect(cleanDocument('11.222.333/0001-81')).toBe('11222333000181')
    expect(cleanDocument('ABC123DEF456')).toBe('123456')
  })
})
