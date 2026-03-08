import { describe, it, expect } from 'vitest'
import { validateCanProcess } from '../../src/lib/purchase-workflow'

describe('validateCanProcess', () => {
  it('allows PAID → PROCESSING', () => {
    expect(validateCanProcess('PAID', false).ok).toBe(true)
  })

  it('allows FAILED → PROCESSING (reprocess)', () => {
    expect(validateCanProcess('FAILED', false).ok).toBe(true)
  })

  it('rejects FAILED with existing report', () => {
    expect(validateCanProcess('FAILED', true).ok).toBe(false)
  })

  it('rejects COMPLETED', () => {
    expect(validateCanProcess('COMPLETED', false).ok).toBe(false)
  })

  it('rejects REFUNDED', () => {
    expect(validateCanProcess('REFUNDED', false).ok).toBe(false)
  })
})
