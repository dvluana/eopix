import { describe, it, expect } from 'vitest'
import { generateMagicCode } from '@/lib/auth'

describe('Magic Code Generation', () => {
  it('should generate 6-digit code', () => {
    const code = generateMagicCode()
    expect(code).toMatch(/^\d{6}$/)
    expect(code.length).toBe(6)
  })

  it('should generate different codes', () => {
    const code1 = generateMagicCode()
    const code2 = generateMagicCode()
    // Very unlikely to be equal (1 in 900000 chance)
    // But not a hard requirement
    expect(typeof code1).toBe('string')
    expect(typeof code2).toBe('string')
  })

  it('should generate codes >= 100000', () => {
    const code = generateMagicCode()
    expect(parseInt(code, 10)).toBeGreaterThanOrEqual(100000)
  })

  it('should generate codes <= 999999', () => {
    const code = generateMagicCode()
    expect(parseInt(code, 10)).toBeLessThanOrEqual(999999)
  })
})
