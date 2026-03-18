import { describe, it, expect, vi } from 'vitest'

// Mock Resend before any imports that transitively use it
const mockSend = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null })
)

vi.mock('resend', () => {
  class MockResend {
    emails = { send: mockSend }
  }
  return { Resend: MockResend }
})

import { functions } from '@/lib/inngest/crons'
import { processSearch } from '@/lib/inngest/process-search'
import { abandonmentEmailSequence } from '@/lib/inngest/abandonment-emails'

describe('Inngest functions export', () => {
  it('should include processSearch in the functions array', () => {
    expect(functions).toContain(processSearch)
  })

  it('should include abandonmentEmailSequence in the functions array', () => {
    expect(functions).toContain(abandonmentEmailSequence)
  })

  it('should have exactly 6 functions (4 crons + processSearch + abandonmentEmailSequence)', () => {
    expect(functions).toHaveLength(6)
  })
})
