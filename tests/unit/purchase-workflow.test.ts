import { describe, it, expect } from 'vitest'
import {
  validateCanMarkPaid,
  validateCanProcess,
  validateCanMarkPaidAndProcess,
} from '@/lib/purchase-workflow'

describe('purchase workflow validations', () => {
  it('allows mark paid from PENDING without report', () => {
    const result = validateCanMarkPaid('PENDING', false)
    expect(result.ok).toBe(true)
  })

  it('blocks mark paid when status is PAID', () => {
    const result = validateCanMarkPaid('PAID', false)
    expect(result.ok).toBe(false)
    expect(result.status).toBe(409)
  })

  it('allows process only from PAID', () => {
    expect(validateCanProcess('PAID', false).ok).toBe(true)
    expect(validateCanProcess('PENDING', false).ok).toBe(false)
  })

  it('blocks processing when report already exists', () => {
    const result = validateCanProcess('PAID', true)
    expect(result.ok).toBe(false)
    expect(result.status).toBe(400)
  })

  it('allows mark-paid-and-process only from PENDING', () => {
    expect(validateCanMarkPaidAndProcess('PENDING', false).ok).toBe(true)
    expect(validateCanMarkPaidAndProcess('PAID', false).ok).toBe(false)
  })
})
