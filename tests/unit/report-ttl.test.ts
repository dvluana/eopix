import { describe, it, expect, beforeEach } from 'vitest'
import { getReportTtlHours, getReportExpiresAt } from '@/lib/report-ttl'

describe('report ttl', () => {
  const originalTtl = process.env.REPORT_TTL_HOURS

  beforeEach(() => {
    if (originalTtl === undefined) {
      delete process.env.REPORT_TTL_HOURS
    } else {
      process.env.REPORT_TTL_HOURS = originalTtl
    }
  })

  it('uses default ttl when env is absent', () => {
    delete process.env.REPORT_TTL_HOURS
    expect(getReportTtlHours()).toBe(168)
  })

  it('uses configured ttl when env is valid', () => {
    process.env.REPORT_TTL_HOURS = '72'
    expect(getReportTtlHours()).toBe(72)
  })

  it('falls back to default for invalid env value', () => {
    process.env.REPORT_TTL_HOURS = 'invalid'
    expect(getReportTtlHours()).toBe(168)
  })

  it('computes expiresAt based on ttl', () => {
    process.env.REPORT_TTL_HOURS = '1'
    const now = Date.now()
    const expiresAt = getReportExpiresAt().getTime()
    const delta = expiresAt - now
    expect(delta).toBeGreaterThanOrEqual(59 * 60 * 1000)
    expect(delta).toBeLessThanOrEqual(61 * 60 * 1000)
  })
})
