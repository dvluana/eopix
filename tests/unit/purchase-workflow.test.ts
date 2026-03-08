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

  it('blocks mark-paid when report already exists regardless of status', () => {
    const statuses = ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']
    for (const status of statuses) {
      const result = validateCanMarkPaid(status, true)
      expect(result.ok).toBe(false)
      expect(result.status).toBe(400)
    }
  })

  it('blocks process transitions for invalid states', () => {
    const invalidStatuses = ['PENDING', 'COMPLETED', 'REFUNDED', 'REFUND_FAILED']
    for (const status of invalidStatuses) {
      const result = validateCanProcess(status, false)
      expect(result.ok).toBe(false)
    }
  })

  it('allows reprocess from PROCESSING (stuck retry) and FAILED', () => {
    expect(validateCanProcess('PROCESSING', false).ok).toBe(true)
    expect(validateCanProcess('FAILED', false).ok).toBe(true)
  })

  it('blocks mark-paid-and-process transitions for invalid states', () => {
    const invalidStatuses = ['PAID', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'REFUND_FAILED']
    for (const status of invalidStatuses) {
      const result = validateCanMarkPaidAndProcess(status, false)
      expect(result.ok).toBe(false)
    }
  })
})
